// src/app/api/admin/exhibitions/[id]/products/[productId]/pricing/route.ts
// =====================================
// Exhibition Product Pricing API Endpoint
// Handles individual product pricing updates for exhibitions
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    const exhibitionProductId = params.productId

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Validate exhibition product exists
    const existingExhibitionProduct = await db.exhibitionProduct.findUnique({
      where: { id: exhibitionProductId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sellingPriceUSD: true
          }
        }
      }
    })

    if (!existingExhibitionProduct) {
      return NextResponse.json({ error: 'Exhibition product not found' }, { status: 404 })
    }

    // Get pricing data from request
    const data = await request.json()

    // Validate pricing data
    const {
      exhibitionPrice,
      discountPercentage = 0,
      isClearance = false,
      salesNotes = '',
      priceChangedAt
    } = data

    // Validation
    if (exhibitionPrice !== undefined && exhibitionPrice < 0) {
      return NextResponse.json(
        { error: 'Exhibition price cannot be negative' },
        { status: 400 }
      )
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Calculate final price for validation
    const basePrice = exhibitionPrice || existingExhibitionProduct.product.sellingPriceUSD
    const finalPrice = isClearance ? basePrice * (1 - discountPercentage / 100) : basePrice

    if (finalPrice < 0) {
      return NextResponse.json(
        { error: 'Final price cannot be negative' },
        { status: 400 }
      )
    }

    // Prepare price history entry
    const currentPriceHistory = existingExhibitionProduct.priceHistory as any[] || []
    const newPriceHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'pricing_update',
      changes: {
        exhibitionPrice: {
          from: existingExhibitionProduct.exhibitionPrice,
          to: exhibitionPrice
        },
        discountPercentage: {
          from: existingExhibitionProduct.discountPercentage,
          to: discountPercentage
        },
        isClearance: {
          from: existingExhibitionProduct.isClearance,
          to: isClearance
        }
      },
      finalPrice: finalPrice,
      notes: salesNotes
    }

    // Update exhibition product with pricing information
    const updatedExhibitionProduct = await db.exhibitionProduct.update({
      where: { id: exhibitionProductId },
      data: {
        exhibitionPrice: exhibitionPrice,
        originalPrice: existingExhibitionProduct.product.sellingPriceUSD, // Store original for reference
        discountPercentage: discountPercentage,
        isClearance: isClearance,
        salesNotes: salesNotes,
        priceChangedAt: priceChangedAt ? new Date(priceChangedAt) : new Date(),
        priceHistory: [...currentPriceHistory, newPriceHistoryEntry]
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPriceUSD: true,
            images: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      exhibitionProduct: updatedExhibitionProduct,
      finalPrice: finalPrice,
      message: 'Pricing updated successfully'
    })

  } catch (error) {
    console.error('Exhibition product pricing update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    const exhibitionProductId = params.productId

    // Get exhibition product with pricing details
    const exhibitionProduct = await db.exhibitionProduct.findUnique({
      where: { id: exhibitionProductId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPriceUSD: true,
            images: true,
            category: {
              select: {
                name: true
              }
            }
          }
        },
        exhibition: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!exhibitionProduct) {
      return NextResponse.json({ error: 'Exhibition product not found' }, { status: 404 })
    }

    // Calculate final price
    const basePrice = exhibitionProduct.exhibitionPrice || exhibitionProduct.product.sellingPriceUSD
    const finalPrice = exhibitionProduct.isClearance && exhibitionProduct.discountPercentage
      ? basePrice * (1 - exhibitionProduct.discountPercentage / 100)
      : basePrice

    return NextResponse.json({
      exhibitionProduct,
      pricing: {
        originalPrice: exhibitionProduct.product.sellingPriceUSD,
        exhibitionPrice: exhibitionProduct.exhibitionPrice,
        discountPercentage: exhibitionProduct.discountPercentage,
        finalPrice: finalPrice,
        isClearance: exhibitionProduct.isClearance,
        savings: exhibitionProduct.product.sellingPriceUSD - finalPrice
      },
      priceHistory: exhibitionProduct.priceHistory
    })

  } catch (error) {
    console.error('Exhibition product pricing GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}