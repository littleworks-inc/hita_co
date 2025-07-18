// =====================================
// src/app/api/admin/exhibitions/[id]/products/route.ts - SHARED STOCK SYSTEM
// 🔄 MODIFIED: Implements shared stock - exhibition allocation doesn't reduce customer stock
// 📊 ENHANCED: Adds sales channel tracking for analytics
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// =====================================
// 🔄 NEW: SHARED STOCK CALCULATION HELPER
// =====================================
async function calculateTotalSoldAcrossChannels(productId: string, sizeId?: string): Promise<number> {
  // Calculate sales from customer orders (online channel)
  const customerOrderItems = await db.orderItem.findMany({
    where: {
      productId,
      ...(sizeId && { productSizeId: sizeId }),
      order: {
        status: { not: 'CANCELLED' }
      }
    },
    select: { quantity: true }
  })
  
  const soldToCustomers = customerOrderItems.reduce((sum, item) => sum + item.quantity, 0)

  // Calculate sales from exhibitions (POS channel)
  const exhibitionSaleItems = await db.exhibitionSaleItem.findMany({
    where: {
      productId,
      ...(sizeId && { productSizeId: sizeId })
    },
    select: { quantity: true }
  })
  
  const soldAtExhibitions = exhibitionSaleItems.reduce((sum, item) => sum + item.quantity, 0)

  return soldToCustomers + soldAtExhibitions
}

// =====================================
// 🔄 NEW: SHARED STOCK AVAILABILITY CHECK
// =====================================
async function checkSharedStockAvailability(
  productId: string, 
  requestedQuantity: number, 
  sizeAllocations?: Array<{ sizeId: string, quantity: number }>
): Promise<{ available: boolean, details: string }> {
  
  if (sizeAllocations) {
    // Check each size separately
    for (const allocation of sizeAllocations) {
      const productSize = await db.productSize.findUnique({
        where: { id: allocation.sizeId },
        select: { stockQuantity: true, size: true }
      })
      
      if (!productSize) {
        return { available: false, details: `Size not found` }
      }
      
      const totalSoldThisSize = await calculateTotalSoldAcrossChannels(productId, allocation.sizeId)
      const availableThisSize = productSize.stockQuantity - totalSoldThisSize
      
      if (allocation.quantity > availableThisSize) {
        return { 
          available: false, 
          details: `Size ${productSize.size}: Only ${availableThisSize} available, requested ${allocation.quantity}` 
        }
      }
    }
    return { available: true, details: 'All size allocations available' }
  } else {
    // Check main product
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true, name: true }
    })
    
    if (!product) {
      return { available: false, details: 'Product not found' }
    }
    
    const totalSold = await calculateTotalSoldAcrossChannels(productId)
    const availableStock = product.stockQuantity - totalSold
    
    if (requestedQuantity > availableStock) {
      return { 
        available: false, 
        details: `Only ${availableStock} available (${totalSold} sold across all channels), requested ${requestedQuantity}` 
      }
    }
    
    return { available: true, details: `${availableStock} available for allocation` }
  }
}

