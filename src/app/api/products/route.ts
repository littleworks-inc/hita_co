// ✅ UPDATED: src/app/api/products/route.ts - Customer Products API with Discount Support

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products - Fetch published products for customers
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

    // In stock filter
    if (inStock) {
      where.stockQuantity = {
        gt: 0
      }
    }

    // Count total products
    const totalCount = await db.product.count({ where })

    // Fetch products with discount information
    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        shortDescription: true,
        description: true,
        sellingPriceUSD: true,
        // ✅ CRITICAL: Include discount fields for customer display
        discountPercentage: true,
        showDiscountToCustomers: true,
        images: true,
        tags: true,
        stockQuantity: true,
        lowStockAlert: true,
        isFeatured: true,
        publishedAt: true,
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
      orderBy: [
        // Dynamic sorting
        ...(sortBy === 'price' 
          ? [{ sellingPriceUSD: sortOrder === 'asc' ? 'asc' : 'desc' }]
          : sortBy === 'name'
          ? [{ name: sortOrder === 'asc' ? 'asc' : 'desc' }]
          : sortBy === 'featured'
          ? [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
          : [{ [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' }]
        )
      ] as any,
      skip: (page - 1) * limit,
      take: limit
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
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

// POST /api/products/search - Advanced search endpoint (optional)
export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      filters, 
      page = 1, 
      limit = 12,
      sortBy = 'relevance' 
    } = await request.json()

    const where: any = {
      status: 'PUBLISHED',
      isActive: true
    }

    // Text search
    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ]
    }

    // Apply filters
    if (filters) {
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        where.categoryId = { in: filters.categoryIds }
      }
      
      if (filters.priceRange) {
        where.sellingPriceUSD = {}
        if (filters.priceRange.min) where.sellingPriceUSD.gte = filters.priceRange.min
        if (filters.priceRange.max) where.sellingPriceUSD.lte = filters.priceRange.max
      }
      
      if (filters.inStock) {
        where.stockQuantity = { gt: 0 }
      }
      
      if (filters.featured) {
        where.isFeatured = true
      }

      if (filters.onSale) {
        // ✅ NEW: Filter for products with active customer discounts
        where.AND = [
          { discountPercentage: { gt: 0 } },
          { showDiscountToCustomers: true }
        ]
      }
    }

    // Sorting
    let orderBy: any = []
    switch (sortBy) {
      case 'price-low':
        orderBy = [{ sellingPriceUSD: 'asc' }]
        break
      case 'price-high':
        orderBy = [{ sellingPriceUSD: 'desc' }]
        break
      case 'newest':
        orderBy = [{ publishedAt: 'desc' }]
        break
      case 'featured':
        orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
        break
      case 'sale':
        // ✅ NEW: Sort by discount percentage
        orderBy = [{ discountPercentage: 'desc' }, { isFeatured: 'desc' }]
        break
      default: // relevance
        orderBy = [
          { isFeatured: 'desc' },
          { stockQuantity: 'desc' },
          { createdAt: 'desc' }
        ]
    }

    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          shortDescription: true,
          sellingPriceUSD: true,
          // ✅ CRITICAL: Include discount fields
          discountPercentage: true,
          showDiscountToCustomers: true,
          images: true,
          stockQuantity: true,
          isFeatured: true,
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
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      db.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        applied: filters,
        query
      }
    })

  } catch (error) {
    console.error('Error in advanced product search:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}