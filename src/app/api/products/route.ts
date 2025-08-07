// =====================================
// src/app/api/products/route.ts - CUSTOMER PORTAL SHARED STOCK SYSTEM
// 🔄 MODIFIED: Shows products with shared stock across all channels
// 📊 ENHANCED: Real-time stock calculation from all sales channels
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withRateLimiting, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

// Mark as dynamic since we use request.url for query params
export const dynamic = 'force-dynamic'

// =====================================
// 🔄 NEW: SHARED STOCK CALCULATION HELPERS
// =====================================

// =====================================
// 🔄 TYPE DEFINITIONS FOR SHARED STOCK
// =====================================

interface ProductSizeForStock {
  id: string
  size: string
  sku: string
  stockQuantity: number
  sortOrder: number
}

interface OrderItemForStock {
  quantity: number
}

interface ExhibitionSaleItemForStock {
  quantity: number
}

/**
 * Calculate actual available stock considering all sales channels
 * This replaces the simple stockQuantity > 0 check
 */
async function calculateSharedAvailableStock(productId: string, requiresSizes: boolean, productSizes?: ProductSizeForStock[]): Promise<number> {
  if (requiresSizes && productSizes) {
    // For sized products, calculate total available across all sizes
    let totalAvailable = 0

    for (const size of productSizes) {
      const sizeAvailable = await calculateSizeSharedStock(productId, size.id, size.stockQuantity)
      totalAvailable += sizeAvailable
    }

    return totalAvailable
  } else {
    // For regular products, calculate based on main stock
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true }
    })

    if (!product) return 0

    // Calculate total sold across all channels
    const totalSold = await calculateTotalSoldAllChannels(productId)
    return Math.max(0, product.stockQuantity - totalSold)
  }
}

/**
 * Calculate available stock for a specific size
 */
async function calculateSizeSharedStock(productId: string, sizeId: string, originalSizeStock: number): Promise<number> {
  const totalSold = await calculateTotalSoldAllChannels(productId, sizeId)
  return Math.max(0, originalSizeStock - totalSold)
}

/**
 * Calculate total sold across all channels (customer orders + exhibition sales)
 */
async function calculateTotalSoldAllChannels(productId: string, sizeId?: string): Promise<number> {
  // Get customer orders (online sales)
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

  const soldToCustomers = customerOrderItems.reduce((sum: number, item: OrderItemForStock) => sum + item.quantity, 0)

  // Get exhibition sales (POS sales)
  const exhibitionSaleItems = await db.exhibitionSaleItem.findMany({
    where: {
      productId,
      ...(sizeId && { productSizeId: sizeId })
    },
    select: { quantity: true }
  })

  const soldAtExhibitions = exhibitionSaleItems.reduce((sum: number, item: ExhibitionSaleItemForStock) => sum + item.quantity, 0)

  return soldToCustomers + soldAtExhibitions
}

// =====================================
// 🔄 ENHANCED CUSTOMER PRODUCTS API
// =====================================

