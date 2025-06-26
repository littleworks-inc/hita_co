// src/app/api/admin/exhibitions/[id]/products/bulk-clearance/route.ts
// =====================================
// Bulk Clearance API Endpoint
// Handles bulk clearance operations for exhibition products
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get bulk operation data from request
    const data = await request.json()
    const {
      productIds = [],
      discountPercentage = 0,
      isClearance = true,
      operation = 'apply_clearance', // 'apply_clearance' | 'remove_clearance' | 'update_discount'
      notes = ''
    } = data

    // Validation
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Validate that all product IDs belong to this exhibition
    const existingProducts = await db.exhibitionProduct.findMany({
      where: {
        id: { in: productIds },
        exhibitionId: exhibitionId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPriceUSD: true
          }
        }
      }
    })

    if (existingProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products were not found in this exhibition' },
        { status: 400 }
      )
    }

    // Prepare bulk update data based on operation
    let updateData: any = {
      priceChangedAt: new Date()
    }

    const bulkHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'bulk_operation',
      operation: operation,
      productCount: productIds.length,
      notes: notes
    }

    switch (operation) {
      case 'apply_clearance':
        updateData = {
          ...updateData,
          isClearance: true,
          discountPercentage: discountPercentage
        }
        bulkHistoryEntry.action = 'bulk_clearance_applied'
        break

      case 'remove_clearance':
        updateData = {
          ...updateData,
          isClearance: false,
          discountPercentage: 0
        }
        bulkHistoryEntry.action = 'bulk_clearance_removed'
        break

      case 'update_discount':
        updateData = {
          ...updateData,
          discountPercentage: discountPercentage
        }
        bulkHistoryEntry.action = 'bulk_discount_updated'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Must be apply_clearance, remove_clearance, or update_discount' },
          { status: 400 }
        )
    }

    // Perform bulk update with price history tracking
    const results = []
    
    for (const product of existingProducts) {
      // Calculate final price for this product
      const basePrice = product.exhibitionPrice || product.product.sellingPriceUSD
      const finalPrice = updateData.isClearance 
        ? basePrice * (1 - updateData.discountPercentage / 100)
        : basePrice

      // Prepare individual price history entry
      const currentPriceHistory = product.priceHistory as any[] || []
      const individualHistoryEntry = {
        ...bulkHistoryEntry,
        productId: product.productId,
        productName: product.product.name,
        changes: {
          isClearance: {
            from: product.isClearance,
            to: updateData.isClearance
          },
          discountPercentage: {
            from: product.discountPercentage,
            to: updateData.discountPercentage
          }
        },
        finalPrice: finalPrice
      }

      // Update individual product
      const updatedProduct = await db.exhibitionProduct.update({
        where: { id: product.id },
        data: {
          ...updateData,
          priceHistory: [...currentPriceHistory, individualHistoryEntry]
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPriceUSD: true
            }
          }
        }
      })

      results.push({
        exhibitionProductId: updatedProduct.id,
        productName: updatedProduct.product.name,
        sku: updatedProduct.product.sku,
        finalPrice: finalPrice,
        success: true
      })
    }

    // Log the bulk operation for audit purposes
    console.log(`Bulk clearance operation completed:`, {
      exhibitionId,
      operation,
      productCount: results.length,
      discountPercentage,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      operation: operation,
      productsUpdated: results.length,
      results: results,
      summary: {
        exhibitionId,
        operation,
        discountPercentage,
        productsAffected: results.length,
        timestamp: new Date().toISOString()
      },
      message: `Successfully ${operation.replace('_', ' ')} for ${results.length} products`
    })

  } catch (error) {
    console.error('Bulk clearance operation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id

    // Get clearance statistics for the exhibition
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: { exhibitionId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPriceUSD: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (exhibitionProducts.length === 0) {
      return NextResponse.json({
        exhibitionId,
        statistics: {
          totalProducts: 0,
          clearanceProducts: 0,
          customPricedProducts: 0,
          averageDiscount: 0,
          totalSavings: 0
        },
        clearanceProducts: []
      })
    }

    // Calculate clearance statistics
    const clearanceProducts = exhibitionProducts.filter(ep => ep.isClearance)
    const customPricedProducts = exhibitionProducts.filter(ep => 
      ep.exhibitionPrice && ep.exhibitionPrice !== ep.product.sellingPriceUSD
    )

    const totalSavings = exhibitionProducts.reduce((sum, ep) => {
      const originalPrice = ep.product.sellingPriceUSD
      const finalPrice = ep.isClearance && ep.discountPercentage
        ? (ep.exhibitionPrice || originalPrice) * (1 - ep.discountPercentage / 100)
        : (ep.exhibitionPrice || originalPrice)
      return sum + (originalPrice - finalPrice)
    }, 0)

    const averageDiscount = clearanceProducts.length > 0
      ? clearanceProducts.reduce((sum, ep) => sum + (ep.discountPercentage || 0), 0) / clearanceProducts.length
      : 0

    const statistics = {
      totalProducts: exhibitionProducts.length,
      clearanceProducts: clearanceProducts.length,
      customPricedProducts: customPricedProducts.length,
      averageDiscount: Math.round(averageDiscount * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      clearancePercentage: Math.round((clearanceProducts.length / exhibitionProducts.length) * 100)
    }

    // Format clearance products for response
    const clearanceProductsData = clearanceProducts.map(ep => {
      const originalPrice = ep.product.sellingPriceUSD
      const exhibitionPrice = ep.exhibitionPrice || originalPrice
      const finalPrice = ep.discountPercentage
        ? exhibitionPrice * (1 - ep.discountPercentage / 100)
        : exhibitionPrice

      return {
        id: ep.id,
        productId: ep.productId,
        productName: ep.product.name,
        sku: ep.product.sku,
        category: ep.product.category.name,
        originalPrice,
        exhibitionPrice,
        discountPercentage: ep.discountPercentage,
        finalPrice,
        savings: originalPrice - finalPrice,
        quantityTaken: ep.quantityTaken,
        quantitySold: ep.quantitySold
      }
    })

    return NextResponse.json({
      exhibitionId,
      statistics,
      clearanceProducts: clearanceProductsData
    })

  } catch (error) {
    console.error('Bulk clearance GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}