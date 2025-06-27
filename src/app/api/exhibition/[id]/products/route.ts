// src/app/api/exhibition/[id]/products/route.ts
// =====================================
// Exhibition Products API for POS Interface
// Provides product data optimized for mobile POS usage
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

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
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        isActive: true,
        participationFee: true
      }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    if (!exhibition.isActive) {
      return NextResponse.json({ error: 'Exhibition is not active' }, { status: 400 })
    }

    // Get URL parameters for filtering
    const url = new URL(request.url)
    const includeOutOfStock = url.searchParams.get('includeOutOfStock') === 'true'
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')

    // Build where clause for products
    const productWhere: any = {
      exhibitionId,
      product: {
        isActive: true
      }
    }

    // Add stock filter - only show products with available stock unless specifically requested
    if (!includeOutOfStock) {
      // Add a filter to only include products with available stock
      // We'll filter this after the query since we need the calculated availableStock
    }

    // Add category filter
    if (category) {
      productWhere.product.category = {
        name: category
      }
    }

    // Add search filter
    if (search) {
      productWhere.product.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          sku: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Get exhibition products with full product details
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: productWhere,
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            },
            country: {
              select: {
                id: true,
                name: true,
                currencySymbol: true
              }
            }
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    })

    // Calculate available stock for each product and add pricing breakdown
    const productsWithStock = exhibitionProducts.map(ep => {
      const availableStock = ep.quantityTaken - ep.quantitySold
      
      // Calculate pricing breakdown similar to what the page expects
      const originalStorePrice = ep.product.discountPercentage > 0 
        ? ep.product.sellingPriceUSD / (1 - ep.product.discountPercentage / 100)
        : ep.product.sellingPriceUSD

      const currentStorePrice = ep.product.sellingPriceUSD
      const exhibitionPrice = ep.exhibitionPrice || currentStorePrice
      
      const finalPrice = ep.isClearance && ep.discountPercentage 
        ? exhibitionPrice * (1 - ep.discountPercentage / 100)
        : exhibitionPrice

      const totalSavings = originalStorePrice - finalPrice
      const totalDiscountPercent = originalStorePrice > 0 ? (totalSavings / originalStorePrice) * 100 : 0
      
      return {
        ...ep,
        availableStock,
        pricing: {
          originalStorePrice,
          currentStorePrice,
          exhibitionPrice,
          finalPrice,
          totalSavings,
          totalDiscountPercent,
          hasStoreDiscount: ep.product.discountPercentage > 0,
          hasExhibitionPrice: ep.exhibitionPrice ? true : false,
          hasExhibitionDiscount: ep.isClearance && ep.discountPercentage > 0,
          storeDiscountPercent: ep.product.discountPercentage,
          exhibitionDiscountPercent: ep.isClearance ? ep.discountPercentage : 0
        }
      }
    })

    // Filter out of stock if requested (apply after pricing calculation)
    const filteredProducts = includeOutOfStock 
      ? productsWithStock 
      : productsWithStock.filter(p => p.availableStock > 0)

    // Get unique categories for filtering
    const categories = [...new Set(
      exhibitionProducts.map(ep => ep.product.category.name)
    )].sort()

    // Calculate summary statistics
    const summary = {
      totalProducts: exhibitionProducts.length,
      totalAvailableStock: productsWithStock.reduce((sum, p) => sum + p.availableStock, 0),
      totalValue: productsWithStock.reduce((sum, p) => sum + (p.pricing.finalPrice * p.availableStock), 0),
      categoriesCount: categories.length,
      clearanceProducts: exhibitionProducts.filter(ep => ep.isClearance).length,
      customPricedProducts: productsWithStock.filter(p => p.pricing.hasExhibitionPrice).length,
      outOfStockProducts: productsWithStock.filter(p => p.availableStock === 0).length
    }

    return NextResponse.json({
      exhibition,
      products: filteredProducts,
      summary,
      categories,
      filters: {
        includeOutOfStock,
        category,
        search
      },
      success: true
    })

  } catch (error) {
    console.error('Exhibition Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}