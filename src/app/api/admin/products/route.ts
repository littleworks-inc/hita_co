// =====================================
// src/app/api/admin/products/route.ts - COMPLETE with ALL functions
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

    // ✅ FIXED: Check for duplicate barcode only if barcode is provided
    if (barcode && barcode.trim()) {
      const existingBarcode = await db.product.findUnique({
        where: { barcode: barcode.trim() }
      })

      if (existingBarcode) {
        return NextResponse.json({
          error: 'A product with this barcode already exists'
        }, { status: 400 })
      }
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

    // ✅ FIXED: Handle barcode properly - use null instead of empty string
    let finalBarcode = null
    if (barcode && barcode.trim()) {
      finalBarcode = barcode.trim()
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
      barcode: finalBarcode, // ✅ FIXED: null instead of empty string
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
    
    // ✅ IMPROVED: Better error handling for unique constraints
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('sku')) {
        return NextResponse.json({
          error: 'A product with this SKU already exists'
        }, { status: 400 })
      }
      if (error.message.includes('barcode')) {
        return NextResponse.json({
          error: 'A product with this barcode already exists'
        }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to create product. Please try again.' },
      { status: 500 }
    )
  }
}

// ✅ MISSING FUNCTION 1: PUT - Update existing product
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const data = await request.json()

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: { productSizes: true }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Extract fields (same as POST)
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

    // Check for duplicate SKU (excluding current product)
    if (sku && sku !== existingProduct.sku) {
      const duplicateSku = await db.product.findUnique({
        where: { sku }
      })

      if (duplicateSku) {
        return NextResponse.json({
          error: 'A product with this SKU already exists'
        }, { status: 400 })
      }
    }

    // Check for duplicate barcode (excluding current product)
    if (barcode && barcode.trim() && barcode !== existingProduct.barcode) {
      const duplicateBarcode = await db.product.findUnique({
        where: { barcode: barcode.trim() }
      })

      if (duplicateBarcode) {
        return NextResponse.json({
          error: 'A product with this barcode already exists'
        }, { status: 400 })
      }
    }

    // Handle barcode
    let finalBarcode = null
    if (barcode && barcode.trim()) {
      finalBarcode = barcode.trim()
    }

    // Prepare update data
    const updateData = {
      sku: sku || existingProduct.sku,
      name: name || existingProduct.name,
      description: description ?? existingProduct.description,
      shortDescription: shortDescription ?? existingProduct.shortDescription,
      categoryId: categoryId || existingProduct.categoryId,
      countryId: countryId || existingProduct.countryId,
      supplierId: supplierId || existingProduct.supplierId,
      barcode: finalBarcode,
      barcodeType: barcodeType || existingProduct.barcodeType,
      originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) : existingProduct.originalPrice,
      originalCurrency: originalCurrency || existingProduct.originalCurrency,
      quantity: quantity !== undefined ? parseInt(quantity) : existingProduct.quantity,
      gstPercentage: gstPercentage !== undefined ? parseFloat(gstPercentage) : existingProduct.gstPercentage,
      shippingCost: shippingCost !== undefined ? parseFloat(shippingCost) : existingProduct.shippingCost,
      conversionCharges: conversionCharges !== undefined ? parseFloat(conversionCharges) : existingProduct.conversionCharges,
      additionalExpenses: additionalExpenses !== undefined ? parseFloat(additionalExpenses) : existingProduct.additionalExpenses,
      costPriceUSD: costPriceUSD !== undefined ? parseFloat(costPriceUSD) : existingProduct.costPriceUSD,
      piecePriceUSD: piecePriceUSD !== undefined ? parseFloat(piecePriceUSD) : existingProduct.piecePriceUSD,
      profitMargin: profitMargin !== undefined ? parseFloat(profitMargin) : existingProduct.profitMargin,
      discountPercentage: discountPercentage !== undefined ? parseFloat(discountPercentage) : existingProduct.discountPercentage,
      showDiscountToCustomers: showDiscountToCustomers !== undefined ? Boolean(showDiscountToCustomers) : existingProduct.showDiscountToCustomers,
      sellingPriceUSD: sellingPriceUSD !== undefined ? parseFloat(sellingPriceUSD) : existingProduct.sellingPriceUSD,
      lowStockAlert: lowStockAlert !== undefined ? parseInt(lowStockAlert) : existingProduct.lowStockAlert,
      tags: tags ?? existingProduct.tags,
      images: images ?? existingProduct.images,
      seoTitle: seoTitle ?? existingProduct.seoTitle,
      seoDescription: seoDescription ?? existingProduct.seoDescription,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : existingProduct.purchaseDate,
      invoiceNumber: invoiceNumber ?? existingProduct.invoiceNumber,
      isActive: isActive !== undefined ? Boolean(isActive) : existingProduct.isActive,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existingProduct.isFeatured,
      status: status || existingProduct.status,
      publishedAt: status === 'PUBLISHED' && !existingProduct.publishedAt ? new Date() : existingProduct.publishedAt,
      requiresSizes: requiresSizes !== undefined ? Boolean(requiresSizes) : existingProduct.requiresSizes,
      updatedAt: new Date()
    }

    // Update product in transaction
    const result = await db.$transaction(async (prisma) => {
      // Update main product
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: { select: { name: true } },
          country: { select: { name: true, currency: true } },
          supplier: { select: { name: true } },
          productSizes: true
        }
      })

      // Handle size updates if provided
      if (requiresSizes && productSizes) {
        // Delete existing sizes
        await prisma.productSize.deleteMany({
          where: { productId }
        })

        // Create new sizes
        if (productSizes.length > 0) {
          const sizesData = (productSizes as ProductSizeInput[]).map((size: ProductSizeInput, index: number) => ({
            productId,
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

          // Update main product stock
          const totalSizeStock = sizesData
            .filter(size => size.isActive)
            .reduce((total, size) => total + size.stockQuantity, 0)

          await prisma.product.update({
            where: { id: productId },
            data: { stockQuantity: totalSizeStock }
          })
        }
      } else if (!requiresSizes && stockQuantity !== undefined) {
        // Update stock for non-sized products
        await prisma.product.update({
          where: { id: productId },
          data: { stockQuantity: parseInt(stockQuantity) || 0 }
        })
      }

      return updatedProduct
    })

    // Sync stock if needed
    if (result.requiresSizes) {
      await autoSyncAfterSizeChange(result.id)
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product: result
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('sku')) {
        return NextResponse.json({
          error: 'A product with this SKU already exists'
        }, { status: 400 })
      }
      if (error.message.includes('barcode')) {
        return NextResponse.json({
          error: 'A product with this barcode already exists'
        }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// ✅ MISSING FUNCTION 2: DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: {
        exhibitionItems: true,
        orderItems: true,
        productSizes: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is being used
    if (existingProduct.exhibitionItems.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product that is used in exhibitions'
      }, { status: 400 })
    }

    if (existingProduct.orderItems.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product that has been ordered'
      }, { status: 400 })
    }

    // Delete product and related data
    await db.$transaction(async (prisma) => {
      // Delete product sizes first
      await prisma.productSize.deleteMany({
        where: { productId }
      })

      // Delete the product
      await prisma.product.delete({
        where: { id: productId }
      })
    })

    return NextResponse.json({
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}