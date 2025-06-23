// Updated Product API Routes with Draft Support
// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/products
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const whereConditions: any = {}

    if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      whereConditions.status = status
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where: whereConditions,
        include: {
          category: { select: { name: true } },
          country: { select: { name: true, currency: true } },
          supplier: { select: { name: true } }
        },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      db.product.count({ where: whereConditions })
    ])

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

    // Extract and validate required fields
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
      // 🆕 Draft system fields
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

    // Additional validation for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = []
      if (!name?.trim()) validationErrors.push('Product name is required')
      if (!categoryId) validationErrors.push('Category must be selected')
      if (!sellingPriceUSD || sellingPriceUSD <= 0) validationErrors.push('Selling price must be greater than 0')
      if (!images || images.length === 0) validationErrors.push('At least one product image is required')

      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Cannot publish product',
          validationErrors
        }, { status: 400 })
      }
    }

    // Prepare product data
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
      originalPrice: originalPrice || 0,
      originalCurrency: originalCurrency || 'INR',
      quantity: quantity || 1,
      gstPercentage: gstPercentage || 0,
      shippingCost: shippingCost || 0,
      conversionCharges: conversionCharges || 0,
      additionalExpenses: additionalExpenses || 0,
      costPriceUSD: costPriceUSD || 0,
      piecePriceUSD: piecePriceUSD || 0,
      profitMargin: profitMargin || 0,
      discountPercentage: discountPercentage || 0,
      sellingPriceUSD: sellingPriceUSD || 0,
      stockQuantity: stockQuantity || 0,
      lowStockAlert: lowStockAlert || 5,
      tags: tags || [],
      images: images || [],
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      invoiceNumber: invoiceNumber || '',
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      // 🆕 Draft system fields
      status,
      publishedAt: status === 'PUBLISHED' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      publishedBy: status === 'PUBLISHED' ? session.user.id : null,
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

    console.log(`Product ${product.name} created with status ${status} by user ${session.user.id}`)

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

// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { name: true } },
        country: { select: { name: true, currency: true } },
        supplier: { select: { name: true } }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, publishedAt: true }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const {
      status,
      publishedAt,
      publishedBy,
      ...productData
    } = data

    // Additional validation for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = []
      if (!data.name?.trim()) validationErrors.push('Product name is required')
      if (!data.categoryId) validationErrors.push('Category must be selected')
      if (!data.sellingPriceUSD || data.sellingPriceUSD <= 0) validationErrors.push('Selling price must be greater than 0')
      if (!data.images || data.images.length === 0) validationErrors.push('At least one product image is required')

      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Cannot publish product',
          validationErrors
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {
      ...productData,
      status: status || existingProduct.status,
      lastEditedAt: new Date(),
      // Set publishedAt when first published
      publishedAt: status === 'PUBLISHED' && !existingProduct.publishedAt 
        ? new Date() 
        : (publishedAt ? new Date(publishedAt) : existingProduct.publishedAt),
      publishedBy: status === 'PUBLISHED' && !existingProduct.publishedAt 
        ? session.user.id 
        : publishedBy,
      // Handle date fields
      purchaseDate: productData.purchaseDate ? new Date(productData.purchaseDate) : null
    }

    // Update product
    const product = await db.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: { select: { name: true } },
        country: { select: { name: true, currency: true } },
        supplier: { select: { name: true } }
      }
    })

    const actionText = status === 'PUBLISHED' ? 'published' : 
                     status === 'DRAFT' ? 'saved as draft' : 'updated'

    console.log(`Product ${product.name} ${actionText} by user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: `Product ${actionText} successfully`,
      product
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
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

// DELETE /api/admin/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: { id: true, name: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete product
    await db.product.delete({
      where: { id: params.id }
    })

    console.log(`Product ${product.name} deleted by user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}