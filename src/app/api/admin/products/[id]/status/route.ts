// src/app/api/admin/products/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, action } = body

    // Validate status
    if (!status || !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED' },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        status: true,
        isActive: true,
        description: true,
        images: true,
        sellingPriceUSD: true,
        stockQuantity: true,
        publishedAt: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate product for publishing
    if (status === 'PUBLISHED') {
      const validationErrors = validateProductForPublishing(existingProduct)
      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Product validation failed',
          validationErrors
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // Set timestamps based on action
    if (action === 'publish' && status === 'PUBLISHED') {
      // Only set publishedAt if this is the first time publishing
      if (!existingProduct.publishedAt) {
        updateData.publishedAt = new Date()
      }
      // Ensure isActive is true for published products (backward compatibility)
      updateData.isActive = true
    } else if (action === 'archive' && status === 'ARCHIVED') {
      updateData.archivedAt = new Date()
      // Set isActive to false for archived products (backward compatibility)
      updateData.isActive = false
    } else if (action === 'restore' && status === 'DRAFT') {
      updateData.archivedAt = null
      // Set isActive to true for draft products (backward compatibility)
      updateData.isActive = true
    }

    // Update the product
    const updatedProduct = await db.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        country: true,
        supplier: true
      }
    })

    return NextResponse.json({
      message: 'Product status updated successfully',
      product: updatedProduct,
      action,
      previousStatus: existingProduct.status || (existingProduct.isActive ? 'PUBLISHED' : 'ARCHIVED'),
      newStatus: status
    })

  } catch (error) {
    console.error('Product status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validation function for publishing
function validateProductForPublishing(product: any) {
  const errors = []

  if (!product.description || product.description.trim().length < 10) {
    errors.push('Product description is missing or too short (minimum 10 characters)')
  }

  if (!product.images || product.images.length === 0) {
    errors.push('At least one product image is required')
  }

  if (!product.sellingPriceUSD || product.sellingPriceUSD <= 0) {
    errors.push('Valid selling price is required')
  }

  if (product.stockQuantity === undefined || product.stockQuantity < 0) {
    errors.push('Stock quantity must be set (can be 0 for pre-orders)')
  }

  return errors
}

// Additional utility function to get product status counts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If id is 'counts', return status distribution
    if (params.id === 'counts') {
      const statusCounts = await db.product.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })

      const counts = {
        DRAFT: 0,
        PUBLISHED: 0,
        ARCHIVED: 0,
        total: 0
      }

      statusCounts.forEach((stat: any) => {
        counts[stat.status as keyof typeof counts] = stat._count.status
        counts.total += stat._count.status
      })

      // Also get featured count
      const featuredCount = await db.product.count({
        where: {
          status: 'PUBLISHED',
          isFeatured: true
        }
      })

      return NextResponse.json({
        ...counts,
        featured: featuredCount
      })
    }

    // Otherwise return individual product status info
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        status: true,
        isActive: true,
        isFeatured: true,
        publishedAt: true,
        archivedAt: true,
        updatedAt: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)

  } catch (error) {
    console.error('Product status fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}