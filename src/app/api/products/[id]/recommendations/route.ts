// src/app/api/products/[id]/recommendations/route.ts
// Separate endpoint for product recommendations

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/[id]/recommendations - Get product recommendations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current product to understand its category and tags
    const currentProduct = await db.product.findUnique({
      where: { 
        id: params.id,
        status: 'PUBLISHED',
        isActive: true
      },
      select: {
        categoryId: true,
        tags: true,
        sellingPriceUSD: true
      }
    })

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get recommendations based on similar price range and category
    const priceMin = currentProduct.sellingPriceUSD * 0.7 // 30% below
    const priceMax = currentProduct.sellingPriceUSD * 1.3 // 30% above

    const recommendations = await db.product.findMany({
      where: {
        id: { not: params.id },
        status: 'PUBLISHED',
        isActive: true,
        stockQuantity: { gt: 0 },
        OR: [
          // Same category
          { categoryId: currentProduct.categoryId },
          // Similar price range
          { 
            sellingPriceUSD: {
              gte: priceMin,
              lte: priceMax
            }
          },
          // Shared tags
          {
            tags: {
              hasSome: currentProduct.tags
            }
          }
        ]
      },
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
      take: 8,
      orderBy: [
        { isFeatured: 'desc' },
        { stockQuantity: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ 
      recommendations
    })

  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}