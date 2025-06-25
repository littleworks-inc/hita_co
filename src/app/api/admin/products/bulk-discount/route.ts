// =====================================
// src/app/api/admin/products/bulk-discount/route.ts - BULK DISCOUNT MANAGEMENT API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/admin/products/bulk-discount - Update discount settings for multiple products
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productIds, discountPercentage, showDiscountToCustomers, action } = await request.json()

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    if (productIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot update more than 100 products at once' },
        { status: 400 }
      )
    }

    if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage >= 100)) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 99.99' },
        { status: 400 }
      )
    }

    // Verify all products exist and belong to this store
    const existingProducts = await db.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        sellingPriceUSD: true,
        discountPercentage: true,
        showDiscountToCustomers: true
      }
    })

    if (existingProducts.length !== productIds.length) {
      const foundIds = existingProducts.map(p => p.id)
      const missingIds = productIds.filter(id => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}` },
        { status: 404 }
      )
    }

    // Prepare update data based on action
    const updateData: any = {}
    
    switch (action) {
      case 'set_discount':
        if (discountPercentage !== undefined) {
          updateData.discountPercentage = discountPercentage
        }
        if (showDiscountToCustomers !== undefined) {
          updateData.showDiscountToCustomers = showDiscountToCustomers
        }
        break
      
      case 'enable_discount_visibility':
        updateData.showDiscountToCustomers = true
        break
      
      case 'disable_discount_visibility':
        updateData.showDiscountToCustomers = false
        break
      
      case 'remove_all_discounts':
        updateData.discountPercentage = 0
        updateData.showDiscountToCustomers = false
        break
      
      default:
        // Manual update - include provided fields
        if (discountPercentage !== undefined) {
          updateData.discountPercentage = discountPercentage
        }
        if (showDiscountToCustomers !== undefined) {
          updateData.showDiscountToCustomers = showDiscountToCustomers
        }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      )
    }

    // Perform bulk update
    const updatedProducts = await db.product.updateMany({
      where: {
        id: { in: productIds }
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    // Log the action
    console.log(`Bulk discount update by user ${session.user.id}: ${action || 'manual'} on ${updatedProducts.count} products`)

    // Get updated products for response
    const updatedProductsList = await db.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        discountPercentage: true,
        showDiscountToCustomers: true,
        sellingPriceUSD: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedProducts.count} products`,
      updatedCount: updatedProducts.count,
      action: action || 'manual',
      products: updatedProductsList
    })

  } catch (error) {
    console.error('Error bulk updating products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/products/bulk-discount - Get discount statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get discount statistics
    const stats = await db.product.aggregate({
      _count: {
        id: true
      },
      _avg: {
        discountPercentage: true
      },
      _max: {
        discountPercentage: true
      },
      where: {
        status: 'PUBLISHED',
        isActive: true
      }
    })

    // Count products with discounts
    const productsWithDiscounts = await db.product.count({
      where: {
        discountPercentage: { gt: 0 },
        status: 'PUBLISHED',
        isActive: true
      }
    })

    // Count products showing discounts to customers
    const productsShowingDiscounts = await db.product.count({
      where: {
        showDiscountToCustomers: true,
        discountPercentage: { gt: 0 },
        status: 'PUBLISHED',
        isActive: true
      }
    })

    // Get discount distribution
    const discountRanges = await db.$queryRaw`
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
      WHERE status = 'PUBLISHED' AND "isActive" = true
      GROUP BY range
      ORDER BY 
        CASE 
          WHEN "discountPercentage" = 0 THEN 1
          WHEN "discountPercentage" <= 10 THEN 2
          WHEN "discountPercentage" <= 25 THEN 3
          WHEN "discountPercentage" <= 50 THEN 4
          ELSE 5
        END
    `

    return NextResponse.json({
      totalProducts: stats._count.id,
      averageDiscount: stats._avg.discountPercentage || 0,
      maxDiscount: stats._max.discountPercentage || 0,
      productsWithDiscounts,
      productsShowingDiscounts,
      discountRanges
    })

  } catch (error) {
    console.error('Error fetching discount statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}