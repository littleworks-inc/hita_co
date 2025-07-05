// src/app/api/admin/exhibitions/[id]/products/route.ts
// =====================================
// Exhibition Products API Endpoint
// Handles adding and listing products for exhibitions
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

interface ExhibitionProductsSummary {
  totalProducts: number
  totalQuantityTaken: number
  totalQuantitySold: number
  totalValue: number
  totalRevenue: number
  clearanceProducts: number
  customPricedProducts: number
  sellThroughRate: number // ✅ ADD: Include sellThroughRate property
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

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get request data
    const data = await request.json()
    const { productId, quantityTaken } = data

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (!quantityTaken || quantityTaken <= 0) {
      return NextResponse.json(
        { error: 'Quantity taken must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate product exists and is active
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        sellingPriceUSD: true,
        stockQuantity: true,
        isActive: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Cannot add inactive product to exhibition' },
        { status: 400 }
      )
    }

    // Check if product is already in this exhibition
    const existingExhibitionProduct = await db.exhibitionProduct.findFirst({
      where: {
        exhibitionId: exhibitionId,
        productId: productId
      }
    })

    if (existingExhibitionProduct) {
      return NextResponse.json(
        { error: 'Product is already added to this exhibition' },
        { status: 400 }
      )
    }

    // Validate quantity against stock
    if (quantityTaken > product.stockQuantity) {
      return NextResponse.json(
        { 
          error: `Cannot take ${quantityTaken} items. Only ${product.stockQuantity} available in stock.` 
        },
        { status: 400 }
      )
    }

    // Create exhibition product entry
    const exhibitionProduct = await db.exhibitionProduct.create({
      data: {
        exhibitionId: exhibitionId,
        productId: productId,
        quantityTaken: quantityTaken,
        quantitySold: 0,
        // Set initial pricing fields
        originalPrice: product.sellingPriceUSD,
        exhibitionPrice: product.sellingPriceUSD, // Default to same price
        discountPercentage: 0,
        isClearance: false,
        priceHistory: [
          {
            timestamp: new Date().toISOString(),
            action: 'product_added',
            originalPrice: product.sellingPriceUSD,
            exhibitionPrice: product.sellingPriceUSD,
            quantityTaken: quantityTaken,
            notes: `Product added to exhibition: ${exhibition.title}`
          }
        ]
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
      exhibitionProduct,
      message: `${product.name} added to exhibition successfully`
    })

  } catch (error) {
    console.error('Exhibition product creation error:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Product is already added to this exhibition' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
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
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get all products for this exhibition
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: { exhibitionId },
      include: {
        product: {
          include: {
            category: true,
            country: true
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    })

    // ✅ FIXED: Calculate summary statistics with proper typing
    const summary: ExhibitionProductsSummary = {
      totalProducts: exhibitionProducts.length,
      totalQuantityTaken: exhibitionProducts.reduce((sum, ep) => sum + ep.quantityTaken, 0),
      totalQuantitySold: exhibitionProducts.reduce((sum, ep) => sum + ep.quantitySold, 0),
      totalValue: exhibitionProducts.reduce((sum, ep) => {
        const finalPrice = ep.isClearance && ep.discountPercentage
          ? (ep.exhibitionPrice || ep.product.sellingPriceUSD) * (1 - ep.discountPercentage / 100)
          : (ep.exhibitionPrice || ep.product.sellingPriceUSD)
        return sum + (ep.quantityTaken * finalPrice)
      }, 0),
      totalRevenue: exhibitionProducts.reduce((sum, ep) => {
        const finalPrice = ep.isClearance && ep.discountPercentage
          ? (ep.exhibitionPrice || ep.product.sellingPriceUSD) * (1 - ep.discountPercentage / 100)
          : (ep.exhibitionPrice || ep.product.sellingPriceUSD)
        return sum + (ep.quantitySold * finalPrice)
      }, 0),
      clearanceProducts: exhibitionProducts.filter(ep => ep.isClearance).length,
      customPricedProducts: exhibitionProducts.filter(ep => 
        ep.exhibitionPrice && ep.exhibitionPrice !== ep.product.sellingPriceUSD
      ).length,
      // ✅ FIXED: Calculate sell-through rate directly in the object
      sellThroughRate: 0 // Will be calculated below
    }

    // ✅ FIXED: Calculate sell-through rate
    summary.sellThroughRate = summary.totalQuantityTaken > 0 
      ? (summary.totalQuantitySold / summary.totalQuantityTaken) * 100 
      : 0

    return NextResponse.json({
      exhibitionId,
      exhibition: {
        id: exhibition.id,
        title: exhibition.title,
        location: exhibition.location,
        startDate: exhibition.startDate,
        endDate: exhibition.endDate
      },
      products: exhibitionProducts,
      summary
    })

  } catch (error) {
    console.error('Exhibition products GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}