// src/app/api/products/route.ts
// ✅ FIXED: Properly handle dynamic server usage for query parameters

import { NextRequest, NextResponse } from 'next/server'
import { db, buildSafeDb } from '@/lib/db'

// ✅ IMPORTANT: Mark as dynamic since we use request.url for query params
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ✅ SAFE: Access URL after marking as dynamic
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const featured = searchParams.get('featured') === 'true'

    // Validate parameters
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 50) // Max 50 items per page
    const skip = (validatedPage - 1) * validatedLimit

    // Build where clause
    const whereConditions: any = {
      status: 'PUBLISHED'
    }

    if (category) {
      whereConditions.category = {
        slug: category
      }
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    if (featured) {
      whereConditions.isFeatured = true
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' } // Default: newest first

    switch (sort) {
      case 'price-low':
        orderBy = { sellingPriceUSD: 'asc' }
        break
      case 'price-high':
        orderBy = { sellingPriceUSD: 'desc' }
        break
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'featured':
        orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // ✅ SAFE: Use build-safe database operations
    const [products, totalCount] = await Promise.all([
      buildSafeDb.execute(
        () => db.product.findMany({
          where: whereConditions,
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPriceUSD: true,
            images: true,
            isFeatured: true,
            stockQuantity: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          orderBy,
          skip,
          take: validatedLimit
        }),
        [] // Fallback to empty array
      ),
      buildSafeDb.execute(
        () => db.product.count({ where: whereConditions }),
        0 // Fallback to 0
      )
    ])

    // Calculate pagination info
    const totalPages = Math.ceil((totalCount || 0) / validatedLimit)
    const hasNextPage = validatedPage < totalPages
    const hasPrevPage = validatedPage > 1

    return NextResponse.json({
      success: true,
      products: products || [],
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalCount: totalCount || 0,
        hasNextPage,
        hasPrevPage,
        limit: validatedLimit
      },
      filters: {
        category,
        search,
        sort,
        featured
      }
    })

  } catch (error) {
    console.error('Products API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      products: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 12
      }
    }, { status: 500 })
  }
}

// ✅ Also handle POST requests for creating products (admin only)
export async function POST(request: NextRequest) {
  try {
    // This would handle product creation
    // For now, return method not allowed for public API
    return NextResponse.json({
      success: false,
      error: 'Method not allowed for public API'
    }, { status: 405 })

  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}