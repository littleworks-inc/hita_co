import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Order creation interface matching checkout data
interface OrderCreateRequest {
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    company?: string
  }
  shippingAddress: {
    street: string
    apartment?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  paymentMethod: 'card' | 'paypal' | 'bank_transfer'
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

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HC${timestamp}${random}`
}

// Validate order data
function validateOrderData(data: OrderCreateRequest): string | null {
  // Customer info validation
  if (!data.customerInfo?.firstName?.trim()) {
    return 'First name is required'
  }
  if (!data.customerInfo?.lastName?.trim()) {
    return 'Last name is required'
  }
  if (!data.customerInfo?.email?.trim()) {
    return 'Email is required'
  }
  if (!data.customerInfo?.phone?.trim()) {
    return 'Phone number is required'
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.customerInfo.email)) {
    return 'Invalid email format'
  }

  // Shipping address validation
  if (!data.shippingAddress?.street?.trim()) {
    return 'Street address is required'
  }
  if (!data.shippingAddress?.city?.trim()) {
    return 'City is required'
  }
  if (!data.shippingAddress?.state?.trim()) {
    return 'State/Province is required'
  }
  if (!data.shippingAddress?.postalCode?.trim()) {
    return 'Postal code is required'
  }
  if (!data.shippingAddress?.country?.trim()) {
    return 'Country is required'
  }

  // Order items validation
  if (!data.items || data.items.length === 0) {
    return 'Order must contain at least one item'
  }

  for (const item of data.items) {
    if (!item.productId) {
      return 'Invalid product ID'
    }
    if (item.quantity <= 0) {
      return 'Invalid item quantity'
    }
    if (item.pricePerItem <= 0) {
      return 'Invalid item price'
    }
  }

  // Payment method validation
  const validPaymentMethods = ['card', 'paypal', 'bank_transfer']
  if (!validPaymentMethods.includes(data.paymentMethod)) {
    return 'Invalid payment method'
  }

  // Pricing validation
  if (data.subtotal < 0 || data.shipping < 0 || data.tax < 0 || data.total <= 0) {
    return 'Invalid pricing data'
  }

  // Currency validation
  if (!data.currency || data.currency.length !== 3) {
    return 'Invalid currency code'
  }

  return null
}

// Create order in database
async function createOrder(data: OrderCreateRequest) {
  const orderNumber = generateOrderNumber()
  
  // Map payment method to Prisma enum
  const paymentMethodMap: Record<string, any> = {
    'card': 'CREDIT_CARD',
    'paypal': 'PAYPAL',
    'bank_transfer': 'BANK_TRANSFER'
  }

  // Prepare shipping address as JSON
  const shippingAddressJson = {
    street: data.shippingAddress.street,
    apartment: data.shippingAddress.apartment || '',
    city: data.shippingAddress.city,
    state: data.shippingAddress.state,
    postalCode: data.shippingAddress.postalCode,
    country: data.shippingAddress.country
  }

  try {
    // Use a transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Verify all products exist and have sufficient stock
      const productIds = data.items.map(item => item.productId)
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          status: 'PUBLISHED' // Only allow orders for published products
        },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          sellingPriceUSD: true
        }
      })

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found or not available')
      }

      // Check stock availability and price consistency
      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId)
        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }
        
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`)
        }

        // Verify price hasn't changed (allow small variance for currency conversion)
        const priceDifference = Math.abs(product.sellingPriceUSD - item.pricePerItem)
        if (priceDifference > 0.01) {
          throw new Error(`Price has changed for product: ${product.name}`)
        }
      }

      // Create the order
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

      // Create order items
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

      // Update product stock quantities
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        })
      }

      return {
        order,
        orderItems
      }
    })

    return result.order
  } catch (error) {
    console.error('Database transaction failed:', error)
    throw error
  }
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

    // Create order in database
    const order = await createOrder(data)

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

    // Handle specific error types
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
    }

    // Handle custom validation errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient stock') || 
          error.message.includes('Price has changed') ||
          error.message.includes('not found') ||
          error.message.includes('not available')) {
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
                sku: true,
                images: true
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

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Order retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve order' },
      { status: 500 }
    )
  }
}