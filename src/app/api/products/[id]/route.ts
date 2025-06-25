// =====================================
// src/app/api/products/[id]/route.ts - CUSTOMER PRODUCT DETAIL API WITH DISCOUNT SYSTEM
// =====================================

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
        discountPercentage: true,
        showDiscountToCustomers: true, // 🎯 INCLUDE DISCOUNT VISIBILITY
        images: true,
        tags: true,
        stockQuantity: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        updatedAt: true,
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
            name: true,
            currency: true,
            currencySymbol: true
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
        discountPercentage: true,
        showDiscountToCustomers: true, // 🎯 INCLUDE DISCOUNT VISIBILITY
        images: true,
        stockQuantity: true
      },
      take: 4,
      orderBy: {
        createdAt: 'desc'
      }
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

// GET /api/products/[id]/recommendations - Get product recommendations
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

    // Get recommendations based on category and similar price range
    const priceRange = {
      min: currentProduct.sellingPriceUSD * 0.7, // 30% lower
      max: currentProduct.sellingPriceUSD * 1.3  // 30% higher
    }

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
              gte: priceRange.min,
              lte: priceRange.max
            }
          },
          // Similar tags
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
        discountPercentage: true,
        showDiscountToCustomers: true, // 🎯 INCLUDE DISCOUNT VISIBILITY
        images: true,
        stockQuantity: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      take: 6,
      orderBy: [
        { isFeatured: 'desc' },
        { stockQuantity: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ recommendations })

  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}