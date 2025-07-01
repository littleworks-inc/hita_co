// =====================================
// ENHANCED: src/app/api/admin/products/[id]/route.ts
// Individual Product API with Complete Size System Support
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/products/[id] - Fetch single product with sizes
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
            name: true,
            contactPerson: true,
            phone: true,
            email: true 
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
            sortOrder: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // ✅ NEW: Calculate total stock for sized products
    const enrichedProduct = {
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

// PUT /api/admin/products/[id] - Update product with size support
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
      archivedAt,
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

      // Check for duplicate size SKUs within this product
      const sizeSKUs = productSizes.map(s => s.sku)
      const duplicateSKUs = sizeSKUs.filter((sku, index) => sizeSKUs.indexOf(sku) !== index)
      if (duplicateSKUs.length > 0) {
        return NextResponse.json({
          error: `Duplicate size SKUs found: ${duplicateSKUs.join(', ')}`
        }, { status: 400 })
      }
    }

    // Check for duplicate SKU (excluding current product)
    if (sku !== existingProduct.sku) {
      const duplicateProduct = await db.product.findUnique({
        where: { sku }
      })

      if (duplicateProduct) {
        return NextResponse.json({
          error: 'A product with this SKU already exists'
        }, { status: 400 })
      }
    }

    // ✅ NEW: Check for duplicate size SKUs across all products (excluding current product's sizes)
    if (requiresSizes && productSizes?.length > 0) {
      const sizeSKUs = productSizes.map(s => s.sku)
      const existingSizeSKUs = await db.productSize.findMany({
        where: {
          sku: { in: sizeSKUs },
          productId: { not: id } // Exclude current product's sizes
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
      archivedAt: status === 'ARCHIVED' && !archivedAt ? new Date() : (archivedAt ? new Date(archivedAt) : null),
      // ✅ NEW: Size system fields
      requiresSizes: Boolean(requiresSizes),
      sizeType: sizeType || null
    }

    // ✅ NEW: Update product with sizes in a transaction
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

          // Fetch the created sizes to include in response
          const createdSizes = await prisma.productSize.findMany({
            where: { productId: id },
            orderBy: { sortOrder: 'asc' }
          })

          return { ...product, productSizes: createdSizes }
        }
      } else {
        // If switching from sized to non-sized, delete all sizes
        await prisma.productSize.deleteMany({
          where: { productId: id }
        })
      }

      return product
    })

    console.log(`Product ${result.name} updated with status ${status} by user ${session?.userId || session?.id || 'unknown'}`)
    if (requiresSizes) {
      console.log(`✅ Updated ${productSizes?.length || 0} size variants`)
    }

    return NextResponse.json({
      success: true,
      message: `Product updated successfully`,
      product: result
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

// DELETE /api/admin/products/[id] - Delete product and all its sizes
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

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
      include: {
        productSizes: true,
        orderItems: true,
        exhibitionItems: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is used in orders
    if (existingProduct.orderItems.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product that has been ordered. Consider archiving instead.'
      }, { status: 400 })
    }

    // Check if product is used in exhibitions
    if (existingProduct.exhibitionItems.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete product that is in exhibitions. Remove from exhibitions first.'
      }, { status: 400 })
    }

    // ✅ NEW: Delete product and all related data in a transaction
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