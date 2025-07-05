// ✅ FIXED: src/app/api/products/[id]/route.ts - Customer Product API with Discount Support

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