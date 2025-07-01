// =====================================
// ENHANCED: src/app/api/admin/products/route.ts
// Products API with Complete Size System Support
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/products - Fetch products with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      whereClause.categoryId = category
    }

    if (status) {
      whereClause.status = status
    }

    // Validate sortBy field
    const allowedSortFields = ['name', 'sku', 'sellingPriceUSD', 'stockQuantity', 'createdAt', 'updatedAt', 'status']
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: `Invalid sortBy field. Allowed: ${allowedSortFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Handle lowStockAlert sorting (special case)
    if (sortBy === 'lowStockAlert') {
      if (!allowedSortFields.includes('lowStockAlert')) {
        allowedSortFields.push('lowStockAlert')
      }
    }

    // Count total products
    const totalCount = await db.product.count({ where: whereClause })

    // Fetch products with relationships INCLUDING SIZE DATA
    const products = await db.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            defaultRequiresSizes: true,
            defaultSizeType: true
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
            name: true
          }
        },
        // ✅ NEW: Include size data
        productSizes: {
          select: {
            id: true,
            size: true,
            sku: true,
            stockQuantity: true,
            lowStockAlert: true,
            isActive: true,
            sortOrder: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: [
        // Sort by status (Published first, then Draft, then Archived)
        { status: 'asc' },
        // Then by the requested sort field
        { [sortBy]: sortOrder },
        // Finally by creation date as tiebreaker
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    // ✅ NEW: Calculate total stock for sized products
    const enrichedProducts = products.map(product => ({
      ...product,
      totalStock: product.requiresSizes && product.productSizes?.length 
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

// POST /api/admin/products - Create new product with size support
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Extract all fields including new size fields
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
      // ✅ NEW: Size system fields
      requiresSizes,
      sizeType,
      productSizes
    } = data

    // Basic validation
    if (!sku || !name || !categoryId || !countryId || !supplierId) {
      return NextResponse.json({
        error: 'Missing required fields: sku, name, categoryId, countryId, supplierId'
      }, { status: 400 })
    }

    // ✅ NEW: Size-specific validation
    if (requiresSizes) {
      if (!productSizes || !Array.isArray(productSizes) || productSizes.length === 0) {
        return NextResponse.json({
          error: 'At least one size is required for sized products'
        }, { status: 400 })
      }

      // Validate size data
      for (const size of productSizes) {
        if (!size.size || !size.sku) {
          return NextResponse.json({
            error: 'Each size must have a size name and SKU'
          }, { status: 400 })
        }
      }

      // Check for duplicate size SKUs
      const sizeSKUs = productSizes.map(s => s.sku)
      const duplicateSKUs = sizeSKUs.filter((sku, index) => sizeSKUs.indexOf(sku) !== index)
      if (duplicateSKUs.length > 0) {
        return NextResponse.json({
          error: `Duplicate size SKUs found: ${duplicateSKUs.join(', ')}`
        }, { status: 400 })
      }
    }

    // Check for duplicate SKU (main product)
    const existingProduct = await db.product.findUnique({
      where: { sku }
    })

    if (existingProduct) {
      return NextResponse.json({
        error: 'A product with this SKU already exists'
      }, { status: 400 })
    }

    // ✅ NEW: Check for duplicate size SKUs across all products
    if (requiresSizes && productSizes?.length > 0) {
      const sizeSKUs = productSizes.map(s => s.sku)
      const existingSizeSKUs = await db.productSize.findMany({
        where: {
          sku: { in: sizeSKUs }
        },
        select: { sku: true }
      })

      if (existingSizeSKUs.length > 0) {
        return NextResponse.json({
          error: `Size SKUs already exist: ${existingSizeSKUs.map(s => s.sku).join(', ')}`
        }, { status: 400 })
      }
    }

    // Validation for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = []

      if (!name.trim()) validationErrors.push('Product name is required')
      if (!description?.trim()) validationErrors.push('Product description is required')
      if (!categoryId) validationErrors.push('Category must be selected')
      if (!countryId) validationErrors.push('Country must be selected')
      if (!supplierId) validationErrors.push('Supplier must be selected')
      if (!sellingPriceUSD || sellingPriceUSD <= 0) validationErrors.push('Selling price must be greater than 0')
      if (!images || images.length === 0) validationErrors.push('At least one product image is required')

      // ✅ NEW: Size-specific publishing validation
      if (requiresSizes) {
        if (!productSizes || productSizes.length === 0) {
          validationErrors.push('At least one size is required for publishing sized products')
        }
      } else {
        if (stockQuantity < 0) {
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

    // Prepare product data (INCLUDING SIZE FIELDS)
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
      stockQuantity: parseInt(stockQuantity) || 0,
      lowStockAlert: parseInt(lowStockAlert) || 5,
      tags: tags || [],
      images: images || [],
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      invoiceNumber: invoiceNumber || '',
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      status,
      publishedAt: status === 'PUBLISHED' && !publishedAt ? new Date() : (publishedAt ? new Date(publishedAt) : null),
      // ✅ NEW: Size system fields
      requiresSizes: Boolean(requiresSizes),
      // sizeType: sizeType || null
    }

    // ✅ NEW: Create product with sizes in a transaction
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

      // Create sizes if required
      if (requiresSizes && productSizes?.length > 0) {
        const sizesData = productSizes.map((size, index) => ({
          productId: product.id,
          size: size.size,
          sku: size.sku,
          stockQuantity: parseInt(size.stockQuantity) || 0,
          lowStockAlert: parseInt(size.lowStockAlert) || 5,
          isActive: size.isActive ?? true,
          sortOrder: size.sortOrder ?? index
        }))

        await prisma.productSize.createMany({
          data: sizesData
        })

        // Fetch the created sizes to include in response
        const createdSizes = await prisma.productSize.findMany({
          where: { productId: product.id },
          orderBy: { sortOrder: 'asc' }
        })

        return { ...product, productSizes: createdSizes }
      }

      return product
    })

    console.log(`Product ${result.name} created with status ${status} by user ${session?.userId || session?.id || 'unknown'}`)
    if (requiresSizes) {
      console.log(`✅ Created ${productSizes?.length || 0} size variants`)
    }

    return NextResponse.json({
      success: true,
      message: `Product ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully`,
      product: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating product:', error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('sku')) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 400 }
        )
      }
      if (error.message.includes('barcode')) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}