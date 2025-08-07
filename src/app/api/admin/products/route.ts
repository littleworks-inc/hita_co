// src/app/api/admin/products/route.ts
// ✅ FIXED: Added missing POST handler for product creation while preserving stock validation

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProductStatus } from '@prisma/client'
import { withRateLimiting, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
// Removed external import - using inline functions instead

// =====================================
// SHARED STOCK HELPERS (INLINE)
// =====================================

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

  const soldToCustomers = customerOrderItems.reduce((sum, item) => sum + item.quantity, 0)

  // Get exhibition sales (POS sales)  
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

/**
 * Calculate available stock for a specific size
 */
async function calculateSizeSharedStock(productId: string, sizeId: string, originalSizeStock: number): Promise<number> {
  const totalSold = await calculateTotalSoldAllChannels(productId, sizeId)
  return Math.max(0, originalSizeStock - totalSold)
}

/**
 * Calculate actual available stock considering all sales channels
 */
async function calculateSharedAvailableStock(productId: string, requiresSizes: boolean, productSizes?: any[]): Promise<number> {
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
 * Check shared stock availability for an item
 */
async function checkSharedStockForItem(
  productId: string,
  requestedQuantity: number,
  sizeId?: string
): Promise<{
  isAvailable: boolean
  availableQuantity: number
  originalStock: number
  totalSold: number
  message: string
}> {

  if (sizeId) {
    // Check specific size
    const productSize = await db.productSize.findUnique({
      where: { id: sizeId },
      select: { stockQuantity: true, size: true }
    })

    if (!productSize) {
      return {
        isAvailable: false,
        availableQuantity: 0,
        originalStock: 0,
        totalSold: 0,
        message: 'Size not found'
      }
    }

    const totalSold = await calculateTotalSoldAllChannels(productId, sizeId)
    const availableQuantity = Math.max(0, productSize.stockQuantity - totalSold)

    return {
      isAvailable: availableQuantity >= requestedQuantity,
      availableQuantity,
      originalStock: productSize.stockQuantity,
      totalSold,
      message: availableQuantity >= requestedQuantity
        ? `${availableQuantity} available`
        : availableQuantity === 0
          ? 'Out of stock'
          : `Only ${availableQuantity} available`
    }
  } else {
    // Check main product stock
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true, name: true }
    })

    if (!product) {
      return {
        isAvailable: false,
        availableQuantity: 0,
        originalStock: 0,
        totalSold: 0,
        message: 'Product not found'
      }
    }

    const totalSold = await calculateTotalSoldAllChannels(productId)
    const availableQuantity = Math.max(0, product.stockQuantity - totalSold)

    return {
      isAvailable: availableQuantity >= requestedQuantity,
      availableQuantity,
      originalStock: product.stockQuantity,
      totalSold,
      message: availableQuantity >= requestedQuantity
        ? `${availableQuantity} available`
        : availableQuantity === 0
          ? 'Out of stock'
          : `Only ${availableQuantity} available`
    }
  }
}

// =====================================
// INTERFACES & TYPES
// =====================================

interface ProductCreateRequest {
  sku: string
  name: string
  description?: string
  shortDescription?: string
  categoryId: string
  countryId: string
  supplierId: string
  barcode?: string
  barcodeType?: string
  originalPrice: number
  originalCurrency: string
  quantity: number
  gstPercentage: number
  shippingCost: number
  conversionCharges: number
  additionalExpenses: number
  costPriceUSD: number
  piecePriceUSD: number
  profitMargin: number
  discountPercentage: number
  showDiscountToCustomers?: boolean
  sellingPriceUSD: number
  stockQuantity: number
  lowStockAlert: number
  tags: string[]
  images: string[]
  seoTitle?: string
  seoDescription?: string
  purchaseDate?: string
  invoiceNumber?: string
  isActive?: boolean
  isFeatured?: boolean
  status?: ProductStatus
  publishedAt?: string
  requiresSizes: boolean
  productSizes?: Array<{
    size: string
    sku: string
    stockQuantity: number
    lowStockAlert: number
    isActive: boolean
    sortOrder: number
  }>
}

interface StockValidationRequest {
  items: Array<{
    productId: string
    productSizeId?: string
    quantity: number
  }>
}

// =====================================
// GET HANDLER - EXISTING FUNCTIONALITY
// =====================================

