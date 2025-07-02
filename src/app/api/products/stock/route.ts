// ✅ FIXED: src/app/api/products/stock/route.ts
// Enhanced to handle size variants properly

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Check individual product stock (enhanced for size variants)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const sizeId = searchParams.get('sizeId')
    const quantity = parseInt(searchParams.get('quantity') || '1')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    // Handle compound productId (for legacy support)
    const actualProductId = productId.includes('-') ? productId.split('-')[0] : productId
    const actualSizeId = sizeId || (productId.includes('-') ? productId.split('-')[1] : null)

    // Get product with size information
    const product = await db.product.findUnique({
      where: { 
        id: actualProductId,
        status: 'PUBLISHED'
      },
      include: {
        productSizes: {
          where: { isActive: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      )
    }

    // For products that require sizes
    if (product.requiresSizes && product.productSizes.length > 0) {
      if (!actualSizeId) {
        return NextResponse.json(
          { error: 'Size selection required for this product' },
          { status: 400 }
        )
      }

      // Find the specific size
      const selectedSize = product.productSizes.find(size => size.id === actualSizeId)
      
      if (!selectedSize) {
        return NextResponse.json(
          { error: 'Selected size not found or not available' },
          { status: 404 }
        )
      }

      const isAvailable = selectedSize.stockQuantity >= quantity
      const maxAllowed = Math.max(0, selectedSize.stockQuantity)

      return NextResponse.json({
        productId: actualProductId,
        sizeId: actualSizeId,
        available: isAvailable,
        stockQuantity: selectedSize.stockQuantity,
        requestedQuantity: quantity,
        maxAllowed,
        requiresSize: true,
        message: isAvailable 
          ? `${quantity} item(s) available in size ${selectedSize.size}`
          : selectedSize.stockQuantity === 0 
            ? `Size ${selectedSize.size} is out of stock` 
            : `Only ${selectedSize.stockQuantity} item(s) available in size ${selectedSize.size}`
      })
    }

    // For products without sizes
    const isAvailable = product.stockQuantity >= quantity
    const maxAllowed = Math.max(0, product.stockQuantity)

    return NextResponse.json({
      productId: actualProductId,
      available: isAvailable,
      stockQuantity: product.stockQuantity,
      requestedQuantity: quantity,
      maxAllowed,
      requiresSize: false,
      message: isAvailable 
        ? `${quantity} item(s) available`
        : product.stockQuantity === 0 
          ? 'Out of stock' 
          : `Only ${product.stockQuantity} item(s) available`
    })

  } catch (error) {
    console.error('Stock check error:', error)
    return NextResponse.json(
      { error: 'Failed to check stock availability' },
      { status: 500 }
    )
  }
}

// POST: Check stock for multiple items (enhanced for cart validation)
export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Validate request format
    for (const item of items) {
      if (!item.productId || typeof item.requestedQuantity !== 'number' || item.requestedQuantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have productId and positive requestedQuantity' },
          { status: 400 }
        )
      }
    }

    // Group items by actual product ID and collect size IDs
    const productIds = [...new Set(items.map(item => {
      return item.productId.includes('-') ? item.productId.split('-')[0] : item.productId
    }))]

    // Fetch all products with sizes
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        status: 'PUBLISHED'
      },
      include: {
        productSizes: {
          where: { isActive: true }
        }
      }
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    const response = {
      isValid: true,
      items: [],
      errors: []
    }

    // Check each requested item
    for (const item of items) {
      const actualProductId = item.productId.includes('-') ? item.productId.split('-')[0] : item.productId
      const sizeId = item.sizeId || (item.productId.includes('-') ? item.productId.split('-')[1] : null)
      
      const product = productMap.get(actualProductId)
      
      if (!product) {
        response.isValid = false
        response.errors.push(`Product ${actualProductId} not found`)
        response.items.push({
          productId: item.productId,
          available: false,
          stockQuantity: 0,
          requestedQuantity: item.requestedQuantity,
          maxAllowed: 0,
          message: 'Product not found'
        })
        continue
      }

      // Handle sized products
      if (product.requiresSizes && product.productSizes.length > 0) {
        if (!sizeId) {
          response.isValid = false
          response.errors.push(`Size required for ${product.name}`)
          response.items.push({
            productId: item.productId,
            available: false,
            stockQuantity: 0,
            requestedQuantity: item.requestedQuantity,
            maxAllowed: 0,
            message: 'Size selection required'
          })
          continue
        }

        const selectedSize = product.productSizes.find(size => size.id === sizeId)
        
        if (!selectedSize) {
          response.isValid = false
          response.errors.push(`Size not found for ${product.name}`)
          response.items.push({
            productId: item.productId,
            available: false,
            stockQuantity: 0,
            requestedQuantity: item.requestedQuantity,
            maxAllowed: 0,
            message: 'Size not available'
          })
          continue
        }

        const isAvailable = selectedSize.stockQuantity >= item.requestedQuantity
        if (!isAvailable) {
          response.isValid = false
          response.errors.push(`Insufficient stock for ${product.name} size ${selectedSize.size}`)
        }

        response.items.push({
          productId: item.productId,
          available: isAvailable,
          stockQuantity: selectedSize.stockQuantity,
          requestedQuantity: item.requestedQuantity,
          maxAllowed: selectedSize.stockQuantity,
          message: isAvailable 
            ? `Available in size ${selectedSize.size}`
            : `Only ${selectedSize.stockQuantity} available in size ${selectedSize.size}`
        })
      } else {
        // Handle non-sized products
        const isAvailable = product.stockQuantity >= item.requestedQuantity
        if (!isAvailable) {
          response.isValid = false
          response.errors.push(`Insufficient stock for ${product.name}`)
        }

        response.items.push({
          productId: item.productId,
          available: isAvailable,
          stockQuantity: product.stockQuantity,
          requestedQuantity: item.requestedQuantity,
          maxAllowed: product.stockQuantity,
          message: isAvailable 
            ? 'Available'
            : `Only ${product.stockQuantity} available`
        })
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Bulk stock check error:', error)
    return NextResponse.json(
      { error: 'Failed to check stock availability' },
      { status: 500 }
    )
  }
}