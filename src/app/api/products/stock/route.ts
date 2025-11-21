// ✅ COMPLETE FIXED: /src/app/api/products/stock/route.ts
// Fixed all TypeScript type errors with proper interfaces

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

// ✅ FIXED: Proper TypeScript interfaces
interface StockCheckItem {
  productId: string
  requestedQuantity: number
  sizeId?: string
}

interface StockValidationItem {
  productId: string
  available: boolean
  stockQuantity: number
  requestedQuantity: number
  maxAllowed: number
  message: string
}

interface StockValidationResponse {
  isValid: boolean
  items: StockValidationItem[]
  errors: string[]
}

interface SingleStockResponse {
  productId: string
  available: boolean
  stockQuantity: number
  requestedQuantity: number
  maxAllowed: number
  requiresSize: boolean
  message: string
}

// GET: Check stock for a single product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productIdParam = searchParams.get('productId')
    const quantityParam = searchParams.get('quantity')

    if (!productIdParam || !quantityParam) {
      return NextResponse.json(
        { error: 'productId and quantity parameters are required' },
        { status: 400 }
      )
    }

    const quantity = parseInt(quantityParam)
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'quantity must be a positive number' },
        { status: 400 }
      )
    }

    // Handle product ID with potential size suffix (productId-sizeId)
    const actualProductId = productIdParam.includes('-') 
      ? productIdParam.split('-')[0] 
      : productIdParam
    const sizeId = productIdParam.includes('-') 
      ? productIdParam.split('-')[1] 
      : null

    // Fetch product with sizes
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
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Handle sized products
    if (product.requiresSizes && product.productSizes.length > 0) {
      if (!sizeId) {
        return NextResponse.json({
          productId: actualProductId,
          available: false,
          stockQuantity: 0,
          requestedQuantity: quantity,
          maxAllowed: 0,
          requiresSize: true,
          message: 'Size selection required'
        } as SingleStockResponse)
      }

      const selectedSize = product.productSizes.find(size => size.id === sizeId)
      
      if (!selectedSize) {
        return NextResponse.json({
          productId: actualProductId,
          available: false,
          stockQuantity: 0,
          requestedQuantity: quantity,
          maxAllowed: 0,
          requiresSize: true,
          message: 'Size not available'
        } as SingleStockResponse)
      }

      const isAvailable = selectedSize.stockQuantity >= quantity
      const maxAllowed = Math.max(0, selectedSize.stockQuantity)

      return NextResponse.json({
        productId: actualProductId,
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
      } as SingleStockResponse)
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
    } as SingleStockResponse)

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
    const body = await request.json()
    const { items }: { items: StockCheckItem[] } = body

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

    // ✅ FIXED: Use Array.from instead of spread operator to avoid downlevelIteration issue
    const productIds = Array.from(new Set(items.map(item => {
      return item.productId.includes('-') ? item.productId.split('-')[0] : item.productId
    })))

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

    // ✅ FIXED: Properly typed response object
    const response: StockValidationResponse = {
      isValid: true,
      items: [],
      errors: []
    }

    // Check each requested item
    for (const item of items) {
      const actualProductId = item.productId.includes('-') 
        ? item.productId.split('-')[0] 
        : item.productId
      const sizeId = item.sizeId || (item.productId.includes('-') 
        ? item.productId.split('-')[1] 
        : null)
      
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