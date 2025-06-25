// =====================================
// src/app/api/products/route.ts - CUSTOMER PRODUCTS API WITH DISCOUNT SYSTEM
// =====================================

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
        sellingPriceUSD: true,
        discountPercentage: true,
        showDiscountToCustomers: true, // 🎯 INCLUDE DISCOUNT VISIBILITY
        images: true,
        tags: true,
        stockQuantity: true,
        isFeatured: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        // Featured products first
        { isFeatured: 'desc' },
        // Then by requested sort
        { [sortBy]: sortOrder },
        // Tiebreaker by creation date
        { createdAt: 'desc' }
      ],
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
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}