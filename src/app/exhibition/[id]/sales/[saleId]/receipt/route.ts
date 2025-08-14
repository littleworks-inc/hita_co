// src/app/api/exhibition/[id]/sales/[saleId]/receipt/route.ts
// =====================================
// Exhibition Receipt API Endpoint
// Handles fetching receipt data for display and printing
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; saleId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    const saleId = params.saleId

    // Validate exhibition exists and is accessible
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        isActive: true
      }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get sale with all related data
    const sale = await db.exhibitionSale.findUnique({
      where: {
        id: saleId,
        exhibitionId: exhibitionId // Ensure sale belongs to this exhibition
      },
      include: {
        items: {
          include: {
            // ✅ Include related product data to get name, sku, category
            product: {
              include: {
                category: {
                  select: {
                    name: true
                  }
                }
              }
            },
            // ✅ Include exhibition product for pricing context
            exhibitionProduct: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true
                  }
                }
              }
            },
            // ✅ Include product size if present
            productSize: {
              select: {
                size: true,
                sku: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json({
        error: 'Receipt not found or does not belong to this exhibition'
      }, { status: 404 })
    }

    // Get store settings for branding
    let storeSettings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    if (!storeSettings) {
      // Create default settings if they don't exist
      storeSettings = await db.storeSetting.create({
        data: {
          id: 'default',
          storeName: 'Hita&Co',
          tagline: 'Authentic Indian Ethnic Wear',
          primaryColor: '#1f2937',
          secondaryColor: '#ffffff',
          accentColor: '#f59e0b',
          currency: 'USD',
          timezone: 'America/New_York'
        }
      })
    }
    interface PaymentDetails {
      cashAmount?: number | null
      zelleAmount?: number | null
      cardAmount?: number | null
      bargainApplied?: boolean
      bargainReason?: string | null
      [key: string]: any // Allow other properties
    }

    // Format the response data
    const receiptData = {
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerEmail: sale.customerEmail,
        subtotal: sale.subtotal,
        tax: sale.tax,

        // ✅ Map database fields to frontend expected fields
        customDiscount: 0,                       // Not stored separately
        bundleDiscount: sale.discount || 0,      // Map 'discount' to bundleDiscount
        finalTotal: sale.total,                  // Map 'total' to finalTotal

        // ✅ Payment information
        paymentMethod: sale.paymentMethod,
        cashReceived: sale.cashReceived,
        changeGiven: sale.changeGiven,

        // ✅ FIXED: Type cast paymentDetails to access properties safely
        ...((): {
          cashAmount: number | null
          zelleAmount: number | null
          cardAmount: number | null
          bargainApplied: boolean
          bargainReason: string | null
        } => {
          const paymentDetails = sale.paymentDetails as PaymentDetails | null

          return {
            cashAmount: paymentDetails?.cashAmount || null,
            zelleAmount: paymentDetails?.zelleAmount || null,
            cardAmount: paymentDetails?.cardAmount || null,
            bargainApplied: paymentDetails?.bargainApplied || (sale.discount || 0) > 0,
            bargainReason: paymentDetails?.bargainReason || null
          }
        })(),

        // ✅ Staff notes and timestamps
        salesPersonNotes: sale.staffNotes,       // Use correct field name
        paymentNotes: null,                      // Not stored separately
        isCompleted: sale.isCompleted,
        completedAt: sale.completedAt,
        receiptPrinted: sale.receiptPrinted,
        receiptEmailSent: sale.receiptEmailSent,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      },
      items: sale.items.map(item => ({
        id: item.id,
        productId: item.productId,
        exhibitionProductId: item.exhibitionProductId,
        quantity: item.quantity,

        // ✅ Get product info from relations
        productName: item.product?.name || item.exhibitionProduct?.product?.name || 'Unknown Product',
        productSku: item.product?.sku || item.exhibitionProduct?.product?.sku || 'N/A',
        categoryName: item.product?.category?.name || 'Uncategorized',

        // ✅ Pricing fields from schema
        originalPrice: item.originalPrice,
        exhibitionPrice: item.exhibitionPrice,
        finalPrice: item.finalPrice,
        lineTotal: item.lineTotal,

        // ✅ Size and discount info
        sizeLabel: item.sizeLabel || item.productSize?.size || null,
        discount: item.discount || 0
      })),
      exhibition,
      storeSettings
    }

    return NextResponse.json(receiptData)

  } catch (error) {
    console.error('Receipt fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}