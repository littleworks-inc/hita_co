// =====================================
// src/app/api/exhibition/[id]/sales/route.ts - EXHIBITION SALES SHARED STOCK
// 🔄 MODIFIED: Exhibition POS sales update shared stock across all channels
// 📊 ENHANCED: Sales channel tracking and stock synchronization
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// =====================================
// 🔄 SHARED STOCK HELPERS FOR EXHIBITION SALES
// =====================================

/**
 * Update shared stock when exhibition sale occurs
 * This ensures stock is properly reduced across all channels
 */
async function updateSharedStockForSale(
  tx: any, 
  productId: string, 
  quantity: number, 
  sizeId?: string
): Promise<void> {
  
  if (sizeId) {
    // For sized products: Update size stock and recalculate main product stock
    console.log(`🔄 SHARED STOCK: Updating size stock - Product: ${productId}, Size: ${sizeId}, Quantity: ${quantity}`)
    
    await tx.productSize.update({
      where: { id: sizeId },
      data: {
        stockQuantity: {
          decrement: quantity
        }
      }
    })
    
    // Recalculate main product stock as sum of all active sizes
    const updatedSizes = await tx.productSize.findMany({
      where: { 
        productId, 
        isActive: true 
      },
      select: { stockQuantity: true }
    })
    
    const newMainStock = updatedSizes.reduce((sum: number, size: { stockQuantity: number }) => sum + size.stockQuantity, 0)
    
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newMainStock }
    })
    
    console.log(`🔄 SHARED STOCK: Size sale processed - New main stock: ${newMainStock}`)
    
  } else {
    // For regular products: Update main stock directly
    console.log(`🔄 SHARED STOCK: Updating main stock - Product: ${productId}, Quantity: ${quantity}`)
    
    await tx.product.update({
      where: { id: productId },
      data: {
        stockQuantity: {
          decrement: quantity
        }
      }
    })
    
    console.log(`🔄 SHARED STOCK: Main stock sale processed`)
  }
}

/**
 * Validate shared stock availability before sale
 */
async function validateSharedStockForSale(
  productId: string, 
  requestedQuantity: number, 
  sizeId?: string
): Promise<{ available: boolean, message: string, availableQuantity: number }> {
  
  if (sizeId) {
    // Check specific size
    const productSize = await db.productSize.findUnique({
      where: { id: sizeId },
      select: { stockQuantity: true, size: true }
    })
    
    if (!productSize) {
      return { available: false, message: 'Size not found', availableQuantity: 0 }
    }
    
    // For exhibition sales, we check against current product size stock
    // (which already reflects all previous sales from all channels)
    const available = productSize.stockQuantity >= requestedQuantity
    
    return {
      available,
      message: available 
        ? `${productSize.stockQuantity} available in size ${productSize.size}` 
        : `Only ${productSize.stockQuantity} available in size ${productSize.size}`,
      availableQuantity: productSize.stockQuantity
    }
    
  } else {
    // Check main product
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true, name: true }
    })
    
    if (!product) {
      return { available: false, message: 'Product not found', availableQuantity: 0 }
    }
    
    // For exhibition sales, we check against current product stock
    // (which already reflects all previous sales from all channels)
    const available = product.stockQuantity >= requestedQuantity
    
    return {
      available,
      message: available 
        ? `${product.stockQuantity} available` 
        : `Only ${product.stockQuantity} available`,
      availableQuantity: product.stockQuantity
    }
  }
}

