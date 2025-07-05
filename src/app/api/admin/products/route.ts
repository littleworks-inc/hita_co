// =====================================
// src/app/api/admin/products/route.ts - UPDATED with Stock Sync
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { autoSyncAfterSizeChange } from '@/lib/stock-sync'

// =====================================
// TYPE DEFINITIONS - TYPESCRIPT FIX
// =====================================

interface ProductSizeInput {
  id?: string
  size: string
  sku: string
  stockQuantity: number | string
  lowStockAlert: number | string
  isActive?: boolean
  sortOrder?: number
}

// GET /api/admin/products - Fetch products
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured') === 'true'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (status) {
      where.status = status
    }

    if (featured) {
      where.isFeatured = true
    }

    // Get total count
    const totalCount = await db.product.count({ where })

    // Get products with stock calculations
    const products = await db.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        country: { select: { name: true, currency: true } },
        supplier: { select: { name: true } },
        productSizes: {
          select: {
            stockQuantity: true,
            lowStockAlert: true,
            isActive: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Enrich products with calculated stock data
    const enrichedProducts = products.map(product => ({
      ...product,
      totalStock: product.requiresSizes 
        ? product.productSizes.reduce((total, size) => total + size.stockQuantity, 0)
        : product.stockQuantity,
      availableSizes: product.requiresSizes 
        ? product.productSizes?.filter(size => size.isActive).length || 0 
        : null,
      lowStockSizes: product.requiresSizes 
        ? product.productSizes?.filter(size => size.stockQuantity <= size.lowStockAlert).length || 0 
        : null
    }))

    return NextResponse.json({
      products: enrichedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Create new product with automatic stock sync
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Extract all fields from request
    const {
      sku,
      name,
      description,
      shortDescription,
      categoryId,
      countryId,
      supplierId,
      barcode,
      barcodeType,
      originalPrice,
      originalCurrency,
      quantity,
      gstPercentage,
      shippingCost,
      conversionCharges,
      additionalExpenses,
      costPriceUSD,
      piecePriceUSD,
      profitMargin,
      discountPercentage,
      showDiscountToCustomers,
      sellingPriceUSD,
      stockQuantity,
      lowStockAlert,
      tags,
      images,
      seoTitle,
      seoDescription,
      purchaseDate,
      invoiceNumber,
      isActive,
      isFeatured,
      status,
      publishedAt,
      requiresSizes,
      productSizes
    } = data

    // Basic validation
    if (!sku || !name || !categoryId || !countryId || !supplierId) {
      return NextResponse.json({
        error: 'Missing required fields: sku, name, category, country, supplier'
      }, { status: 400 })
    }

    // Check for duplicate SKU
    const existingProduct = await db.product.findUnique({
      where: { sku }
    })

    if (existingProduct) {
      return NextResponse.json({
        error: 'A product with this SKU already exists'
      }, { status: 400 })
    }

    // Validation for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = []
      
      if (!description || description.trim().length < 10) {
        validationErrors.push('Description must be at least 10 characters long')
      }
      
      if (!images || images.length === 0) {
        validationErrors.push('At least one image is required')
      }
      
      if (!sellingPriceUSD || parseFloat(sellingPriceUSD) <= 0) {
        validationErrors.push('Valid selling price is required')
      }

      if (requiresSizes) {
        if (!productSizes || productSizes.length === 0) {
          validationErrors.push('Size variants are required for this product type')
        }
      } else {
        if (!stockQuantity || parseInt(stockQuantity) < 0) {
          validationErrors.push('Stock quantity cannot be negative')
        }
      }

      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Cannot publish product with validation errors',
          validationErrors
        }, { status: 400 })
      }
    }

    // Prepare product data (excluding stock for sized products)
    const productData = {
      sku,
      name,
      description: description || '',
      shortDescription: shortDescription || '',
      categoryId,
      countryId,
      supplierId,
      barcode: barcode || '',
      barcodeType: barcodeType || 'CODE128',
      originalPrice: parseFloat(originalPrice) || 0,
      originalCurrency: originalCurrency || 'INR',
      quantity: parseInt(quantity) || 1,
      gstPercentage: parseFloat(gstPercentage) || 0,
      shippingCost: parseFloat(shippingCost) || 0,
      conversionCharges: parseFloat(conversionCharges) || 0,
      additionalExpenses: parseFloat(additionalExpenses) || 0,
      costPriceUSD: parseFloat(costPriceUSD) || 0,
      piecePriceUSD: parseFloat(piecePriceUSD) || 0,
      profitMargin: parseFloat(profitMargin) || 0,
      discountPercentage: parseFloat(discountPercentage) || 0,
      showDiscountToCustomers: Boolean(showDiscountToCustomers),
      sellingPriceUSD: parseFloat(sellingPriceUSD) || 0,
      lowStockAlert: parseInt(lowStockAlert) || 5,
      tags: tags || [],
      images: images || [],
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      invoiceNumber: invoiceNumber || '',
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      status: status || 'DRAFT',
      publishedAt: status === 'PUBLISHED' && !publishedAt ? new Date() : (publishedAt ? new Date(publishedAt) : null),
      requiresSizes: Boolean(requiresSizes),
      // ✅ KEY CHANGE: Initial stock based on product type
      stockQuantity: 0 // Will be calculated for sized products, set manually for non-sized
    }

    // ✅ Create product with sizes and automatic stock sync
    const result = await db.$transaction(async (prisma) => {
      // Create the main product
      const product = await prisma.product.create({
        data: productData,
        include: {
          category: { select: { name: true } },
          country: { select: { name: true, currency: true } },
          supplier: { select: { name: true } }
        }
      })

      // Handle different product types
      if (requiresSizes) {
        // Create sizes if provided
        if (productSizes?.length > 0) {
          // ✅ TYPESCRIPT FIX: Properly typed size parameter
          const sizesData = (productSizes as ProductSizeInput[]).map((size: ProductSizeInput, index: number) => ({
            productId: product.id,
            size: size.size,
            sku: size.sku,
            stockQuantity: parseInt(String(size.stockQuantity)) || 0,
            lowStockAlert: parseInt(String(size.lowStockAlert)) || 5,
            isActive: size.isActive ?? true,
            sortOrder: size.sortOrder ?? index
          }))

          await prisma.productSize.createMany({
            data: sizesData
          })

          // ✅ KEY FEATURE: Calculate and set main product stock
          const totalSizeStock = sizesData
            .filter(size => size.isActive)
            .reduce((total, size) => total + size.stockQuantity, 0)

          await prisma.product.update({
            where: { id: product.id },
            data: { stockQuantity: totalSizeStock }
          })
        }
      } else {
        // For non-sized products, use provided stock quantity
        await prisma.product.update({
          where: { id: product.id },
          data: { stockQuantity: parseInt(stockQuantity) || 0 }
        })
      }

      return product
    })

    // ✅ BACKUP SYNC: Ensure stock is properly synced (failsafe)
    if (requiresSizes) {
      await autoSyncAfterSizeChange(result.id)
    }

    console.log(`Product ${result.name} created successfully with stock sync`)

    return NextResponse.json({
      message: 'Product created successfully',
      product: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}