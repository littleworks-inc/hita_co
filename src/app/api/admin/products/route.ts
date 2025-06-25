// =====================================
// src/app/api/admin/products/route.ts - FIXED VERSION
// Fixed session.user.id → session.userId
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/products - Fetch products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status') // DRAFT, PUBLISHED, ARCHIVED
    const lowStock = searchParams.get('lowStock') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const whereClause: any = {}

    // Search functionality
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    // Filter by category
    if (category) {
      whereClause.categoryId = category
    }

    // Filter by status (enhanced for draft system)
    if (status) {
      if (status === 'ACTIVE') {
        // Backward compatibility: show published products
        whereClause.OR = [
          { status: 'PUBLISHED' },
          { AND: [{ status: null }, { isActive: true }] }
        ]
      } else if (status === 'INACTIVE') {
        // Backward compatibility: show archived products
        whereClause.OR = [
          { status: 'ARCHIVED' },
          { AND: [{ status: null }, { isActive: false }] }
        ]
      } else {
        whereClause.status = status
      }
    }

    // Filter by featured products
    if (featured) {
      whereClause.isFeatured = true
    }

    // Low stock filter
    if (lowStock) {
      whereClause.stockQuantity = {
        lte: db.raw('products."lowStockAlert"')
      }
    }

    // Count total products
    const totalCount = await db.product.count({ where: whereClause })

    // Fetch products with relationships
    const products = await db.product.findMany({
      where: whereClause,
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
        supplier: {
          select: {
            id: true,
            name: true
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

    return NextResponse.json({
      products,
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

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Extract and validate required fields (INCLUDING DISCOUNT FIELDS)
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
      showDiscountToCustomers, // 🎯 NEW: Discount visibility control
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
      // Draft system fields
      status = 'DRAFT',
      publishedAt,
      publishedBy
    } = data

    // Validate required fields for creation
    if (!sku || !name) {
      return NextResponse.json(
        { error: 'SKU and name are required' },
        { status: 400 }
      )
    }

    // 🎯 NEW: Validate discount fields
    if (discountPercentage && (discountPercentage < 0 || discountPercentage >= 100)) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 99.99' },
        { status: 400 }
      )
    }

    // Additional validation for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = []
      if (!name?.trim()) validationErrors.push('Product name is required')
      if (!categoryId) validationErrors.push('Category must be selected')
      if (!countryId) validationErrors.push('Country must be selected')
      if (!supplierId) validationErrors.push('Supplier must be selected')
      if (!sellingPriceUSD || sellingPriceUSD <= 0) validationErrors.push('Selling price must be greater than 0')
      if (!images || images.length === 0) validationErrors.push('At least one product image is required')

      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Cannot publish product with validation errors',
          validationErrors
        }, { status: 400 })
      }
    }

    // Prepare product data (INCLUDING DISCOUNT FIELDS)
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
      showDiscountToCustomers: Boolean(showDiscountToCustomers), // 🎯 NEW FIELD
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
      publishedBy: status === 'PUBLISHED' ? session.userId : null, // 🔧 FIXED: session.userId
      lastEditedAt: new Date()
    }

    // Create product
    const product = await db.product.create({
      data: productData,
      include: {
        category: { select: { name: true } },
        country: { select: { name: true, currency: true } },
        supplier: { select: { name: true } }
      }
    })

    console.log(`Product ${product.name} created with status ${status} by user ${session.userId}`) // 🔧 FIXED: session.userId

    return NextResponse.json({
      success: true,
      message: `Product ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully`,
      product
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