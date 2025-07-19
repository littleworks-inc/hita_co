// src/app/api/admin/products/[id]/route.ts
// ✅ COMPLETE FIXED VERSION - All handlers working properly

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

// PATCH - Update specific product fields (like barcode)
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

// ✅ FIXED: PUT - Complete full product update handler
export async function PUT(request: NextRequest, { params }: ProductParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ COMPLETE: Parse the request body
    const productData = await request.json()

    console.log('🔧 PUT: Updating product:', params.id)
    console.log('📤 PUT: Received data:', JSON.stringify(productData, null, 2))

    // Validate required fields
    if (!productData.name || !productData.sku) {
      return NextResponse.json({ 
        error: 'Name and SKU are required' 
      }, { status: 400 })
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check for duplicate SKU (excluding current product)
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

    // Check for duplicate barcode if provided (excluding current product)
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

    // ✅ FIXED: Prepare clean data for database update
    const cleanProductData = {
      sku: productData.sku,
      name: productData.name,
      description: productData.description || '',
      shortDescription: productData.shortDescription || '',
      categoryId: productData.categoryId,
      countryId: productData.countryId,
      supplierId: productData.supplierId,
      barcode: productData.barcode || null,
      barcodeType: productData.barcodeType || 'CODE128',
      originalPrice: Number(productData.originalPrice) || 0,
      originalCurrency: productData.originalCurrency || '',
      quantity: Number(productData.quantity) || 1,
      gstPercentage: Number(productData.gstPercentage) || 0,
      shippingCost: Number(productData.shippingCost) || 0,
      conversionCharges: Number(productData.conversionCharges) || 0,
      additionalExpenses: Number(productData.additionalExpenses) || 0,
      costPriceUSD: Number(productData.costPriceUSD) || 0,
      piecePriceUSD: Number(productData.piecePriceUSD) || 0,
      profitMargin: Number(productData.profitMargin) || 0,
      discountPercentage: Number(productData.discountPercentage) || 0,
      showDiscountToCustomers: Boolean(productData.showDiscountToCustomers),
      sellingPriceUSD: Number(productData.sellingPriceUSD) || 0,
      stockQuantity: Number(productData.stockQuantity) || 0,
      lowStockAlert: Number(productData.lowStockAlert) || 0,
      isActive: Boolean(productData.isActive),
      isFeatured: Boolean(productData.isFeatured),
      tags: Array.isArray(productData.tags) ? productData.tags : [],
      images: Array.isArray(productData.images) ? productData.images : [],
      seoTitle: productData.seoTitle || '',
      seoDescription: productData.seoDescription || '',
      status: productData.status || 'DRAFT',
      requiresSizes: Boolean(productData.requiresSizes),
      // Handle date fields properly
      purchaseDate: productData.purchaseDate ? new Date(productData.purchaseDate) : null,
      invoiceNumber: productData.invoiceNumber || '',
      publishedAt: productData.status === 'PUBLISHED' && !existingProduct.publishedAt 
        ? new Date() 
        : existingProduct.publishedAt,
      updatedAt: new Date()
    }

    console.log('🧹 PUT: Clean data prepared:', JSON.stringify(cleanProductData, null, 2))

    // ✅ TRANSACTION: Update product and handle sizes
    const result = await db.$transaction(async (tx) => {
      // Update the main product
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: cleanProductData,
        include: {
          category: true,
          country: true,
          supplier: true,
          productSizes: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      })

      // Handle product sizes if this is a sized product
      if (productData.requiresSizes && productData.productSizes && Array.isArray(productData.productSizes)) {
        // Delete existing sizes
        await tx.productSize.deleteMany({
          where: { productId: params.id }
        })

        // Create new sizes if provided
        if (productData.productSizes.length > 0) {
          const sizesData = productData.productSizes.map((size: any, index: number) => ({
            productId: params.id,
            size: size.size,
            sku: size.sku,
            stockQuantity: Number(size.stockQuantity) || 0,
            lowStockAlert: Number(size.lowStockAlert) || 0,
            isActive: Boolean(size.isActive),
            sortOrder: Number(size.sortOrder) || index
          }))

          await tx.productSize.createMany({
            data: sizesData
          })
        }

        // Fetch updated product with new sizes
        return await tx.product.findUnique({
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
      }

      return updatedProduct
    })

    console.log('✅ PUT: Product updated successfully:', result?.id)

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: result
    })

  } catch (error) {
    console.error('❌ PUT: Error updating product:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('❌ PUT: Error details:', errorMessage)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
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
    const existingProduct = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete product and related data in transaction
    await db.$transaction(async (tx) => {
      // Delete product sizes first (foreign key constraint)
      await tx.productSize.deleteMany({
        where: { productId: params.id }
      })

      // Delete the product
      await tx.product.delete({
        where: { id: params.id }
      })
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