export const GET = withRateLimiting(RATE_LIMIT_CONFIGS.admin.read)(
  async (request: NextRequest) => {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search') || ''
      const categoryId = searchParams.get('categoryId')
      const countryId = searchParams.get('countryId')
      const featured = searchParams.get('featured') === 'true'
      const status = searchParams.get('status') as ProductStatus
      const isActive = searchParams.get('isActive')
      const validatedPage = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const validatedLimit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12')))
      const validatedSkip = (validatedPage - 1) * validatedLimit

      // Build where conditions
      const whereConditions: any = {}

      if (search) {
        whereConditions.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (categoryId) whereConditions.categoryId = categoryId
      if (countryId) whereConditions.countryId = countryId
      if (featured) whereConditions.isFeatured = true
      if (status) whereConditions.status = status
      if (isActive !== null && isActive !== undefined) {
        whereConditions.isActive = isActive === 'true'
      }

      const orderBy = { createdAt: 'desc' as const }

      // Get total count and products
      const [totalAvailableCount, allProducts] = await Promise.all([
        db.product.count({ where: whereConditions }),
        db.product.findMany({
          where: whereConditions,
          skip: validatedSkip,
          take: validatedLimit,
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
      ])

      // Calculate shared stock availability for each product
      const productsWithSharedStock = await Promise.all(
        allProducts.map(async (product) => {
          const sharedAvailableStock = await calculateSharedAvailableStock(
            product.id,
            product.requiresSizes,
            product.productSizes
          )

          return {
            ...product,
            originalStockQuantity: product.stockQuantity,
            stockQuantity: sharedAvailableStock,
            sharedStockInfo: {
              totalInventory: product.requiresSizes
                ? product.productSizes.reduce((sum, size) => sum + size.stockQuantity, 0)
                : product.stockQuantity,
              availableStock: sharedAvailableStock,
              pendingOrders: product.stockQuantity - sharedAvailableStock
            }
          }
        })
      )

      // Calculate shared stock summary
      const sharedStockSummary = {
        totalProducts: allProducts.length,
        inStock: productsWithSharedStock.filter(p => p.stockQuantity > 0).length,
        lowStock: productsWithSharedStock.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert).length,
        outOfStock: productsWithSharedStock.filter(p => p.stockQuantity === 0).length
      }

      return NextResponse.json({
        success: true,
        products: productsWithSharedStock,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: totalAvailableCount,
          totalPages: Math.ceil(totalAvailableCount / validatedLimit),
          hasNext: validatedPage * validatedLimit < totalAvailableCount,
          hasPrev: validatedPage > 1
        },
        sharedStockSummary,
        systemInfo: {
          stockSystem: 'shared_stock_v1',
          note: 'Stock availability calculated across all sales channels in real-time'
        }
      })

    } catch (error) {
      console.error('🔄 SHARED STOCK: Error fetching products:', error)
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
// POST HANDLER - DUAL FUNCTIONALITY
// =====================================

export const POST = withRateLimiting(RATE_LIMIT_CONFIGS.admin.write)(
  async (request: NextRequest) => {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()

      // ✅ INTELLIGENT REQUEST DETECTION
      // Check if this is a stock validation request or product creation request
      if (body.items && Array.isArray(body.items)) {
        // This is a STOCK VALIDATION REQUEST
        return handleStockValidation(body as StockValidationRequest)
      } else if (body.name && body.sku) {
        // This is a PRODUCT CREATION REQUEST
        return handleProductCreation(body as ProductCreateRequest)
      } else {
        return NextResponse.json(
          { error: 'Invalid request format. Expected either product creation data or stock validation items.' },
          { status: 400 }
        )
      }

    } catch (error) {
      console.error('Error in POST handler:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

// =====================================
// STOCK VALIDATION HANDLER (EXISTING)
// =====================================

async function handleStockValidation(body: StockValidationRequest) {
  const { items } = body

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

      // Get product with stock information
      const stockResult = await checkSharedStockForItem(productId, quantity, productSizeId)

      return {
        productId,
        productSizeId: productSizeId || null,
        requestedQuantity: quantity,
        availableQuantity: stockResult.availableQuantity,
        isAvailable: stockResult.isAvailable,
        maxAllowedQuantity: stockResult.availableQuantity,
        message: stockResult.isAvailable
          ? `${stockResult.availableQuantity} available`
          : 'Out of stock'
      }
    })
  )

  const allItemsValid = validationResults.every(result => result.isAvailable)

  return NextResponse.json({
    success: true,
    isValid: allItemsValid,
    items: validationResults,
    systemInfo: {
      stockSystem: 'shared_stock_v1',
      validatedAt: new Date().toISOString()
    }
  })
}

// =====================================
// PRODUCT CREATION HANDLER (NEW)
// =====================================

async function handleProductCreation(productData: ProductCreateRequest) {
  console.log('🎯 Creating new product:', productData.name)

  // Validate required fields
  if (!productData.name || !productData.sku) {
    return NextResponse.json({
      error: 'Name and SKU are required'
    }, { status: 400 })
  }

  // Check for duplicate SKU
  const duplicateSku = await db.product.findFirst({
    where: { sku: productData.sku }
  })

  if (duplicateSku) {
    return NextResponse.json({
      error: 'SKU already exists'
    }, { status: 409 })
  }

  // Check for duplicate barcode if provided
  if (productData.barcode) {
    const duplicateBarcode = await db.product.findFirst({
      where: { barcode: productData.barcode }
    })

    if (duplicateBarcode) {
      return NextResponse.json({
        error: 'Barcode already exists'
      }, { status: 409 })
    }
  }

  // Prepare product data for database
  const dbProductData = {
    sku: productData.sku,
    name: productData.name,
    description: productData.description || '',
    shortDescription: productData.shortDescription || '',
    categoryId: productData.categoryId,
    countryId: productData.countryId,
    supplierId: productData.supplierId,
    barcode: productData.barcode || null,
    barcodeType: productData.barcodeType || 'CODE128',
    originalPrice: Number(productData.originalPrice),
    originalCurrency: productData.originalCurrency,
    quantity: Number(productData.quantity),
    gstPercentage: Number(productData.gstPercentage),
    shippingCost: Number(productData.shippingCost),
    conversionCharges: Number(productData.conversionCharges),
    additionalExpenses: Number(productData.additionalExpenses),
    costPriceUSD: Number(productData.costPriceUSD),
    piecePriceUSD: Number(productData.piecePriceUSD),
    profitMargin: Number(productData.profitMargin),
    discountPercentage: Number(productData.discountPercentage),
    showDiscountToCustomers: productData.showDiscountToCustomers ?? true,
    sellingPriceUSD: Number(productData.sellingPriceUSD),
    stockQuantity: Number(productData.stockQuantity),
    lowStockAlert: Number(productData.lowStockAlert),
    tags: productData.tags || [],
    images: productData.images || [],
    seoTitle: productData.seoTitle || '',
    seoDescription: productData.seoDescription || '',
    purchaseDate: productData.purchaseDate ? new Date(productData.purchaseDate) : null,
    invoiceNumber: productData.invoiceNumber || '',
    isActive: productData.isActive ?? true,
    isFeatured: productData.isFeatured ?? false,
    status: productData.status || ProductStatus.DRAFT,
    publishedAt: productData.status === ProductStatus.PUBLISHED ? new Date() : null,
    requiresSizes: productData.requiresSizes || false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  try {
    // Create product with potential sizes in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the main product
      const createdProduct = await tx.product.create({
        data: dbProductData,
        include: {
          category: true,
          country: true,
          supplier: true
        }
      })

      // Create product sizes if provided
      if (productData.requiresSizes && productData.productSizes && productData.productSizes.length > 0) {
        const sizesData = productData.productSizes.map((size, index) => ({
          productId: createdProduct.id,
          size: size.size,
          sku: size.sku,
          stockQuantity: Number(size.stockQuantity),
          lowStockAlert: Number(size.lowStockAlert),
          isActive: size.isActive ?? true,
          sortOrder: size.sortOrder ?? index
        }))

        await tx.productSize.createMany({
          data: sizesData
        })

        // Fetch the product with sizes for response
        const productWithSizes = await tx.product.findUnique({
          where: { id: createdProduct.id },
          include: {
            category: true,
            country: true,
            supplier: true,
            productSizes: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        })

        return productWithSizes
      }

      return createdProduct
    })

    console.log('✅ Product created successfully:', result.id)

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: result
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}