import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Stock validation for multiple products
interface StockCheckRequest {
  items: {
    productId: string
    requestedQuantity: number
  }[]
}

interface StockCheckResponse {
  isValid: boolean
  items: {
    productId: string
    available: boolean
    stockQuantity: number
    requestedQuantity: number
    maxAllowed: number
    message: string
  }[]
  errors: string[]
}

// GET: Check individual product stock
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
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

    // Get current product stock with atomic read
    const product = await db.product.findUnique({
      where: { 
        id: productId,
        status: 'PUBLISHED' // Only check stock for published products
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        status: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      )
    }

    const isAvailable = product.stockQuantity >= quantity
    const maxAllowed = Math.max(0, product.stockQuantity)

    return NextResponse.json({
      productId: product.id,
      available: isAvailable,
      stockQuantity: product.stockQuantity,
      requestedQuantity: quantity,
      maxAllowed,
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

// POST: Check stock for multiple items (cart validation)
export async function POST(request: NextRequest) {
  try {
    const { items }: StockCheckRequest = await request.json()

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
          { error: 'Invalid item format. Each item must have productId and positive requestedQuantity' },
          { status: 400 }
        )
      }
    }

    // Get all product IDs
    const productIds = items.map(item => item.productId)

    // Fetch current stock for all products in a single query
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        status: 'PUBLISHED' // Only check published products
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        status: true
      }
    })

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]))

    const response: StockCheckResponse = {
      isValid: true,
      items: [],
      errors: []
    }

    // Check each requested item
    for (const item of items) {
      const product = productMap.get(item.productId)
      
      if (!product) {
        response.isValid = false
        response.errors.push(`Product ${item.productId} not found or not available`)
        response.items.push({
          productId: item.productId,
          available: false,
          stockQuantity: 0,
          requestedQuantity: item.requestedQuantity,
          maxAllowed: 0,
          message: 'Product not found or not available'
        })
        continue
      }

      const isAvailable = product.stockQuantity >= item.requestedQuantity
      const maxAllowed = Math.max(0, product.stockQuantity)

      if (!isAvailable) {
        response.isValid = false
        if (product.stockQuantity === 0) {
          response.errors.push(`${product.name} is out of stock`)
        } else {
          response.errors.push(`${product.name}: Only ${product.stockQuantity} available, but ${item.requestedQuantity} requested`)
        }
      }

      response.items.push({
        productId: item.productId,
        available: isAvailable,
        stockQuantity: product.stockQuantity,
        requestedQuantity: item.requestedQuantity,
        maxAllowed,
        message: isAvailable 
          ? `${item.requestedQuantity} item(s) available`
          : product.stockQuantity === 0 
            ? 'Out of stock' 
            : `Only ${product.stockQuantity} item(s) available (requested ${item.requestedQuantity})`
      })
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

// PUT: Reserve stock temporarily (for checkout process)
export async function PUT(request: NextRequest) {
  try {
    const { items, reservationId }: { items: StockCheckRequest['items'], reservationId: string } = await request.json()

    if (!items || !Array.isArray(items) || !reservationId) {
      return NextResponse.json(
        { error: 'Items array and reservationId are required' },
        { status: 400 }
      )
    }

    // Validate request format
    for (const item of items) {
      if (!item.productId || typeof item.requestedQuantity !== 'number' || item.requestedQuantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item format' },
          { status: 400 }
        )
      }
    }

    // Do a comprehensive stock check first
    const stockCheckResponse = await POST(new NextRequest(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    }))

    const stockResult = await stockCheckResponse.json()

    if (!stockResult.isValid) {
      return NextResponse.json({
        reserved: false,
        errors: stockResult.errors,
        items: stockResult.items
      }, { status: 409 }) // Conflict - stock not available
    }

    // TODO: Implement actual stock reservation logic
    // This would typically involve creating reservation records with expiry times
    // For now, we'll return a successful reservation response
    
    return NextResponse.json({
      reserved: true,
      reservationId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      items: stockResult.items
    })

  } catch (error) {
    console.error('Stock reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to reserve stock' },
      { status: 500 }
    )
  }
}

// DELETE: Cancel stock reservation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('reservationId')

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual reservation cancellation
    // This would remove the reservation record from the database
    
    return NextResponse.json({
      cancelled: true,
      reservationId
    })

  } catch (error) {
    console.error('Stock reservation cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}