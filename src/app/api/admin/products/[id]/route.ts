// =====================================
// src/app/api/admin/products/[id]/route.ts - COMPLETE WITH DISCOUNT SYSTEM
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/products/[id] - Fetch single product
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
            name: true,
            contactPerson: true,
            phone: true,
            email: true 
          } 
        }
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

    // Extract discount fields and other data
    const {
      status,
      publishedAt,
      publishedBy,
      showDiscountToCustomers, // 🎯 NEW: Extract discount visibility field
      discountPercentage,      // 🎯 Extract discount percentage for validation
      ...productData
    } = data

    // 🎯 NEW: Validate discount fields
    if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage >= 100)) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 99.99' },
        { status: 400 }
      )
    }

    // Additional validation for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = []
      if (!data.name?.trim()) validationErrors.push('Product name is required')
      if (!data.categoryId) validationErrors.push('Category must be selected')
      if (!data.countryId) validationErrors.push('Country must be selected')
      if (!data.supplierId) validationErrors.push('Supplier must be selected')
      if (!data.sellingPriceUSD || data.sellingPriceUSD <= 0) validationErrors.push('Selling price must be greater than 0')
      if (!data.images || data.images.length === 0) validationErrors.push('At least one product image is required')

      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Cannot publish product',
          validationErrors
        }, { status: 400 })
      }
    }

    // Prepare update data (INCLUDING DISCOUNT FIELDS)
    const updateData = {
      ...productData,
      // 🎯 NEW: Include discount fields in update
      discountPercentage: discountPercentage !== undefined ? parseFloat(discountPercentage) || 0 : undefined,
      showDiscountToCustomers: showDiscountToCustomers !== undefined ? Boolean(showDiscountToCustomers) : undefined,
      // Status and tracking fields
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
      purchaseDate: productData.purchaseDate ? new Date(productData.purchaseDate) : undefined
    }

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

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
                     status === 'DRAFT' ? 'saved as draft' : 
                     status === 'ARCHIVED' ? 'archived' : 'updated'

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

// DELETE /api/admin/products/[id] - Delete product
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

    // Check if product has orders (prevent deletion if so)
    const orderItemsCount = await db.orderItem.count({
      where: { productId: params.id }
    })

    if (orderItemsCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete product with existing orders. Consider archiving instead.',
        suggestion: 'Archive the product to hide it from customers while preserving order history.'
      }, { status: 400 })
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