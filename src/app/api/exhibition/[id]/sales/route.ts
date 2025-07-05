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
            // ✅ FIXED: Use only confirmed schema fields and relations
            productId: true,
            exhibitionProductId: true,
            quantity: true,
            // Get product data through relations instead of non-existent fields
          },
          include: {
            // Get product info through exhibition product relation
            exhibitionProduct: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    sellingPriceUSD: true,
                    category: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transform the data to include the expected fields
    const salesWithFormattedItems = sales.map(sale => ({
      ...sale,
      items: sale.items.map(item => ({
        id: item.id,
        productId: item.productId,
        exhibitionProductId: item.exhibitionProductId,
        quantity: item.quantity,
        // Calculate or derive these fields from available data
        productName: item.exhibitionProduct?.product?.name || 'Unknown Product',
        productSku: item.exhibitionProduct?.product?.sku || 'N/A',
        categoryName: item.exhibitionProduct?.product?.category?.name || 'Uncategorized',
        // For pricing, we'll use estimates based on exhibition product data
        originalPrice: item.exhibitionProduct?.originalPrice || item.exhibitionProduct?.product?.sellingPriceUSD || 0,
        exhibitionPrice: item.exhibitionProduct?.exhibitionPrice || item.exhibitionProduct?.product?.sellingPriceUSD || 0,
        finalPrice: (() => {
          const basePrice = item.exhibitionProduct?.exhibitionPrice || item.exhibitionProduct?.product?.sellingPriceUSD || 0
          const discountPercentage = item.exhibitionProduct?.discountPercentage || 0
          return item.exhibitionProduct?.isClearance && discountPercentage > 0
            ? basePrice * (1 - discountPercentage / 100)
            : basePrice
        })(),
        lineTotal: (() => {
          const basePrice = item.exhibitionProduct?.exhibitionPrice || item.exhibitionProduct?.product?.sellingPriceUSD || 0
          const discountPercentage = item.exhibitionProduct?.discountPercentage || 0
          const finalPrice = item.exhibitionProduct?.isClearance && discountPercentage > 0
            ? basePrice * (1 - discountPercentage / 100)
            : basePrice
          return finalPrice * item.quantity
        })()
      }))
    }))

    // Calculate summary statistics
    const allSales = await db.exhibitionSale.findMany({
      where: { exhibitionId },
      select: {
        total: true,
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
      totalRevenue: allSales.reduce((sum, sale) => sum + sale.total, 0),
      totalItems: allSales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      ),
      averageSaleValue: allSales.length > 0 
        ? allSales.reduce((sum, sale) => sum + sale.total, 0) / allSales.length 
        : 0
    }

    return NextResponse.json({
      exhibition,
      sales: salesWithFormattedItems,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary,
      success: true
    })

  } catch (error) {
    console.error('Exhibition sales GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new sale
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

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      paymentDetails,
      cashReceived,
      changeGiven,
      items
    } = data

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Sale must contain at least one item' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      )
    }

    // Generate unique sale number
    const saleNumber = await generateSaleNumber()

    // Create sale and items in transaction
    const result = await db.$transaction(async (tx) => {
      // Create the main sale - only use fields that exist in the schema
      const sale = await tx.exhibitionSale.create({
        data: {
          exhibitionId,
          saleNumber,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          subtotal: parseFloat(subtotal) || 0,
          tax: parseFloat(tax) || 0,
          discount: parseFloat(discount) || 0,
          total: parseFloat(total) || 0,
          paymentMethod,
          // Store additional payment data in paymentDetails JSON field
          paymentDetails: {
            cashAmount: data.cashAmount || null,
            zelleAmount: data.zelleAmount || null,
            cardAmount: data.cardAmount || null,
            bargainApplied: data.bargainApplied || false,
            bargainReason: data.bargainReason || null
          },
          cashReceived: cashReceived ? parseFloat(cashReceived) : null,
          changeGiven: changeGiven ? parseFloat(changeGiven) : null,
          staffNotes: data.salesPersonNotes || null,
          isCompleted: true,
          completedAt: new Date()
        }
      })

      // Create sale items and update inventory
      for (const item of items) {
        // Create sale item - include all required fields
        await tx.exhibitionSaleItem.create({
          data: {
            saleId: sale.id,
            exhibitionProductId: item.exhibitionProductId,
            productId: item.productId,
            productSizeId: item.productSizeId || null,
            sizeLabel: item.sizeLabel || null,
            // ✅ FIXED: Include all required fields that exist in schema
            quantity: parseInt(item.quantity) || 1,
            originalPrice: parseFloat(item.originalPrice) || 0,
            exhibitionPrice: parseFloat(item.exhibitionPrice) || 0,
            finalPrice: parseFloat(item.finalPrice) || 0,
            lineTotal: parseFloat(item.lineTotal) || 0,
            // Add any other fields that might be required
            productName: item.productName || 'Unknown Product',
            productSku: item.productSku || 'N/A',
            categoryName: item.categoryName || 'Uncategorized',
          }
        })

        // Update exhibition product inventory
        await tx.exhibitionProduct.update({
          where: { id: item.exhibitionProductId },
          data: {
            quantitySold: {
              increment: parseInt(item.quantity) || 1
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