// =====================================
// POST /api/exhibition/[id]/sales - CREATE EXHIBITION SALE
// =====================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    const data = await request.json()

    console.log('🔄 SHARED STOCK: Processing exhibition sale:', { exhibitionId, itemCount: data.items?.length })

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { 
        id: true, 
        title: true, 
        isActive: true,
        startDate: true,
        endDate: true
      }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    if (!exhibition.isActive) {
      return NextResponse.json({ error: 'Exhibition is not active' }, { status: 400 })
    }

    // Extract sale data
    const {
      customerName,
      customerPhone,
      customerEmail,
      subtotal,
      tax = 0,
      discount = 0,
      total,
      paymentMethod,
      paymentDetails,
      items,
      salesPersonNotes,
      cashReceived,
      changeGiven
    } = data

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Sale items are required' },
        { status: 400 }
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'Sale total must be greater than 0' },
        { status: 400 }
      )
    }

    // Create sale with shared stock updates
    const result = await db.$transaction(async (tx) => {
      
      // Step 1: 🔄 SHARED STOCK VALIDATION for all items
      console.log('🔄 SHARED STOCK: Validating items before sale...')
      
      for (const item of items) {
        const stockValidation = await validateSharedStockForSale(
          item.productId,
          parseInt(item.quantity) || 1,
          item.productSizeId
        )
        
        if (!stockValidation.available) {
          throw new Error(`🔄 SHARED STOCK: ${stockValidation.message} for ${item.productName}`)
        }
        
        console.log(`🔄 SHARED STOCK: Item validated - ${item.productName}, Requested: ${item.quantity}, Available: ${stockValidation.availableQuantity}`)
      }

      // Step 2: Create exhibition sale record
      const sale = await tx.exhibitionSale.create({
        data: {
          exhibitionId,
          saleNumber: await generateSaleNumber(),
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          subtotal: parseFloat(subtotal) || 0,
          tax: parseFloat(tax) || 0,
          discount: parseFloat(discount) || 0,
          total: parseFloat(total),
          paymentMethod: paymentMethod || 'CASH',
          paymentDetails: paymentDetails || null,
          cashReceived: cashReceived ? parseFloat(cashReceived) : null,
          changeGiven: changeGiven ? parseFloat(changeGiven) : null,
          staffNotes: salesPersonNotes || null,
          isCompleted: true,
          completedAt: new Date()
        }
      })

      console.log('🔄 SHARED STOCK: Exhibition sale created:', sale.saleNumber)

      // Step 3: Create sale items and update both exhibition and shared stock
      for (const item of items) {
        const quantity = parseInt(item.quantity) || 1
        
        // Create sale item with enhanced tracking
        await tx.exhibitionSaleItem.create({
          data: {
            saleId: sale.id,
            exhibitionProductId: item.exhibitionProductId,
            productId: item.productId,
            productSizeId: item.productSizeId || null,
            sizeLabel: item.sizeLabel || null,
            quantity,
            originalPrice: parseFloat(item.originalPrice) || 0,
            exhibitionPrice: parseFloat(item.exhibitionPrice) || 0,
            finalPrice: parseFloat(item.finalPrice) || 0,
            lineTotal: parseFloat(item.lineTotal) || 0,
            productName: item.productName || 'Unknown Product',
            productSku: item.productSku || 'N/A',
            categoryName: item.categoryName || 'Uncategorized',
          }
        })

        // Step 4: Update exhibition product tracking
        await tx.exhibitionProduct.update({
          where: { id: item.exhibitionProductId },
          data: {
            quantitySold: {
              increment: quantity
            },
            lastSaleDate: new Date()
          }
        })

        // Step 5: 🔄 KEY CHANGE - Update shared stock
        // This ensures stock is reduced across ALL channels (customer + exhibition)
        await updateSharedStockForSale(
          tx,
          item.productId,
          quantity,
          item.productSizeId
        )

        console.log(`🔄 SHARED STOCK: Processed sale item - ${item.productName}, Quantity: ${quantity}`)
      }

      // Step 6: Final stock validation
      console.log('🔄 SHARED STOCK: Final validation...')
      
      for (const item of items) {
        const finalValidation = await validateSharedStockForSale(
          item.productId,
          0, // Just checking current state
          item.productSizeId
        )
        
        if (finalValidation.availableQuantity < 0) {
          throw new Error(`🔄 SHARED STOCK: Final validation failed for ${item.productName}`)
        }
      }

      console.log('🔄 SHARED STOCK: Exhibition sale completed successfully')

      return sale
    }, {
      isolationLevel: 'Serializable' // Prevent race conditions
    })

    // Return success response with shared stock information
    return NextResponse.json({
      success: true,
      sale: result,
      saleNumber: result.saleNumber,
      message: 'Exhibition sale created successfully',
      // 🔄 NEW: Shared stock summary (using available fields)
      sharedStockSummary: {
        totalItemsSold: items.reduce((sum: number, item: any) => sum + (parseInt(item.quantity) || 1), 0),
        itemsProcessed: items.length,
        orderSource: 'EXHIBITION', // Using schema field terminology
        exhibitionId,
        exhibitionTitle: exhibition.title,
        systemNote: 'Sale processed using shared stock system - inventory updated across all channels'
      }
    })

  } catch (error) {
    console.error('🔄 SHARED STOCK: Exhibition sale error:', error)
    
    // Enhanced error handling for shared stock issues
    if (error instanceof Error) {
      if (error.message.includes('🔄 SHARED STOCK:')) {
        return NextResponse.json(
          { error: error.message.replace('🔄 SHARED STOCK: ', '') },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create exhibition sale' },
      { status: 500 }
    )
  }
}

// =====================================
// GET /api/exhibition/[id]/sales - LIST EXHIBITION SALES
// =====================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeItems = searchParams.get('includeItems') === 'true'

    const skip = (page - 1) * limit

    // Get exhibition sales with enhanced information
    const sales = await db.exhibitionSale.findMany({
      where: { exhibitionId },
      include: {
        items: includeItems ? {
          include: {
            exhibitionProduct: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                    images: true
                  }
                }
              }
            }
          }
        } : false
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const totalCount = await db.exhibitionSale.count({
      where: { exhibitionId }
    })

    // Calculate summary statistics
    const summary = {
      totalSales: totalCount,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      averageSaleValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      completedSales: sales.filter(sale => sale.isCompleted).length
    }

    return NextResponse.json({
      success: true,
      sales,
      summary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      systemInfo: {
        stockSystem: 'shared_stock_v1',
        note: 'Exhibition sales processed with shared stock validation'
      }
    })

  } catch (error) {
    console.error('Error fetching exhibition sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exhibition sales' },
      { status: 500 }
    )
  }
}

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Generate unique sale number for exhibition sales
 */
async function generateSaleNumber(): Promise<string> {
  const count = await db.exhibitionSale.count()
  const saleNumber = `EXH${String(count + 1).padStart(4, '0')}`
  
  // Check if this number already exists (edge case handling)
  const existing = await db.exhibitionSale.findUnique({
    where: { saleNumber }
  })
  
  if (existing) {
    // If exists, try with current timestamp
    return `EXH${String(count + 1).padStart(4, '0')}-${Date.now().toString().slice(-3)}`
  }
  
  return saleNumber
}