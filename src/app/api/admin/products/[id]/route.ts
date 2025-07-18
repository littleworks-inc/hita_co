// src/app/api/admin/products/[id]/route.ts
// ✅ ADD PATCH method for barcode updates

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

interface ProductParams {
  params: {
    id: string
  }
}

// GET - Fetch single product
export async function GET(request: NextRequest, { params }: ProductParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        country: true,
        supplier: true,
        productSizes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ✅ NEW: PATCH - Update specific product fields (like barcode)
export async function PATCH(request: NextRequest, { params }: ProductParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData = await request.json()

    // Validate product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // If updating barcode, check for duplicates
    if (updateData.barcode && updateData.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await db.product.findFirst({
        where: {
          barcode: updateData.barcode,
          id: { not: params.id }
        }
      })

      if (duplicateBarcode) {
        return NextResponse.json({ 
          error: 'Barcode already exists on another product' 
        }, { status: 409 })
      }
    }

    // Update only the provided fields
    const updatedProduct = await db.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        country: true,
        supplier: true,
        productSizes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Full product update (existing functionality)
export async function PUT(request: NextRequest, { params }: ProductParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productData = await request.json()

    // Validate required fields
    if (!productData.name || !productData.sku) {
      return NextResponse.json({ 
        error: 'Name and SKU are required' 
      }, { status: 400 })
    }

    // Check for duplicate SKU
    const duplicateSku = await db.product.findFirst({
      where: {
        sku: productData.sku,
        id: { not: params.id }
      }
    })

    if (duplicateSku) {
      return NextResponse.json({ 
        error: 'SKU already exists' 
      }, { status: 409 })
    }

    // Check for duplicate barcode if provided
    if (productData.barcode) {
      const duplicateBarcode = await db.product.findFirst({
        where: {
          barcode: productData.barcode,
          id: { not: params.id }
        }
      })

      if (duplicateBarcode) {
        return NextResponse.json({ 
          error: 'Barcode already exists' 
        }, { status: 409 })
      }
    }

    // Update product
    const updatedProduct = await db.product.update({
      where: { id: params.id },
      data: {
        ...productData,
        updatedAt: new Date()
      },
      include: {
        category: true,
        country: true,
        supplier: true,
        productSizes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest, { params }: ProductParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is used in any orders/exhibitions
    const [orderItems, exhibitionProducts] = await Promise.all([
      db.orderItem.count({ where: { productId: params.id } }),
      db.exhibitionProduct.count({ where: { productId: params.id } })
    ])

    if (orderItems > 0 || exhibitionProducts > 0) {
      // Don't delete, just archive
      await db.product.update({
        where: { id: params.id },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Product archived (cannot delete due to existing orders/exhibitions)'
      })
    }

    // Safe to delete
    await db.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}