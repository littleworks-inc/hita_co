// src/app/api/products/route.ts - FIXED with all required fields for ProductCard
import { NextRequest, NextResponse } from 'next/server'
import { db, buildSafeDb } from '@/lib/db'

// Mark as dynamic since we use request.url for query params
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Access URL after marking as dynamic
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const featured = searchParams.get('featured') === 'true'
    const status = searchParams.get('status') || 'PUBLISHED' // Default to published

    // Validate parameters
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 50) // Max 50 items per page
    const skip = (validatedPage - 1) * validatedLimit

    // Build where clause
    const whereConditions: any = {
      status: status, // Use the status parameter
      isActive: true,
      stockQuantity: { gt: 0 } // Only show products with stock > 0
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

    // Execute queries with all required fields for ProductCard
    const [products, totalCount] = await Promise.all([
      buildSafeDb.execute(
        () => db.product.findMany({
          where: whereConditions,
          select: {
            id: true,
            sku: true,
            name: true,
            shortDescription: true,
            sellingPriceUSD: true,
            discountPercentage: true,
            showDiscountToCustomers: true,
            images: true,
            stockQuantity: true,
            isFeatured: true,
            status: true,
            createdAt: true,
            // Include category relation with all required fields
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            // Include country relation with all required fields
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
    const totalPages = Math.ceil(totalCount / validatedLimit)
    const hasNextPage = validatedPage < totalPages
    const hasPrevPage = validatedPage > 1

    // Return properly formatted response
    return NextResponse.json({
      products,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
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
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        products: [],
        pagination: {
          page: 1,
          limit: 12,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      },
      { status: 500 }
    )
  }
}