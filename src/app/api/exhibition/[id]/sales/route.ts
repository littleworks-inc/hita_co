// src/app/api/exhibition/[id]/sales/route.ts
// =====================================
// Exhibition Sales API Endpoint
// Handles both creating sales (POST) and retrieving sales history (GET)
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Retrieve sales history
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

    // Validate exhibition exists and is accessible
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: {
        id: true,
        title: true,
        location: true,
        startDate: true,
        endDate: true,
        isActive: true
      }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get URL parameters for filtering and pagination
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const paymentMethod = url.searchParams.get('paymentMethod')
    const search = url.searchParams.get('search')

    // Build where clause for filtering
    const salesWhere: any = {
      exhibitionId
    }

    // Add date filters
    if (dateFrom || dateTo) {
      salesWhere.createdAt = {}
      if (dateFrom) salesWhere.createdAt.gte = new Date(dateFrom)
      if (dateTo) salesWhere.createdAt.lte = new Date(dateTo)
    }

    // Add payment method filter
    if (paymentMethod) {
      salesWhere.paymentMethod = paymentMethod
    }

    // Add search filter
    if (search) {
      salesWhere.OR = [
        {
          saleNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          customerName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          customerPhone: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Get total count for pagination
    const totalCount = await db.exhibitionSale.count({
      where: salesWhere
    })

    // Get sales with items
    const sales = await db.exhibitionSale.findMany({
      where: salesWhere,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productSku: true,
            categoryName: true,
            originalPrice: true,
            exhibitionPrice: true,
            finalPrice: true,
            quantity: true,
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

    // Calculate summary statistics
    const allSales = await db.exhibitionSale.findMany({
      where: { exhibitionId },
      select: {
        finalTotal: true,
        paymentMethod: true,
        items: {
          select: {
            quantity: true
          }
        }
      }
    })

    const summary = {
      totalSales: allSales.length,
      totalRevenue: allSales.reduce((sum, sale) => sum + sale.finalTotal, 0),
      totalItems: allSales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      ),
      averageSaleValue: allSales.length > 0 
        ? allSales.reduce((sum, sale) => sum + sale.finalTotal, 0) / allSales.length 
        : 0,
      paymentMethodBreakdown: {
        CASH: allSales.filter(s => s.paymentMethod === 'CASH').length,
        ZELLE: allSales.filter(s => s.paymentMethod === 'ZELLE').length,
        CARD: allSales.filter(s => s.paymentMethod === 'CARD').length,
        SPLIT_PAYMENT: allSales.filter(s => s.paymentMethod === 'SPLIT_PAYMENT').length
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

// POST - Create a new sale (for POS system)
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

    if (typeof finalTotal !== 'number' || finalTotal <= 0) {
      return NextResponse.json({ error: 'Valid final total is required' }, { status: 400 })
    }

    // Generate unique sale number
    const saleNumber = await generateSaleNumber()

    // Create sale with transaction
    const result = await db.$transaction(async (tx) => {
      // Create the sale
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
          cashAmount: paymentMethod === 'CASH' || paymentMethod === 'SPLIT_PAYMENT' ? cashAmount : null,
          zelleAmount: paymentMethod === 'ZELLE' || paymentMethod === 'SPLIT_PAYMENT' ? zelleAmount : null,
          cardAmount: paymentMethod === 'CARD' || paymentMethod === 'SPLIT_PAYMENT' ? cardAmount : null,
          bargainApplied,
          bargainReason: bargainReason || null,
          salesPersonNotes: salesPersonNotes || null
        }
      })

      // Create sale items and update inventory
      for (const item of items) {
        // Create sale item
        await tx.exhibitionSaleItem.create({
          data: {
            saleId: sale.id,
            exhibitionProductId: item.exhibitionProductId,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            categoryName: item.categoryName,
            originalPrice: item.originalPrice,
            exhibitionPrice: item.exhibitionPrice,
            finalPrice: item.finalPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal
          }
        })

        // Update exhibition product inventory
        await tx.exhibitionProduct.update({
          where: { id: item.exhibitionProductId },
          data: {
            quantitySold: {
              increment: item.quantity
            },
            lastSaleDate: new Date()
          }
        })
      }

      return sale
    })

    return NextResponse.json({
      success: true,
      sale: result,
      saleNumber: result.saleNumber,
      message: 'Sale created successfully'
    })

  } catch (error) {
    console.error('Exhibition sale creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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