export const GET = withRateLimiting(RATE_LIMIT_CONFIGS.public.products)(
  async (request: NextRequest) => {
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
      const status = searchParams.get('status') || 'PUBLISHED'

      // Validate parameters
      const validatedPage = Math.max(1, page)
      const validatedLimit = Math.min(Math.max(1, limit), 50)
      const skip = (validatedPage - 1) * validatedLimit

      // 🔄 MODIFIED: Base where clause without stock filter
      // We'll filter by stock availability after calculating shared stock
      const whereConditions: any = {
        status: status,
        isActive: true
        // 🔄 REMOVED: stockQuantity: { gt: 0 } - now calculated dynamically
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
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: search.split(' ') } }
        ]
      }

      if (featured) {
        whereConditions.isFeatured = true
      }

      // Build sort order
      let orderBy: any = { createdAt: 'desc' } // Default

      switch (sort) {
        case 'price_low':
          orderBy = { sellingPriceUSD: 'asc' }
          break
        case 'price_high':
          orderBy = { sellingPriceUSD: 'desc' }
          break
        case 'name':
          orderBy = { name: 'asc' }
          break
        case 'newest':
          orderBy = { createdAt: 'desc' }
          break
        case 'featured':
          orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
          break
      }

      // 🔄 ENHANCED: Get all products first, then filter by shared stock availability
      const allProducts = await db.product.findMany({
        where: whereConditions,
        include: {
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
          },
          productSizes: {
            where: { isActive: true },
            select: {
              id: true,
              size: true,
              sku: true,
              stockQuantity: true,
              sortOrder: true
            },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy
      })

      console.log(`🔄 SHARED STOCK: Found ${allProducts.length} products before stock filtering`)

      // 🔄 NEW: Calculate shared stock availability for each product
      const productsWithSharedStock = await Promise.all(
        allProducts.map(async (product) => {
          const sharedAvailableStock = await calculateSharedAvailableStock(
            product.id,
            product.requiresSizes,
            product.productSizes
          )

          // 🔄 ENHANCED: Add shared stock information to product
          return {
            ...product,
            // Keep original stockQuantity for reference
            originalStockQuantity: product.stockQuantity,
            // 🔄 NEW: Override stockQuantity with shared available stock
            stockQuantity: sharedAvailableStock,
            // 🔄 NEW: Add shared stock analytics
            sharedStockInfo: {
              totalInventory: product.requiresSizes
                ? product.productSizes.reduce((sum: number, size: ProductSizeForStock) => sum + size.stockQuantity, 0)
                : product.stockQuantity,
              availableForCustomers: sharedAvailableStock,
              isSharedStock: true,
              lastCalculated: new Date().toISOString()
            }
          }
        })
      )

      // 🔄 NEW: Filter products that have available shared stock
      const availableProducts = productsWithSharedStock.filter(product => {
        const hasStock = product.stockQuantity > 0
        console.log(`🔄 Product ${product.name}: Original=${product.originalStockQuantity}, Shared=${product.stockQuantity}, Available=${hasStock}`)
        return hasStock
      })

      console.log(`🔄 SHARED STOCK: ${availableProducts.length} products available after shared stock filtering`)

      // 🔄 ENHANCED: Calculate total count with shared stock consideration
      const totalAvailableCount = availableProducts.length

      // Apply pagination to filtered results
      const paginatedProducts = availableProducts.slice(skip, skip + validatedLimit)

      // 🔄 ENHANCED: Add shared stock summary to response
      const sharedStockSummary = {
        totalProductsInCatalog: allProducts.length,
        totalAvailableProducts: totalAvailableCount,
        totalOutOfStock: allProducts.length - totalAvailableCount,
        sharedStockEnabled: true,
        calculatedAt: new Date().toISOString()
      }

      // Return enhanced response
      return NextResponse.json({
        success: true,
        products: paginatedProducts,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: totalAvailableCount,
          totalPages: Math.ceil(totalAvailableCount / validatedLimit),
          hasNext: validatedPage * validatedLimit < totalAvailableCount,
          hasPrev: validatedPage > 1
        },
        // 🔄 NEW: Shared stock analytics
        sharedStockSummary,
        systemInfo: {
          stockSystem: 'shared_stock_v1',
          note: 'Stock availability calculated across all sales channels in real-time'
        }
      })

    } catch (error) {
      console.error('🔄 SHARED STOCK: Error fetching customer products:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch products',
          products: [],
          pagination: {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        },
        { status: 500 }
      )
    }
  }
)

// =====================================
// 🔄 NEW: SHARED STOCK VALIDATION ENDPOINT
// =====================================

/**
 * POST endpoint for real-time stock validation during checkout
 * This ensures stock availability before order creation
 */
export const POST = withRateLimiting({ interval: 60000, maxRequests: 50 })(
  async (request: NextRequest) => {
    try {
      const { items } = await request.json()

      if (!items || !Array.isArray(items)) {
        return NextResponse.json(
          { error: 'Items array is required' },
          { status: 400 }
        )
      }

      console.log('🔄 SHARED STOCK: Validating stock for items:', items)

      const validationResults = await Promise.all(
        items.map(async (item: any) => {
          const { productId, productSizeId, quantity } = item

          // Get product info
          const product = await db.product.findUnique({
            where: { id: productId },
            select: {
              id: true,
              name: true,
              requiresSizes: true,
              stockQuantity: true,
              productSizes: {
                where: { id: productSizeId || undefined },
                select: { stockQuantity: true, size: true }
              }
            }
          })

          if (!product) {
            return {
              productId,
              available: false,
              message: 'Product not found',
              availableQuantity: 0
            }
          }

          // Calculate shared available stock
          let availableQuantity: number

          if (product.requiresSizes && productSizeId) {
            const size = product.productSizes[0]
            if (!size) {
              return {
                productId,
                productSizeId,
                available: false,
                message: 'Size not found',
                availableQuantity: 0
              }
            }

            availableQuantity = await calculateSizeSharedStock(productId, productSizeId, size.stockQuantity)
          } else {
            const totalSold = await calculateTotalSoldAllChannels(productId)
            availableQuantity = Math.max(0, product.stockQuantity - totalSold)
          }

          const isAvailable = availableQuantity >= quantity

          return {
            productId,
            productSizeId,
            available: isAvailable,
            requestedQuantity: quantity,
            availableQuantity,
            message: isAvailable
              ? `${availableQuantity} available`
              : availableQuantity === 0
                ? 'Out of stock'
                : `Only ${availableQuantity} available`,
            productName: product.name
          }
        })
      )

      const allAvailable = validationResults.every(result => result.available)

      return NextResponse.json({
        success: true,
        allAvailable,
        items: validationResults,
        systemInfo: {
          stockSystem: 'shared_stock_v1',
          validatedAt: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('🔄 SHARED STOCK: Stock validation error:', error)
      return NextResponse.json(
        { error: 'Failed to validate stock' },
        { status: 500 }
      )
    }
  }
)