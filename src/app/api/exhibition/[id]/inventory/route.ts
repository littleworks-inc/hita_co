// src/app/api/exhibition/[id]/inventory/route.ts
// =====================================
// Exhibition Inventory API Endpoint
// Returns exhibition products with stock and pricing information
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

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
    const { searchParams } = new URL(request.url)
    const includeOutOfStock = searchParams.get('includeOutOfStock') === 'true'
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Validate exhibition exists
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

    // Build where clause for filtering
    let productWhere: any = {
      exhibitionId
    }

    // Category filter
    if (category) {
      productWhere.product = {
        ...productWhere.product,
        category: {
          name: category
        }
      }
    }

    // Search filter
    if (search) {
      productWhere.OR = [
        {
          product: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          product: {
            sku: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          product: {
            description: {
              contains: search,
              mode: 'insensitive'
            }
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
      
      // ✅ FIXED: Handle null discountPercentage properly
      const productDiscountPercentage = ep.product.discountPercentage || 0
      const exhibitionDiscountPercentage = ep.discountPercentage || 0
      
      // Calculate pricing breakdown similar to what the page expects
      const originalStorePrice = productDiscountPercentage > 0 
        ? ep.product.sellingPriceUSD / (1 - productDiscountPercentage / 100)
        : ep.product.sellingPriceUSD

      const currentStorePrice = ep.product.sellingPriceUSD
      const exhibitionPrice = ep.exhibitionPrice || currentStorePrice
      
      // ✅ FIXED: Handle null discountPercentage in clearance calculation
      const finalPrice = ep.isClearance && exhibitionDiscountPercentage > 0
        ? exhibitionPrice * (1 - exhibitionDiscountPercentage / 100)
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
          hasStoreDiscount: productDiscountPercentage > 0,
          hasExhibitionPrice: ep.exhibitionPrice ? true : false,
          // ✅ FIXED: Proper null safety for discountPercentage
          hasExhibitionDiscount: ep.isClearance && exhibitionDiscountPercentage > 0,
          storeDiscountPercent: productDiscountPercentage,
          exhibitionDiscountPercent: ep.isClearance ? exhibitionDiscountPercentage : 0
        }
      }
    })

    // Filter out of stock if requested (apply after pricing calculation)
    const filteredProducts = includeOutOfStock 
      ? productsWithStock 
      : productsWithStock.filter(p => p.availableStock > 0)

    // Get unique categories for filtering - compatible with older TypeScript targets
    const categoryNames = exhibitionProducts.map(ep => ep.product.category.name)
    const categories = categoryNames
      .filter((category, index) => categoryNames.indexOf(category) === index)
      .sort()

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