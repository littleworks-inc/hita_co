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

    // Format the response data
    const receiptData = {
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerEmail: sale.customerEmail,
        subtotal: sale.subtotal,
        customDiscount: sale.customDiscount,
        bundleDiscount: sale.bundleDiscount,
        finalTotal: sale.finalTotal,
        paymentMethod: sale.paymentMethod,
        cashAmount: sale.cashAmount,
        zelleAmount: sale.zelleAmount,
        cardAmount: sale.cardAmount,
        bargainApplied: sale.bargainApplied,
        bargainReason: sale.bargainReason,
        salesPersonNotes: sale.salesPersonNotes,
        paymentNotes: sale.paymentNotes,
        createdAt: sale.createdAt.toISOString()
      },
      items: sale.items.map(item => ({
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        categoryName: item.categoryName,
        originalPrice: item.originalPrice,
        exhibitionPrice: item.exhibitionPrice,
        finalPrice: item.finalPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal
      })),
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        location: exhibition.location
      },
      storeSettings: {
        storeName: storeSettings.storeName,
        tagline: storeSettings.tagline,
        logo: storeSettings.logo,
        email: storeSettings.email,
        phone: storeSettings.phone,
        address: storeSettings.address
      }
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