// =====================================
// src/app/api/products/route.ts - FIXED Customer Products API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client' // ✅ FIXED: Add Prisma import for types

// GET /api/products - Fetch published products for customers with proper stock filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const featured = searchParams.get('featured') === 'true'
    const inStock = searchParams.get('inStock') === 'true'

    // ✅ FIXED: Ensure sortOrder is properly typed as SortOrder
    const validSortOrder: Prisma.SortOrder = (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : 'desc'

    // Build where clause for customer products
    const where: any = {
      status: 'PUBLISHED',
      isActive: true
    }

    // Filter by category
    if (category) {
      where.categoryId = category
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.sellingPriceUSD = {}
      if (minPrice) where.sellingPriceUSD.gte = parseFloat(minPrice)
      if (maxPrice) where.sellingPriceUSD.lte = parseFloat(maxPrice)
    }

    // Featured products filter
    if (featured) {
      where.isFeatured = true
    }

    // ✅ ENHANCED: Smart stock filtering
    if (inStock) {
      // Show products that have stock > 0
      // This now works correctly because main stockQuantity is synced with size totals
      where.stockQuantity = {
        gt: 0
      }
    }

    // Count total products matching criteria
    const totalCount = await db.product.count({ where })

    // ✅ FIXED: Properly typed orderBy array
    let orderByArray: Prisma.ProductOrderByWithRelationInput[] = []

    // Build dynamic sorting based on sortBy parameter
    if (sortBy === 'price') {
      orderByArray.push({ sellingPriceUSD: validSortOrder })
    } else if (sortBy === 'name') {
      orderByArray.push({ name: validSortOrder })
    } else if (sortBy === 'featured') {
      orderByArray.push({ isFeatured: 'desc' }, { createdAt: 'desc' })
    } else {
      // Default: sort by creation date
      orderByArray.push({ createdAt: validSortOrder })
    }

    // Add secondary sorts
    orderByArray.push(
      { isFeatured: 'desc' },      // Secondary sort by featured status
      { stockQuantity: 'desc' }     // Tertiary sort by stock status (in-stock first)
    )

    // Fetch products with all necessary data
    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        shortDescription: true,
        description: true,
        sellingPriceUSD: true,
        // ✅ Include discount fields for customer display
        discountPercentage: true,
        showDiscountToCustomers: true,
        images: true,
        tags: true,
        stockQuantity: true, // ✅ Now properly synced for all products
        lowStockAlert: true,
        isFeatured: true,
        publishedAt: true,
        // ✅ Include size information for customer selection
        requiresSizes: true,
        productSizes: {
          select: {
            id: true,
            size: true,
            sku: true,
            stockQuantity: true,
            isActive: true,
            sortOrder: true
          },
          where: {
            isActive: true // Only show active sizes to customers
          },
          orderBy: {
            sortOrder: 'asc'
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        country: {
          select: {
            id: true,
            name: true,
            currency: true,
            currencySymbol: true
          }
        }
      },
      orderBy: orderByArray, // ✅ FIXED: Use properly typed array
      skip: (page - 1) * limit,
      take: limit
    })

    // ✅ ENHANCED: Enrich products with calculated stock information
    const enrichedProducts = products.map(product => {
      // Calculate stock status for display
      const isOutOfStock = product.stockQuantity === 0
      const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockAlert
      
      // For sized products, provide additional size information
      const sizeInfo = product.requiresSizes ? {
        totalSizes: product.productSizes?.length || 0,
        availableSizes: product.productSizes?.filter(size => size.stockQuantity > 0).length || 0,
        sizesOutOfStock: product.productSizes?.filter(size => size.stockQuantity === 0).length || 0
      } : null

      return {
        ...product,
        stockInfo: {
          isOutOfStock,
          isLowStock,
          isInStock: product.stockQuantity > 0,
          stockLevel: product.stockQuantity,
          stockStatus: isOutOfStock ? 'out_of_stock' : isLowStock ? 'low_stock' : 'in_stock'
        },
        sizeInfo
      }
    })

    // ✅ Filter out completely out-of-stock products if inStock filter is applied
    const finalProducts = inStock 
      ? enrichedProducts.filter(product => !product.stockInfo.isOutOfStock)
      : enrichedProducts

    return NextResponse.json({
      products: finalProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      },
      filters: {
        category,
        search,
        minPrice,
        maxPrice,
        featured,
        inStock,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Error fetching customer products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}