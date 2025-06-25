// ✅ UPDATED: src/app/api/products/[id]/route.ts - Customer Product API with Discount Support

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/[id] - Fetch single product for customers
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch product with all necessary information including discount fields
    const product = await db.product.findUnique({
      where: { 
        id: params.id,
        status: 'PUBLISHED',
        isActive: true
      },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        shortDescription: true,
        sellingPriceUSD: true,
        // ✅ CRITICAL: Include discount fields for customer display
        discountPercentage: true,
        showDiscountToCustomers: true,
        images: true,
        tags: true,
        stockQuantity: true,
        lowStockAlert: true,
        isFeatured: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        country: {
          select: {
            id: true,
            name: true,
            currency: true,
            currencySymbol: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
            country: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Fetch related products from the same category (excluding current product)
    const relatedProducts = await db.product.findMany({
      where: {
        categoryId: product.category.id,
        id: { not: params.id },
        status: 'PUBLISHED',
        isActive: true,
        stockQuantity: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        sellingPriceUSD: true,
        // ✅ CRITICAL: Include discount fields for related products too
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
      take: 4,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ 
      product,
      relatedProducts
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/products/[id]/recommendations - Get product recommendations (optional endpoint)
export async function getRecommendations(
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