import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { parseShippingAddress } from '@/lib/shipping-utils'

// Order request interfaces
interface OrderCreateRequest {
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
  items: {
    productId: string
    quantity: number
    pricePerItem: number
    totalPrice: number
  }[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
}

// Enhanced order validation
function validateOrderData(data: OrderCreateRequest): string | null {
  // Customer info validation
  if (!data.customerInfo?.firstName?.trim()) return 'First name is required'
  if (!data.customerInfo?.lastName?.trim()) return 'Last name is required'
  if (!data.customerInfo?.email?.trim()) return 'Email is required'
  if (!data.customerInfo?.phone?.trim()) return 'Phone number is required'

  // Shipping address validation
  if (!data.shippingAddress?.street?.trim()) return 'Street address is required'
  if (!data.shippingAddress?.city?.trim()) return 'City is required'
  if (!data.shippingAddress?.state?.trim()) return 'State is required'
  if (!data.shippingAddress?.postalCode?.trim()) return 'Postal code is required'
  if (!data.shippingAddress?.country?.trim()) return 'Country is required'

  // Items validation
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return 'Order must contain at least one item'
  }

  // Validate each item
  for (const item of data.items) {
    if (!item.productId?.trim()) return 'Product ID is required for all items'
    if (!item.quantity || item.quantity <= 0) return 'Valid quantity is required for all items'
    if (!item.pricePerItem || item.pricePerItem < 0) return 'Valid price is required for all items'
    if (!item.totalPrice || item.totalPrice < 0) return 'Valid total price is required for all items'
  }

  // Financial validation
  if (!data.subtotal || data.subtotal < 0) return 'Valid subtotal is required'
  if (data.shipping < 0) return 'Valid shipping cost is required'
  if (data.tax < 0) return 'Valid tax amount is required'
  if (!data.total || data.total < 0) return 'Valid total is required'
  if (!data.currency?.trim()) return 'Currency is required'

  return null
}

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `HCO-${timestamp.toUpperCase()}-${random.toUpperCase()}`
}

// Payment method mapping
const paymentMethodMap = {
  'credit_card': 'CARD',      // ✅ FIXED: Map to CARD (not CREDIT_CARD)
  'debit_card': 'CARD',       // ✅ FIXED: Map to CARD (not DEBIT_CARD)
  'paypal': 'OTHER',          // ✅ FIXED: Map to OTHER (PAYPAL not in enum)
  'bank_transfer': 'BANK_TRANSFER'  // ✅ This one is correct
} as const

// Create order with enhanced atomic stock management
async function createOrderWithStockManagement(data: OrderCreateRequest) {
  // Use serializable transaction to prevent race conditions
  return await db.$transaction(async (tx) => {
    const orderNumber = generateOrderNumber()
    
    // Step 1: Lock and validate all products with their current stock
    const productIds = data.items.map(item => item.productId)
    
    // Get products with FOR UPDATE lock to prevent concurrent modifications
    const products = await tx.$queryRaw<Array<{
      id: string
      name: string
      stockQuantity: number
      sellingPriceUSD: number
      status: string
    }>>`
      SELECT id, name, "stockQuantity", "sellingPriceUSD", status
      FROM "Product" 
      WHERE id = ANY(${productIds}::text[]) AND status = 'PUBLISHED'
      FOR UPDATE
    `
    
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id)
      const missingIds = productIds.filter(id => !foundIds.includes(id))
      throw new Error(`Products not found or not available: ${missingIds.join(', ')}`)
    }

    // Create product map for validation
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // Step 2: Validate stock and prices for each item
    const stockUpdates: Array<{ productId: string, decrementBy: number }> = []
    
    for (const item of data.items) {
      const product = productMap.get(item.productId)!
      
      // Check stock availability
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`)
      }
      
      // Verify price hasn't changed (allow small variance for currency conversion)
      const priceDifference = Math.abs(product.sellingPriceUSD - item.pricePerItem)
      if (priceDifference > 0.01) {
        throw new Error(`Price has changed for product: ${product.name}. Current: $${product.sellingPriceUSD}, Provided: $${item.pricePerItem}`)
      }
      
      stockUpdates.push({
        productId: item.productId,
        decrementBy: item.quantity
      })
    }

    // Step 3: Create the order
    const shippingAddressJson = JSON.stringify(data.shippingAddress)
    
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerName: `${data.customerInfo.firstName} ${data.customerInfo.lastName}`,
        customerEmail: data.customerInfo.email,
        customerPhone: data.customerInfo.phone,
        shippingAddress: shippingAddressJson,
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        total: data.total,
        currency: data.currency,
        paymentMethod: paymentMethodMap[data.paymentMethod],
        paymentStatus: 'PENDING',
        status: 'PENDING'
      }
    })

    // Step 4: Create order items
    const orderItems = await Promise.all(
      data.items.map(item =>
        tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
            totalPrice: item.totalPrice
          }
        })
      )
    )

    // Step 5: Update stock quantities atomically
    for (const update of stockUpdates) {
      await tx.product.update({
        where: { id: update.productId },
        data: {
          stockQuantity: {
            decrement: update.decrementBy
          }
        }
      })
    }

    // Step 6: Final validation - ensure no stock went negative
    const updatedProducts = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stockQuantity: true }
    })
    
    for (const product of updatedProducts) {
      if (product.stockQuantity < 0) {
        throw new Error(`Stock validation failed for ${product.name}. This indicates a race condition.`)
      }
    }

    return {
      order,
      orderItems
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    timeout: 10000 // 10 second timeout
  })
}

// POST: Create new order
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data: OrderCreateRequest = await request.json()

    // Validate order data
    const validationError = validateOrderData(data)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Create order with atomic stock management
    const result = await createOrderWithStockManagement(data)
    const order = result.order

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        currency: order.currency,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Order creation error:', error)

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Order number already exists. Please try again.' },
          { status: 409 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'One or more products not found' },
          { status: 404 }
        )
      }
      if (error.code === 'P2034') {
        return NextResponse.json(
          { error: 'Transaction conflict. Please try again.' },
          { status: 409 }
        )
      }
    }

    // Handle custom validation errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient stock') || 
          error.message.includes('Price has changed') ||
          error.message.includes('not found') ||
          error.message.includes('not available') ||
          error.message.includes('Stock validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
}

// GET: Retrieve order by ID (for order confirmation)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    const orderNumber = searchParams.get('orderNumber')

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'Order ID or order number is required' },
        { status: 400 }
      )
    }

    // Find order by ID or order number
    const order = await db.order.findFirst({
      where: orderId ? { id: orderId } : { orderNumber: orderNumber! },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                sku: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: parseShippingAddress(order.shippingAddress),
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        productImage: item.product.images?.[0],
        quantity: item.quantity,
        pricePerItem: item.pricePerItem,
        totalPrice: item.totalPrice
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    return NextResponse.json({
      success: true,
      order: formattedOrder
    })

  } catch (error) {
    console.error('Order retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve order' },
      { status: 500 }
    )
  }
}