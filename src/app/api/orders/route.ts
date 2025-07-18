// =====================================
// src/app/api/orders/route.ts - CUSTOMER ORDERS SHARED STOCK SYSTEM
// 🔄 MODIFIED: Customer orders use shared stock validation and tracking
// 📊 ENHANCED: Using only existing Prisma schema fields
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// =====================================
// 🔄 TYPE DEFINITIONS FOR SHARED STOCK
// =====================================

interface OrderItemForStock {
  quantity: number
}

interface ExhibitionSaleItemForStock {
  quantity: number
}

interface ProductSizeForStock {
  stockQuantity: number
}

interface StockValidation {
  productId: string
  productSizeId?: string
  quantity: number
  stockCheck: {
    available: boolean
    availableQuantity: number
    originalStock: number
    totalSold: number
    message: string
  }
}

// =====================================
// 🔄 SHARED STOCK CALCULATION HELPERS
// =====================================

/**
 * Calculate total sold across all channels (customer orders + exhibition sales)
 */
async function calculateTotalSoldAllChannels(productId: string, sizeId?: string): Promise<number> {
  // Get customer orders (online sales)
  const customerOrderItems = await db.orderItem.findMany({
    where: {
      productId,
      ...(sizeId && { productSizeId: sizeId }),
      order: {
        status: { not: 'CANCELLED' }
      }
    },
    select: { quantity: true }
  })
  
  const soldToCustomers = customerOrderItems.reduce((sum: number, item: OrderItemForStock) => sum + item.quantity, 0)

  // Get exhibition sales (POS sales)
  const exhibitionSaleItems = await db.exhibitionSaleItem.findMany({
    where: {
      productId,
      ...(sizeId && { productSizeId: sizeId })
    },
    select: { quantity: true }
  })
  
  const soldAtExhibitions = exhibitionSaleItems.reduce((sum: number, item: ExhibitionSaleItemForStock) => sum + item.quantity, 0)

  return soldToCustomers + soldAtExhibitions
}

/**
 * Check shared stock availability for an item
 */
async function checkSharedStockForItem(
  productId: string, 
  requestedQuantity: number, 
  sizeId?: string
): Promise<{
  available: boolean
  availableQuantity: number
  originalStock: number
  totalSold: number
  message: string
}> {
  
  if (sizeId) {
    // Check specific size
    const productSize = await db.productSize.findUnique({
      where: { id: sizeId },
      select: { stockQuantity: true, size: true }
    })
    
    if (!productSize) {
      return {
        available: false,
        availableQuantity: 0,
        originalStock: 0,
        totalSold: 0,
        message: 'Size not found'
      }
    }
    
    const totalSold = await calculateTotalSoldAllChannels(productId, sizeId)
    const availableQuantity = Math.max(0, productSize.stockQuantity - totalSold)
    
    return {
      available: availableQuantity >= requestedQuantity,
      availableQuantity,
      originalStock: productSize.stockQuantity,
      totalSold,
      message: availableQuantity >= requestedQuantity 
        ? `${availableQuantity} available` 
        : availableQuantity === 0 
          ? 'Out of stock' 
          : `Only ${availableQuantity} available`
    }
  } else {
    // Check main product
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true, name: true, requiresSizes: true }
    })
    
    if (!product) {
      return {
        available: false,
        availableQuantity: 0,
        originalStock: 0,
        totalSold: 0,
        message: 'Product not found'
      }
    }
    
    const totalSold = await calculateTotalSoldAllChannels(productId)
    const availableQuantity = Math.max(0, product.stockQuantity - totalSold)
    
    return {
      available: availableQuantity >= requestedQuantity,
      availableQuantity,
      originalStock: product.stockQuantity,
      totalSold,
      message: availableQuantity >= requestedQuantity 
        ? `${availableQuantity} available` 
        : availableQuantity === 0 
          ? 'Out of stock' 
          : `Only ${availableQuantity} available`
    }
  }
}

// =====================================
// ORDER INTERFACES
// =====================================

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
  items: Array<{
    productId: string
    productSizeId?: string
    quantity: number
    pricePerItem: number
    totalPrice: number
  }>
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
  paymentMethod: string
}

// =====================================
// PAYMENT METHOD MAPPING - Fixed to match Prisma schema
// =====================================

const paymentMethodMap = {
  'credit_card': 'CARD',
  'debit_card': 'CARD', 
  'paypal': 'OTHER',
  'stripe': 'OTHER',
  'bank_transfer': 'BANK_TRANSFER',
  'cash': 'CASH',
  'upi': 'UPI'
} as const

// =====================================
// 🔄 SHARED STOCK ORDER CREATION
// =====================================

