// =====================================
// src/app/api/admin/products/[id]/route.ts - COMPLETE FIXED VERSION
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
    const { id } = params

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Extract and validate required fields
    const {
      sku, name, description, shortDescription, categoryId, countryId, supplierId,
      barcode, barcodeType, originalPrice, originalCurrency, quantity, gstPercentage,
      shippingCost, conversionCharges, additionalExpenses, costPriceUSD, piecePriceUSD,
      profitMargin, discountPercentage, showDiscountToCustomers, sellingPriceUSD,
      stockQuantity, lowStockAlert, tags, images, seoTitle, seoDescription,
      purchaseDate, invoiceNumber, isActive, isFeatured, status, publishedAt
    } = data

    // Basic validation
    if (!sku?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'SKU and name are required' }, { status: 400 })
    }

    if (!categoryId || !countryId || !supplierId) {
      return NextResponse.json({ error: 'Category, country, and supplier are required' }, { status: 400 })
    }

    // Validate discount percentage
    if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage >= 100)) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 99.99' },
        { status: 400 }
      )
    }

    // Additional validation for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = []
      if (!name?.trim()) validationErrors.push('Product name is required')
      if (!description?.trim()) validationErrors.push('Product description is required')
      if (!categoryId) validationErrors.push('Category is required')
      if (!supplierId) validationErrors.push('Supplier is required')
      if (!countryId) validationErrors.push('Country is required')
      if (!sellingPriceUSD || sellingPriceUSD <= 0) validationErrors.push('Selling price must be greater than 0')
      if (!images || images.length === 0) validationErrors.push('At least one product image is required')

      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Cannot publish product with validation errors',
          validationErrors
        }, { status: 400 })
      }
    }

    // ✅ FIXED: Use connect syntax for relations and remove non-existent fields
    const updateData = {
      sku: sku.trim(),
      name: name.trim(),
      description: description || '',
      shortDescription: shortDescription || '',
      // ✅ FIX: Use connect syntax for relations
      category: { connect: { id: categoryId } },
      country: { connect: { id: countryId } },
      supplier: { connect: { id: supplierId } },
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
      publishedAt: status === 'PUBLISHED' && !publishedAt ? new Date() : (publishedAt ? new Date(publishedAt) : null)
      // ✅ REMOVED: lastEditedAt (doesn't exist in schema)
      // ✅ REMOVED: publishedBy (doesn't exist in schema)
    }

    // Update product
    const product = await db.product.update({
      where: { id },
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

    console.log(`Product ${product.name} ${actionText} successfully`)

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

    console.log(`Product ${product.name} deleted successfully`)

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