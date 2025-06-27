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
        isActive: true
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

    // Add stock filter
    if (!includeOutOfStock) {
      // Only include products with available stock
      productWhere.quantityTaken = {
        gt: 0
      }
    }

    // Get exhibition products with full product details
    let exhibitionProducts = await db.exhibitionProduct.findMany({
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
      orderBy: [
        {
          product: {
            category: {
              name: 'asc'
            }
          }
        },
        {
          product: {
            name: 'asc'
          }
        }
      ]
    })

    // Apply client-side filters for search and category
    if (search) {
      const searchLower = search.toLowerCase()
      exhibitionProducts = exhibitionProducts.filter(ep => 
        ep.product.name.toLowerCase().includes(searchLower) ||
        ep.product.sku.toLowerCase().includes(searchLower) ||
        ep.product.shortDescription?.toLowerCase().includes(searchLower)
      )
    }

    if (category) {
      exhibitionProducts = exhibitionProducts.filter(ep => 
        ep.product.category.name === category
      )
    }

    // Calculate pricing and stock for each product
    const productsWithPricing = exhibitionProducts.map(ep => {
      const product = ep.product
      const availableStock = ep.quantityTaken - ep.quantitySold
      
      // Calculate pricing hierarchy
      const originalStorePrice = product.discountPercentage > 0 
        ? product.sellingPriceUSD / (1 - product.discountPercentage / 100)
        : product.sellingPriceUSD
      
      const currentStorePrice = product.sellingPriceUSD
      const exhibitionPrice = ep.exhibitionPrice || currentStorePrice
      
      // Apply exhibition clearance discount if applicable
      const finalPrice = ep.isClearance && ep.discountPercentage
        ? exhibitionPrice * (1 - ep.discountPercentage / 100)
        : exhibitionPrice
      
      // Calculate total savings
      const totalSavings = originalStorePrice - finalPrice
      const totalDiscountPercent = originalStorePrice > 0 
        ? ((originalStorePrice - finalPrice) / originalStorePrice) * 100 
        : 0

      return {
        // Exhibition product info
        id: ep.id,
        exhibitionId: ep.exhibitionId,
        quantityTaken: ep.quantityTaken,
        quantitySold: ep.quantitySold,
        availableStock,
        
        // Exhibition pricing
        exhibitionPrice: ep.exhibitionPrice,
        originalPrice: ep.originalPrice,
        discountPercentage: ep.discountPercentage,
        isClearance: ep.isClearance,
        salesNotes: ep.salesNotes,
        lastSaleDate: ep.lastSaleDate,
        priceChangedAt: ep.priceChangedAt,
        
        // Calculated pricing
        pricing: {
          originalStorePrice,
          currentStorePrice,
          exhibitionPrice,
          finalPrice,
          totalSavings,
          totalDiscountPercent,
          hasStoreDiscount: (product.discountPercentage || 0) > 0,
          hasExhibitionPrice: ep.exhibitionPrice && ep.exhibitionPrice !== currentStorePrice,
          hasExhibitionDiscount: ep.isClearance && (ep.discountPercentage || 0) > 0,
          storeDiscountPercent: product.discountPercentage || 0,
          exhibitionDiscountPercent: ep.discountPercentage || 0
        },
        
        // Product details
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          shortDescription: product.shortDescription,
          images: product.images,
          sellingPriceUSD: product.sellingPriceUSD,
          discountPercentage: product.discountPercentage,
          stockQuantity: product.stockQuantity,
          tags: product.tags,
          barcode: product.barcode,
          barcodeType: product.barcodeType,
          category: product.category,
          country: product.country
        }
      }
    })

    // Filter out products with no stock unless explicitly requested
    const filteredProducts = includeOutOfStock 
      ? productsWithPricing
      : productsWithPricing.filter(p => p.availableStock > 0)

    // Calculate summary statistics
    const summary = {
      totalProducts: filteredProducts.length,
      totalAvailableStock: filteredProducts.reduce((sum, p) => sum + p.availableStock, 0),
      totalValue: filteredProducts.reduce((sum, p) => sum + (p.pricing.finalPrice * p.availableStock), 0),
      categoriesCount: [...new Set(filteredProducts.map(p => p.product.category.name))].length,
      clearanceProducts: filteredProducts.filter(p => p.isClearance).length,
      customPricedProducts: filteredProducts.filter(p => p.pricing.hasExhibitionPrice).length,
      outOfStockProducts: exhibitionProducts.filter(ep => (ep.quantityTaken - ep.quantitySold) <= 0).length
    }

    // Get unique categories for filtering
    const categories = [...new Set(filteredProducts.map(p => p.product.category.name))].sort()

    return NextResponse.json({
      exhibition,
      products: filteredProducts,
      summary,
      categories,
      filters: {
        includeOutOfStock,
        category,
        search
      }
    })

  } catch (error) {
    console.error('Exhibition products GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}