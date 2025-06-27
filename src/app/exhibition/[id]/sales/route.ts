// src/app/api/exhibition/[id]/sales/route.ts
// =====================================
// Exhibition Sales API Endpoint
// Handles creating sales transactions from POS interface
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Generate unique sale number
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

    // Validate exhibition exists and is active
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

    // Check if exhibition is currently running
    const now = new Date()
    if (now < exhibition.startDate || now > exhibition.endDate) {
      return NextResponse.json({ 
        error: 'Exhibition is not currently running' 
      }, { status: 400 })
    }

    // Get sale data from request
    const saleData = await request.json()

    // Validate required fields
    const {
      subtotal,
      customDiscount = 0,
      bundleDiscount = 0,
      finalTotal,
      paymentMethod,
      items,
      customerName,
      customerPhone,
      customerEmail,
      cashAmount,
      zelleAmount,
      cardAmount,
      bargainApplied = false,
      bargainReason,
      salesPersonNotes
    } = saleData

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Sale items are required' }, { status: 400 })
    }

    if (!paymentMethod || !['CASH', 'ZELLE', 'CARD', 'SPLIT_PAYMENT'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 })
    }

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json({ error: 'Valid subtotal is required' }, { status: 400 })
    }

    if (typeof finalTotal !== 'number' || finalTotal < 0) {
      return NextResponse.json({ error: 'Valid final total is required' }, { status: 400 })
    }

    // Validate split payment totals
    if (paymentMethod === 'SPLIT_PAYMENT') {
      const totalPaid = (cashAmount || 0) + (zelleAmount || 0) + (cardAmount || 0)
      if (Math.abs(totalPaid - finalTotal) > 0.01) {
        return NextResponse.json({ 
          error: 'Split payment amounts must equal the final total' 
        }, { status: 400 })
      }
    }

    // Validate and prepare sale items
    const validatedItems = []
    
    for (const item of items) {
      const {
        exhibitionProductId,
        productId,
        quantity,
        finalPrice,
        lineTotal
      } = item

      // Validate required item fields
      if (!exhibitionProductId || !productId || !quantity || quantity <= 0) {
        return NextResponse.json({ 
          error: 'Invalid item data: missing required fields or invalid quantity' 
        }, { status: 400 })
      }

      // Get exhibition product to validate stock and pricing
      const exhibitionProduct = await db.exhibitionProduct.findUnique({
        where: { id: exhibitionProductId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPriceUSD: true,
              category: {
                select: { name: true }
              }
            }
          }
        }
      })

      if (!exhibitionProduct) {
        return NextResponse.json({ 
          error: `Exhibition product not found: ${exhibitionProductId}` 
        }, { status: 404 })
      }

      // Check available stock
      const availableStock = exhibitionProduct.quantityTaken - exhibitionProduct.quantitySold
      if (quantity > availableStock) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${exhibitionProduct.product.name}. Available: ${availableStock}, Requested: ${quantity}` 
        }, { status: 400 })
      }

      // Validate pricing consistency
      const calculatedLineTotal = finalPrice * quantity
      if (Math.abs(calculatedLineTotal - lineTotal) > 0.01) {
        return NextResponse.json({ 
          error: `Line total mismatch for ${exhibitionProduct.product.name}` 
        }, { status: 400 })
      }

      validatedItems.push({
        exhibitionProduct,
        item,
        availableStock
      })
    }

    // Use database transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Generate unique sale number
      const saleNumber = await generateSaleNumber()

      // Create the sale record
      const sale = await tx.exhibitionSale.create({
        data: {
          exhibitionId,
          saleNumber,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          subtotal,
          customDiscount,
          bundleDiscount,
          finalTotal,
          paymentMethod,
          cashAmount: paymentMethod === 'CASH' || paymentMethod === 'SPLIT_PAYMENT' ? (cashAmount || finalTotal) : null,
          zelleAmount: paymentMethod === 'ZELLE' || paymentMethod === 'SPLIT_PAYMENT' ? (zelleAmount || 0) : null,
          cardAmount: paymentMethod === 'CARD' || paymentMethod === 'SPLIT_PAYMENT' ? (cardAmount || 0) : null,
          bargainApplied,
          bargainReason: bargainReason || null,
          salesPersonNotes: salesPersonNotes || null,
          paymentNotes: paymentMethod === 'SPLIT_PAYMENT' 
            ? `Cash: $${cashAmount || 0}, Zelle: $${zelleAmount || 0}, Card: $${cardAmount || 0}`
            : null
        }
      })

      // Create sale items and update stock
      const saleItems = []
      
      for (const { exhibitionProduct, item } of validatedItems) {
        // Create sale item
        const saleItem = await tx.exhibitionSaleItem.create({
          data: {
            saleId: sale.id,
            exhibitionProductId: item.exhibitionProductId,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            categoryName: item.categoryName,
            originalPrice: item.originalPrice,
            exhibitionPrice: item.exhibitionPrice,
            customPrice: item.customPrice || null,
            finalPrice: item.finalPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            wasScanned: item.wasScanned || false,
            scanMethod: item.scanMethod || null
          }
        })

        // Update exhibition product sold quantity
        await tx.exhibitionProduct.update({
          where: { id: item.exhibitionProductId },
          data: {
            quantitySold: {
              increment: item.quantity
            },
            lastSaleDate: new Date()
          }
        })

        saleItems.push(saleItem)
      }

      return {
        sale,
        saleItems
      }
    })

    // Return success response
    return NextResponse.json({
      success: true,
      sale: result.sale,
      items: result.saleItems,
      message: `Sale ${result.sale.saleNumber} completed successfully`
    })

  } catch (error) {
    console.error('Exhibition sale creation error:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Sale number conflict. Please try again.' },
          { status: 409 }
        )
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid product or exhibition reference' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error while processing sale' },
      { status: 500 }
    )
  }
}

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

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: {
        id: true,
        title: true,
        location: true,
        startDate: true,
        endDate: true
      }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    // Build where clause for filtering
    const where: any = { exhibitionId }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Get sales with items
    const sales = await db.exhibitionSale.findMany({
      where,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productSku: true,
            quantity: true,
            finalPrice: true,
            lineTotal: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await db.exhibitionSale.count({ where })

    // Calculate summary statistics
    const summary = {
      totalSales: totalCount,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.finalTotal, 0),
      totalItems: sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      ),
      averageSaleValue: sales.length > 0 
        ? sales.reduce((sum, sale) => sum + sale.finalTotal, 0) / sales.length 
        : 0,
      paymentMethodBreakdown: {
        CASH: sales.filter(s => s.paymentMethod === 'CASH').length,
        ZELLE: sales.filter(s => s.paymentMethod === 'ZELLE').length,
        CARD: sales.filter(s => s.paymentMethod === 'CARD').length,
        SPLIT_PAYMENT: sales.filter(s => s.paymentMethod === 'SPLIT_PAYMENT').length
      }
    }

    return NextResponse.json({
      exhibition,
      sales,
      summary,
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Exhibition sales GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}