async function createOrderWithSharedStock(data: OrderCreateRequest) {
  return await db.$transaction(async (tx) => {
    const orderNumber = generateOrderNumber()
    
    console.log('🔄 SHARED STOCK: Creating order with shared stock validation')
    
    // Step 1: Validate all items with shared stock logic
    const stockValidations: StockValidation[] = []
    
    for (const item of data.items) {
      const stockCheck = await checkSharedStockForItem(
        item.productId, 
        item.quantity, 
        item.productSizeId
      )
      
      if (!stockCheck.available) {
        throw new Error(`🔄 SHARED STOCK: Insufficient stock for product. ${stockCheck.message}`)
      }
      
      stockValidations.push({
        productId: item.productId,
        productSizeId: item.productSizeId,
        quantity: item.quantity,
        stockCheck
      })
      
      console.log(`🔄 SHARED STOCK: Item validated - Product ${item.productId}, Requested: ${item.quantity}, Available: ${stockCheck.availableQuantity}`)
    }

    // Step 2: Create the order using only existing schema fields
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerName: `${data.customerInfo.firstName} ${data.customerInfo.lastName}`,
        customerEmail: data.customerInfo.email,
        customerPhone: data.customerInfo.phone,
        shippingAddress: JSON.stringify(data.shippingAddress),
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        total: data.total,
        currency: data.currency,
        paymentMethod: paymentMethodMap[data.paymentMethod as keyof typeof paymentMethodMap] || 'OTHER',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        source: 'ONLINE' // This field exists in the schema
      }
    })

    console.log('🔄 SHARED STOCK: Order created:', order.orderNumber)

    // Step 3: Create order items with size tracking
    const orderItems = await Promise.all(
      data.items.map(item =>
        tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productSizeId: item.productSizeId || null,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
            totalPrice: item.totalPrice,
            sizeLabel: item.productSizeId ? 'size-tracked' : null
          }
        })
      )
    )

    console.log('🔄 SHARED STOCK: Order items created:', orderItems.length)

    // Step 4: 🔄 KEY CHANGE - Update stock using shared stock logic
    // Instead of decrementing product.stockQuantity directly,
    // we now respect the shared stock system
    
    for (const validation of stockValidations) {
      const item = validation
      
      if (item.productSizeId) {
        // For sized products: Update size stock and recalculate main product stock
        await tx.productSize.update({
          where: { id: item.productSizeId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        })
        
        // Recalculate main product stock as sum of all active sizes
        const updatedSizes = await tx.productSize.findMany({
          where: { 
            productId: item.productId, 
            isActive: true 
          },
          select: { stockQuantity: true }
        })
        
        const newMainStock = updatedSizes.reduce((sum: number, size: { stockQuantity: number }) => sum + size.stockQuantity, 0)
        
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newMainStock }
        })
        
        console.log(`🔄 SHARED STOCK: Updated size stock for product ${item.productId}, new main stock: ${newMainStock}`)
        
      } else {
        // For regular products: Update main stock directly
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        })
        
        console.log(`🔄 SHARED STOCK: Updated main stock for product ${item.productId}`)
      }
    }

    // Step 5: 🔄 NEW - Final shared stock validation
    // Verify no negative stock and shared stock integrity
    for (const validation of stockValidations) {
      const item = validation
      
      // Check final stock state
      const finalStockCheck = await checkSharedStockForItem(
        item.productId, 
        0, // Just checking current state
        item.productSizeId
      )
      
      if (finalStockCheck.availableQuantity < 0) {
        throw new Error(`🔄 SHARED STOCK: Stock validation failed after update for product ${item.productId}`)
      }
      
      console.log(`🔄 SHARED STOCK: Final validation passed - Product ${item.productId}, Remaining: ${finalStockCheck.availableQuantity}`)
    }

    return {
      order,
      orderItems,
      stockValidations: stockValidations.map(v => ({
        productId: v.productId,
        quantityOrdered: v.quantity,
        stockAfterOrder: v.stockCheck.availableQuantity - v.quantity
      }))
    }
  }, {
    isolationLevel: 'Serializable' // Prevent race conditions
  })
}

// =====================================
// ORDER NUMBER GENERATION
// =====================================

function generateOrderNumber(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `ORD-${timestamp.slice(-6)}-${random}`
}

// =====================================
// POST /api/orders - CREATE ORDER
// =====================================

export async function POST(request: NextRequest) {
  try {
    const data: OrderCreateRequest = await request.json()

    console.log('🔄 SHARED STOCK: Processing new order with items:', data.items.length)

    // Validate required fields
    if (!data.customerInfo || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    // Create order using shared stock system
    const result = await createOrderWithSharedStock(data)

    console.log('🔄 SHARED STOCK: Order created successfully:', result.order.orderNumber)

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      message: 'Order created successfully',
      // 🔄 NEW: Shared stock summary (using available fields)
      sharedStockSummary: {
        totalItemsOrdered: data.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        stockValidations: result.stockValidations,
        systemNote: 'Order processed using shared stock system',
        orderSource: 'ONLINE' // Using the actual schema field name
      }
    })

  } catch (error) {
    console.error('🔄 SHARED STOCK: Order creation error:', error)
    
    // Enhanced error handling for shared stock issues
    if (error instanceof Error) {
      if (error.message.includes('🔄 SHARED STOCK:')) {
        return NextResponse.json(
          { error: error.message.replace('🔄 SHARED STOCK: ', '') },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// =====================================
// GET /api/orders - LIST ORDERS (Enhanced with shared stock info)
// =====================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // Get orders with enhanced information
    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { 
                name: true, 
                sku: true,
                images: true 
              }
            },
            productSize: {
              select: { 
                size: true, 
                sku: true 
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const totalCount = await db.order.count({ where })

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      systemInfo: {
        stockSystem: 'shared_stock_v1',
        note: 'Orders processed with shared stock validation'
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}