// =====================================
// POST - ADD PRODUCT TO EXHIBITION (SHARED STOCK)
// =====================================
export async function POST(
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
      where: { id: exhibitionId },
      select: { id: true, title: true, isActive: true }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get request data
    const data = await request.json()
    const { productId, quantityTaken, sizes } = data

    console.log('🔄 SHARED STOCK: Allocating product to exhibition:', { productId, quantityTaken, sizes })

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Validate product exists and is active
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        country: true,
        productSizes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Cannot add inactive product to exhibition' },
        { status: 400 }
      )
    }

    // Check if product is already in this exhibition
    const existingExhibitionProduct = await db.exhibitionProduct.findFirst({
      where: {
        exhibitionId: exhibitionId,
        productId: productId
      }
    })

    if (existingExhibitionProduct) {
      return NextResponse.json(
        { error: 'Product is already added to this exhibition' },
        { status: 400 }
      )
    }

    // =====================================
    // 🔄 SHARED STOCK IMPLEMENTATION
    // =====================================
    
    if (product.requiresSizes) {
      // ✅ SIZE-BASED PRODUCT ALLOCATION (SHARED STOCK)
      if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
        return NextResponse.json(
          { error: 'Size selections are required for this product' },
          { status: 400 }
        )
      }

      // Validate size selections and prepare allocation data
      const sizeAllocations = []
      for (const sizeSelection of sizes) {
        const { productSizeId, quantityTaken: sizeQuantity } = sizeSelection

        if (!productSizeId || !sizeQuantity || sizeQuantity <= 0) {
          return NextResponse.json(
            { error: 'Invalid size selection data' },
            { status: 400 }
          )
        }

        // Validate the product size exists
        const productSize = product.productSizes.find(ps => ps.id === productSizeId)
        if (!productSize) {
          return NextResponse.json(
            { error: `Invalid size selection for product` },
            { status: 400 }
          )
        }

        sizeAllocations.push({
          sizeId: productSizeId,
          quantity: sizeQuantity,
          size: productSize.size
        })
      }

      // 🔄 SHARED STOCK CHECK: Verify availability across all channels
      const availabilityCheck = await checkSharedStockAvailability(productId, 0, sizeAllocations)
      if (!availabilityCheck.available) {
        return NextResponse.json(
          { error: `🔄 SHARED STOCK: ${availabilityCheck.details}` },
          { status: 400 }
        )
      }

      // Calculate total quantity from all sizes
      const totalQuantity = sizes.reduce((sum: number, size: any) => sum + size.quantityTaken, 0)

      // 🔄 CREATE EXHIBITION ALLOCATION (NO STOCK REDUCTION)
      const result = await db.$transaction(async (tx) => {
        // Create main exhibition product entry
        const exhibitionProduct = await tx.exhibitionProduct.create({
          data: {
            exhibitionId: exhibitionId,
            productId: productId,
            quantityTaken: totalQuantity,
            quantitySold: 0,
            originalPrice: product.sellingPriceUSD,
            exhibitionPrice: product.sellingPriceUSD,
            discountPercentage: 0,
            isClearance: false,
            priceHistory: [
              {
                timestamp: new Date().toISOString(),
                action: 'product_allocated_shared_stock',
                originalPrice: product.sellingPriceUSD,
                exhibitionPrice: product.sellingPriceUSD,
                quantityAllocated: totalQuantity,
                notes: `🔄 SHARED STOCK: Product allocated to exhibition: ${exhibition.title}`,
                sizes: sizes.map((s: any) => ({
                  sizeId: s.productSizeId,
                  quantity: s.quantityTaken
                })),
                systemNote: 'Shared stock system - no inventory reduction on allocation'
              }
            ]
          },
          include: {
            product: {
              include: {
                category: true,
                country: true
              }
            }
          }
        })

        // Create exhibition product sizes entries
        const exhibitionSizesData = sizes.map((sizeSelection: any) => ({
          exhibitionProductId: exhibitionProduct.id,
          productSizeId: sizeSelection.productSizeId,
          quantityTaken: sizeSelection.quantityTaken,
          quantitySold: 0
        }))

        await tx.exhibitionProductSize.createMany({
          data: exhibitionSizesData
        })

        // 🔄 KEY CHANGE: NO STOCK REDUCTION ON ALLOCATION
        // In shared stock system, we track allocation but don't reduce inventory
        // Stock is only reduced when actual sales happen

        console.log('✅ SHARED STOCK: Sized product allocated successfully (no stock reduction):', exhibitionProduct.id)
        
        return exhibitionProduct
      })

      return NextResponse.json({
        success: true,
        exhibitionProduct: result,
        message: `🔄 SHARED STOCK: ${product.name} (${totalQuantity} units across ${sizes.length} sizes) allocated to exhibition. Stock remains available for all channels.`,
        systemNote: 'Shared stock allocation - inventory will be reduced only when sales occur'
      })

    } else {
      // ✅ NON-SIZED PRODUCT ALLOCATION (SHARED STOCK)
      if (!quantityTaken || quantityTaken <= 0) {
        return NextResponse.json(
          { error: 'Quantity taken must be greater than 0' },
          { status: 400 }
        )
      }

      // 🔄 SHARED STOCK CHECK: Verify availability across all channels
      const availabilityCheck = await checkSharedStockAvailability(productId, quantityTaken)
      if (!availabilityCheck.available) {
        return NextResponse.json(
          { error: `🔄 SHARED STOCK: ${availabilityCheck.details}` },
          { status: 400 }
        )
      }

      // 🔄 CREATE EXHIBITION ALLOCATION (NO STOCK REDUCTION)
      const exhibitionProduct = await db.exhibitionProduct.create({
        data: {
          exhibitionId: exhibitionId,
          productId: productId,
          quantityTaken: quantityTaken,
          quantitySold: 0,
          originalPrice: product.sellingPriceUSD,
          exhibitionPrice: product.sellingPriceUSD,
          discountPercentage: 0,
          isClearance: false,
          priceHistory: [
            {
              timestamp: new Date().toISOString(),
              action: 'product_allocated_shared_stock',
              originalPrice: product.sellingPriceUSD,
              exhibitionPrice: product.sellingPriceUSD,
              quantityAllocated: quantityTaken,
              notes: `🔄 SHARED STOCK: Product allocated to exhibition: ${exhibition.title}`,
              systemNote: 'Shared stock system - no inventory reduction on allocation'
            }
          ]
        },
        include: {
          product: {
            include: {
              category: true,
              country: true
            }
          }
        }
      })

      // 🔄 KEY CHANGE: NO STOCK REDUCTION ON ALLOCATION
      // In shared stock system, we track allocation but don't reduce inventory
      // The old code would do: await db.product.update({ data: { stockQuantity: { decrement: quantityTaken } } })
      // We DON'T do this anymore

      console.log('✅ SHARED STOCK: Regular product allocated successfully (no stock reduction):', exhibitionProduct.id)

      return NextResponse.json({
        success: true,
        exhibitionProduct,
        message: `🔄 SHARED STOCK: ${product.name} (${quantityTaken} units) allocated to exhibition. Stock remains available for all channels.`,
        systemNote: 'Shared stock allocation - inventory will be reduced only when sales occur'
      })
    }

  } catch (error) {
    console.error('🔄 SHARED STOCK: Exhibition product allocation error:', error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Product is already added to this exhibition' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================
// GET - FETCH EXHIBITION PRODUCTS (ENHANCED WITH SHARED STOCK INFO)
// =====================================
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

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get exhibition products with enhanced shared stock information
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: { exhibitionId },
      include: {
        product: {
          include: {
            category: true,
            country: true,
            productSizes: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        exhibitionSizes: {
          include: {
            productSize: true
          },
          orderBy: {
            productSize: {
              sortOrder: 'asc'
            }
          }
        }
      },
      orderBy: {
        product: {
          createdAt: 'desc'
        }
      }
    })

    // 🔄 ENHANCED: Add shared stock information to each product
    const enhancedProducts = await Promise.all(
      exhibitionProducts.map(async (ep) => {
        // Calculate total sold across all channels for this product
        const totalSoldAllChannels = await calculateTotalSoldAcrossChannels(ep.productId)
        
        // Calculate available stock (shared across all channels)
        const product = ep.product
        const totalInventory = product.requiresSizes 
          ? product.productSizes.reduce((sum, size) => sum + size.stockQuantity, 0)
          : product.stockQuantity
        
        const sharedAvailableStock = Math.max(0, totalInventory - totalSoldAllChannels)
        
        // Calculate exhibition-specific remaining allocation
        const exhibitionRemaining = Math.max(0, ep.quantityTaken - ep.quantitySold)

        return {
          ...ep,
          // 🔄 NEW: Shared stock analytics
          sharedStockInfo: {
            totalInventory,
            totalSoldAllChannels,
            sharedAvailableStock,
            exhibitionAllocated: ep.quantityTaken,
            exhibitionSold: ep.quantitySold,
            exhibitionRemaining,
            canStillSellFromSharedStock: sharedAvailableStock > 0,
            // Analytics for reporting
            soldOnlineEstimate: totalSoldAllChannels - ep.quantitySold,
            stockUtilization: totalInventory > 0 ? (totalSoldAllChannels / totalInventory) * 100 : 0
          }
        }
      })
    )

    // Get available products (not in this exhibition)
    const existingProductIds = exhibitionProducts.map(ep => ep.productId)

    const availableProducts = await db.product.findMany({
      where: {
        id: { notIn: existingProductIds },
        isActive: true
      },
      include: {
        category: true,
        country: true,
        productSizes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate summary with shared stock insights
    const summary = {
      totalProducts: exhibitionProducts.length,
      totalQuantityAllocated: exhibitionProducts.reduce((sum, ep) => sum + ep.quantityTaken, 0),
      totalQuantitySoldAtExhibition: exhibitionProducts.reduce((sum, ep) => sum + ep.quantitySold, 0),
      totalValue: exhibitionProducts.reduce((sum, ep) => {
        const originalPrice = ep.originalPrice ?? 0
        return sum + (originalPrice * ep.quantityTaken)
      }, 0),
      totalRevenue: exhibitionProducts.reduce((sum, ep) => {
        const originalPrice = ep.originalPrice ?? 0
        const exhibitionPrice = ep.exhibitionPrice ?? originalPrice
        return sum + (exhibitionPrice * ep.quantitySold)
      }, 0),
      clearanceProducts: exhibitionProducts.filter(ep => ep.isClearance).length,
      customPricedProducts: exhibitionProducts.filter(ep =>
        ep.exhibitionPrice !== null &&
        ep.originalPrice !== null &&
        ep.exhibitionPrice !== ep.originalPrice
      ).length,
      productsFullySoldAtExhibition: exhibitionProducts.filter(ep => ep.quantityTaken <= ep.quantitySold).length,
      
      // 🔄 NEW: Shared stock summary
      sharedStockSummary: {
        totalProductsInSharedPool: enhancedProducts.length,
        productsWithSharedStockAvailable: enhancedProducts.filter(ep => ep.sharedStockInfo.sharedAvailableStock > 0).length,
        averageStockUtilization: enhancedProducts.length > 0 
          ? enhancedProducts.reduce((sum, ep) => sum + ep.sharedStockInfo.stockUtilization, 0) / enhancedProducts.length 
          : 0
      }
    }

    // Add sell-through rate (exhibition specific)
    const exhibitionSellThroughRate = summary.totalQuantityAllocated > 0
      ? (summary.totalQuantitySoldAtExhibition / summary.totalQuantityAllocated) * 100
      : 0

    return NextResponse.json({
      success: true,
      exhibition,
      products: enhancedProducts,
      availableProducts,
      summary: {
        ...summary,
        exhibitionSellThroughRate: Math.round(exhibitionSellThroughRate * 100) / 100
      },
      systemInfo: {
        stockSystem: 'shared_stock_v1',
        note: 'Products allocated to exhibitions remain available for customer purchases until sold'
      }
    })

  } catch (error) {
    console.error('🔄 SHARED STOCK: Error fetching exhibition products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}