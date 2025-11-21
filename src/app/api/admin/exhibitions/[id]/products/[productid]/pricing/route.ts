// src/app/api/admin/exhibitions/[id]/products/[productId]/pricing/route.ts
// =====================================
// 🚀 Exhibition Product Pricing Management API
// Handles exhibition-specific pricing, discounts, and clearance settings
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

// GET - Fetch current pricing for an exhibition product
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

    // Get exhibition product with pricing info
    const exhibitionProduct = await db.exhibitionProduct.findFirst({
      where: {
        id: exhibitionProductId,
        exhibitionId: exhibitionId
      },
      include: {
        product: {
          include: {
            category: true,
            country: true
          }
        }
      }
    })

    if (!exhibitionProduct) {
      return NextResponse.json({ error: 'Exhibition product not found' }, { status: 404 })
    }

    // Calculate pricing breakdown
    const product = exhibitionProduct.product
    const originalPrice = exhibitionProduct.originalPrice || product.sellingPriceUSD
    const basePrice = exhibitionProduct.exhibitionPrice || originalPrice
    const discountedPrice = basePrice * (1 - (exhibitionProduct.discountPercentage || 0) / 100)
    // Final price (clearance is just a visual badge)
    const finalPrice = discountedPrice

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

// PUT - Update pricing for an exhibition product
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

    // Parse request body
    const {
      exhibitionPrice,
      discountPercentage,
      isClearance,
      salesNotes
    } = await request.json()

    // Validate input
    if (exhibitionPrice !== null && exhibitionPrice !== undefined && exhibitionPrice < 0) {
      return NextResponse.json(
        { error: 'Exhibition price cannot be negative' },
        { status: 400 }
      )
    }

    if (discountPercentage !== null && discountPercentage !== undefined && 
        (discountPercentage < 0 || discountPercentage > 100)) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Get existing exhibition product
    const existingExhibitionProduct = await db.exhibitionProduct.findFirst({
      where: {
        id: exhibitionProductId,
        exhibitionId: exhibitionId
      },
      include: {
        product: true
      }
    })

    if (!existingExhibitionProduct) {
      return NextResponse.json({ error: 'Exhibition product not found' }, { status: 404 })
    }

    // Calculate final price for validation
    const product = existingExhibitionProduct.product
    const originalPrice = existingExhibitionProduct.originalPrice || product.sellingPriceUSD
    const basePrice = exhibitionPrice !== null && exhibitionPrice !== undefined 
      ? exhibitionPrice 
      : originalPrice
    
    const discountedPrice = discountPercentage !== null && discountPercentage !== undefined
      ? basePrice * (1 - discountPercentage / 100) 
      : basePrice

    // Final price (clearance is just a visual badge)
    const finalPrice = discountedPrice

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
      notes: salesNotes,
      updatedBy: session.email || 'unknown'
    }

    // Update exhibition product with pricing information
    const updatedExhibitionProduct = await db.exhibitionProduct.update({
      where: { id: exhibitionProductId },
      data: {
        exhibitionPrice: exhibitionPrice,
        originalPrice: originalPrice, // Store original for reference
        discountPercentage: discountPercentage,
        isClearance: isClearance || false,
        salesNotes: salesNotes,
        priceChangedAt: new Date(),
        priceHistory: [...currentPriceHistory, newPriceHistoryEntry]
      },
      include: {
        product: {
          include: {
            category: true,
            country: true
          }
        }
      }
    })

    // Calculate updated pricing breakdown for response
    const updatedBasePrice = updatedExhibitionProduct.exhibitionPrice || originalPrice
    const updatedDiscountedPrice = updatedBasePrice * (1 - (updatedExhibitionProduct.discountPercentage || 0) / 100)
    // Final price (clearance is just a visual badge)
    const updatedFinalPrice = updatedDiscountedPrice

    return NextResponse.json({
      success: true,
      exhibitionProduct: updatedExhibitionProduct,
      pricing: {
        originalPrice: originalPrice,
        exhibitionPrice: updatedExhibitionProduct.exhibitionPrice,
        discountPercentage: updatedExhibitionProduct.discountPercentage,
        finalPrice: updatedFinalPrice,
        isClearance: updatedExhibitionProduct.isClearance,
        savings: originalPrice - updatedFinalPrice
      },
      message: 'Pricing updated successfully'
    })

  } catch (error) {
    console.error('Exhibition product pricing PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Reset pricing to defaults
export async function DELETE(
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

    // Get existing exhibition product
    const existingExhibitionProduct = await db.exhibitionProduct.findFirst({
      where: {
        id: exhibitionProductId,
        exhibitionId: exhibitionId
      },
      include: {
        product: true
      }
    })

    if (!existingExhibitionProduct) {
      return NextResponse.json({ error: 'Exhibition product not found' }, { status: 404 })
    }

    // Prepare price history entry for reset
    const currentPriceHistory = existingExhibitionProduct.priceHistory as any[] || []
    const resetPriceHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'pricing_reset',
      previousState: {
        exhibitionPrice: existingExhibitionProduct.exhibitionPrice,
        discountPercentage: existingExhibitionProduct.discountPercentage,
        isClearance: existingExhibitionProduct.isClearance
      },
      notes: 'Pricing reset to defaults',
      updatedBy: session.email || 'unknown'
    }

    // Reset pricing to defaults
    const resetExhibitionProduct = await db.exhibitionProduct.update({
      where: { id: exhibitionProductId },
      data: {
        exhibitionPrice: null,
        discountPercentage: 0,
        isClearance: false,
        salesNotes: null,
        priceChangedAt: new Date(),
        priceHistory: [...currentPriceHistory, resetPriceHistoryEntry]
      },
      include: {
        product: {
          include: {
            category: true,
            country: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      exhibitionProduct: resetExhibitionProduct,
      message: 'Pricing reset to defaults successfully'
    })

  } catch (error) {
    console.error('Exhibition product pricing DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}