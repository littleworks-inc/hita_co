// =====================================
// src/app/api/admin/products/[id]/route.ts - UPDATED with Stock Sync
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { autoSyncAfterSizeChange } from '@/lib/stock-sync'

// GET /api/admin/products/[id] - Fetch single product (unchanged)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        country: { select: { name: true, currency: true } },
        supplier: { select: { name: true } },
        productSizes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Enrich with size-aware stock information
    const enrichedProduct = {
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
    }

    return NextResponse.json({ product: enrichedProduct })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product with automatic stock sync
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
      include: {
        productSizes: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

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
      archivedAt,
      requiresSizes,
      productSizes
    } = data

    // Prepare product data (excluding stock - will be calculated)
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
      status,
      publishedAt: status === 'PUBLISHED' && !publishedAt ? new Date() : (publishedAt ? new Date(publishedAt) : null),
      archivedAt: status === 'ARCHIVED' && !archivedAt ? new Date() : (archivedAt ? new Date(archivedAt) : null),
      requiresSizes: Boolean(requiresSizes),
      // ✅ KEY CHANGE: For non-sized products, use provided stockQuantity
      // For sized products, stockQuantity will be calculated after size updates
      ...(requiresSizes ? {} : { stockQuantity: parseInt(stockQuantity) || 0 })
    }

    // ✅ Update product with sizes and automatic stock sync
    const result = await db.$transaction(async (prisma) => {
      // Update the main product
      const product = await prisma.product.update({
        where: { id },
        data: productData,
        include: {
          category: { select: { name: true } },
          country: { select: { name: true, currency: true } },
          supplier: { select: { name: true } }
        }
      })

      // Handle size updates
      if (requiresSizes) {
        // Delete existing sizes
        await prisma.productSize.deleteMany({
          where: { productId: id }
        })

        // Create new sizes if provided
        if (productSizes?.length > 0) {
          const sizesData = productSizes.map((size, index) => ({
            productId: id,
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

          // ✅ KEY FEATURE: Auto-sync main product stock after size changes
          const totalSizeStock = sizesData
            .filter(size => size.isActive)
            .reduce((total, size) => total + size.stockQuantity, 0)

          await prisma.product.update({
            where: { id },
            data: { stockQuantity: totalSizeStock }
          })
        } else {
          // No sizes provided, set stock to 0
          await prisma.product.update({
            where: { id },
            data: { stockQuantity: 0 }
          })
        }
      }

      return product
    })

    // ✅ BACKUP SYNC: Ensure stock is properly synced (failsafe)
    if (requiresSizes) {
      await autoSyncAfterSizeChange(id)
    }

    console.log(`Product ${result.name} updated successfully with stock sync`)

    return NextResponse.json({
      message: 'Product updated successfully',
      product: result
    })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product (unchanged)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if product exists and get related data
    const existingProduct = await db.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        exhibitionItems: true,
        productSizes: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product has orders
    if (existingProduct.orderItems.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product that has orders. Consider archiving instead.'
      }, { status: 400 })
    }

    // Check if product is used in exhibitions
    if (existingProduct.exhibitionItems.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product that is in exhibitions. Remove from exhibitions first.'
      }, { status: 400 })
    }

    // Delete product and all related data in a transaction
    await db.$transaction(async (prisma) => {
      // Delete all product sizes first (due to foreign key constraints)
      await prisma.productSize.deleteMany({
        where: { productId: id }
      })

      // Delete the main product
      await prisma.product.delete({
        where: { id }
      })
    })

    console.log(`Product ${existingProduct.name} deleted by user ${session?.userId || session?.id || 'unknown'}`)
    if (existingProduct.productSizes.length > 0) {
      console.log(`✅ Deleted ${existingProduct.productSizes.length} size variants`)
    }

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