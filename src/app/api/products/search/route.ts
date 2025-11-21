// =====================================
// src/app/api/products/search/route.ts - PRODUCT SEARCH API WITH DISCOUNT SYSTEM
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

// GET /api/products/search - Advanced product search for customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const tags = searchParams.get('tags')?.split(',') || []
    const inStock = searchParams.get('inStock') === 'true'
    const onSale = searchParams.get('onSale') === 'true' // 🎯 NEW: Filter for discounted products
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 results per page

    // Build base where clause
    const where: any = {
      status: 'PUBLISHED',
      isActive: true
    }

    // Search functionality
    if (query.trim()) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: query.split(' ') } },
        { 
          category: {
            name: { contains: query, mode: 'insensitive' }
          }
        }
      ]
    }

    // Category filter
    if (category) {
      where.categoryId = category
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.sellingPriceUSD = {}
      if (minPrice) where.sellingPriceUSD.gte = parseFloat(minPrice)
      if (maxPrice) where.sellingPriceUSD.lte = parseFloat(maxPrice)
    }

    // Tags filter
    if (tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    // Stock filter
    if (inStock) {
      where.stockQuantity = { gt: 0 }
    }

    // 🎯 NEW: Sale/Discount filter
    if (onSale) {
      where.AND = [
        { discountPercentage: { gt: 0 } },
        { showDiscountToCustomers: true }
      ]
    }

    // Determine sort order
    let orderBy: any = []
    
    switch (sortBy) {
      case 'price_low':
        orderBy = [{ sellingPriceUSD: 'asc' }]
        break
      case 'price_high':
        orderBy = [{ sellingPriceUSD: 'desc' }]
        break
      case 'newest':
        orderBy = [{ createdAt: 'desc' }]
        break
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }]
        break
      case 'name':
        orderBy = [{ name: 'asc' }]
        break
      case 'discount': // 🎯 NEW: Sort by discount percentage
        orderBy = [
          { discountPercentage: 'desc' },
          { sellingPriceUSD: 'asc' }
        ]
        break
      case 'featured':
        orderBy = [
          { isFeatured: 'desc' },
          { createdAt: 'desc' }
        ]
        break
      default: // relevance
        orderBy = [
          { isFeatured: 'desc' },
          { stockQuantity: 'desc' },
          { createdAt: 'desc' }
        ]
    }

    // Count total results
    const totalCount = await db.product.count({ where })

    // Fetch products
    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        shortDescription: true,
        sellingPriceUSD: true,
        discountPercentage: true,
        showDiscountToCustomers: true, // 🎯 INCLUDE DISCOUNT VISIBILITY
        images: true,
        tags: true,
        stockQuantity: true,
        isFeatured: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    // 🎯 NEW: Add discount analytics to response
    const discountStats = onSale ? null : await db.product.aggregate({
      where: {
        ...where,
        discountPercentage: { gt: 0 },
        showDiscountToCustomers: true
      },
      _count: { id: true },
      _avg: { discountPercentage: true },
      _max: { discountPercentage: true }
    })

    // Get available filter options
    const facets = await Promise.all([
      // Categories
      db.product.groupBy({
        by: ['categoryId'],
        where,
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 10
      }).then(async (results) => {
        const categoryIds = results.map(r => r.categoryId)
        const categories = await db.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, slug: true }
        })
        return results.map(r => ({
          ...r,
          category: categories.find(c => c.id === r.categoryId)
        }))
      }),

      // Price ranges
      db.product.aggregate({
        where,
        _min: { sellingPriceUSD: true },
        _max: { sellingPriceUSD: true }
      }),

      // 🎯 NEW: Discount ranges
      db.$queryRaw`
        SELECT 
          CASE 
            WHEN "discountPercentage" = 0 THEN 'No Discount'
            WHEN "discountPercentage" <= 10 THEN '1-10%'
            WHEN "discountPercentage" <= 25 THEN '11-25%'
            WHEN "discountPercentage" <= 50 THEN '26-50%'
            ELSE '50%+'
          END as range,
          COUNT(*)::int as count
        FROM products
        WHERE ${where.status ? `status = '${where.status}'` : '1=1'}
          AND ${where.isActive ? `"isActive" = ${where.isActive}` : '1=1'}
          AND "showDiscountToCustomers" = true
          AND "discountPercentage" > 0
        GROUP BY range
        ORDER BY MIN("discountPercentage")
      `
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      facets: {
        categories: facets[0],
        priceRange: facets[1],
        discountRanges: facets[2]
      },
      discountStats,
      searchInfo: {
        query: query.trim(),
        hasFilters: !!(category || minPrice || maxPrice || tags.length > 0 || inStock || onSale),
        appliedFilters: {
          category,
          minPrice,
          maxPrice,
          tags,
          inStock,
          onSale
        }
      }
    })

  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products/search - Advanced search with complex filters
export async function POST(request: NextRequest) {
  try {
    const {
      query,
      filters,
      sort,
      pagination
    } = await request.json()

    // Build dynamic where clause from filters
    const where: any = {
      status: 'PUBLISHED',
      isActive: true
    }

    // Apply text search
    if (query?.trim()) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: query.split(' ') } }
      ]
    }

    // Apply filters
    if (filters) {
      if (filters.categories?.length > 0) {
        where.categoryId = { in: filters.categories }
      }

      if (filters.priceRange) {
        where.sellingPriceUSD = {}
        if (filters.priceRange.min) where.sellingPriceUSD.gte = filters.priceRange.min
        if (filters.priceRange.max) where.sellingPriceUSD.lte = filters.priceRange.max
      }

      if (filters.tags?.length > 0) {
        where.tags = { hasSome: filters.tags }
      }

      if (filters.inStock) {
        where.stockQuantity = { gt: 0 }
      }

      // 🎯 NEW: Discount filters
      if (filters.discount) {
        if (filters.discount.onSale) {
          where.AND = [
            { discountPercentage: { gt: 0 } },
            { showDiscountToCustomers: true }
          ]
        }
        
        if (filters.discount.minPercent || filters.discount.maxPercent) {
          where.discountPercentage = {}
          if (filters.discount.minPercent) where.discountPercentage.gte = filters.discount.minPercent
          if (filters.discount.maxPercent) where.discountPercentage.lte = filters.discount.maxPercent
        }
      }
    }

    // Apply sorting
    let orderBy: any = [{ createdAt: 'desc' }] // default
    if (sort) {
      switch (sort.field) {
        case 'price':
          orderBy = [{ sellingPriceUSD: sort.direction }]
          break
        case 'name':
          orderBy = [{ name: sort.direction }]
          break
        case 'date':
          orderBy = [{ createdAt: sort.direction }]
          break
        case 'discount':
          orderBy = [
            { discountPercentage: sort.direction },
            { sellingPriceUSD: 'asc' }
          ]
          break
      }
    }

    // Apply pagination
    const page = pagination?.page || 1
    const limit = Math.min(pagination?.limit || 20, 50)

    const totalCount = await db.product.count({ where })

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        shortDescription: true,
        sellingPriceUSD: true,
        discountPercentage: true,
        showDiscountToCustomers: true, // 🎯 INCLUDE DISCOUNT VISIBILITY
        images: true,
        tags: true,
        stockQuantity: true,
        isFeatured: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error in advanced search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}