// src/app/api/admin/exhibitions/[id]/products/[productid]/pricing/route.ts
// =====================================
// Exhibition Product Pricing API Endpoint
// Handles individual product pricing updates for exhibitions
// ✅ FIXED: Parameter name to match folder structure
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  // ✅ FIXED: Changed productId to productid to match folder name [productid]
  { params }: { params: { id: string; productid: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    // ✅ FIXED: Use params.productid (lowercase) to match folder structure
    const exhibitionProductId = params.productid

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

    // ✅ FIXED: Use corrected pricing calculation (sellingPriceUSD is original price)
    const originalPrice = existingExhibitionProduct.product.sellingPriceUSD
    const basePrice = exhibitionPrice || originalPrice
    const finalPrice = isClearance 
      ? basePrice * (1 - discountPercentage / 100) 
      : basePrice

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
        originalPrice: originalPrice, // Store original for reference
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
  // ✅ FIXED: Changed productId to productid to match folder name
  { params }: { params: { id: string; productid: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    // ✅ FIXED: Use params.productid (lowercase)
    const exhibitionProductId = params.productid

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

    // ✅ FIXED: Calculate final price using corrected logic
    const originalPrice = exhibitionProduct.product.sellingPriceUSD
    const basePrice = exhibitionProduct.exhibitionPrice || originalPrice
    const finalPrice = exhibitionProduct.isClearance && exhibitionProduct.discountPercentage
      ? basePrice * (1 - exhibitionProduct.discountPercentage / 100)
      : basePrice

    return NextResponse.json({
      exhibitionProduct,
      pricing: {
        originalPrice: originalPrice,
        exhibitionPrice: exhibitionProduct.exhibitionPrice,
        discountPercentage: exhibitionProduct.discountPercentage,
        finalPrice: finalPrice,
        isClearance: exhibitionProduct.isClearance,
        savings: originalPrice - finalPrice
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