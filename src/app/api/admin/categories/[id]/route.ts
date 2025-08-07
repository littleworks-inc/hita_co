import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { withRateLimiting, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            isActive: true
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Category GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PUT = withRateLimiting(RATE_LIMIT_CONFIGS.admin.write)(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check if category exists
      const existingCategory = await db.category.findUnique({
        where: { id: params.id }
      })

      if (!existingCategory) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      const data = await request.json()

      // Validate required fields
      if (!data.name || !data.slug || !data.description) {
        return NextResponse.json(
          { error: 'Missing required fields: name, slug, and description are required' },
          { status: 400 }
        )
      }

      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(data.slug)) {
        return NextResponse.json(
          { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }

      // Check if slug already exists (excluding current category)
      const existingSlug = await db.category.findFirst({
        where: {
          slug: data.slug,
          id: { not: params.id }
        }
      })

      if (existingSlug) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        )
      }

      // Check if name already exists (excluding current category)
      const existingName = await db.category.findFirst({
        where: {
          name: data.name,
          id: { not: params.id }
        }
      })

      if (existingName) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        )
      }

      // Validate parent category if provided
      if (data.parentId) {
        const parentCategory = await db.category.findUnique({
          where: { id: data.parentId }
        })

        if (!parentCategory) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 400 }
          )
        }

        // Cannot set self as parent
        if (data.parentId === params.id) {
          return NextResponse.json(
            { error: 'Category cannot be its own parent' },
            { status: 400 }
          )
        }

        // Ensure parent is not a subcategory itself (only allow 2-level hierarchy)
        if (parentCategory.parentId) {
          return NextResponse.json(
            { error: 'Cannot create subcategory under another subcategory' },
            { status: 400 }
          )
        }

        // Cannot set a child as parent (prevent circular references)
        const children = await db.category.findMany({
          where: { parentId: params.id }
        })

        if (children.some(child => child.id === data.parentId)) {
          return NextResponse.json(
            { error: 'Cannot set a subcategory as parent of its parent category' },
            { status: 400 }
          )
        }
      }

      // Update category
      const category = await db.category.update({
        where: { id: params.id },
        data: {
          name: data.name.trim(),
          description: data.description.trim(),
          slug: data.slug.trim(),
          parentId: data.parentId || null
        },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        }
      })

      return NextResponse.json(category)
    } catch (error) {
      console.error('Category update error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = withRateLimiting(RATE_LIMIT_CONFIGS.admin.delete)(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check if category exists
      const existingCategory = await db.category.findUnique({
        where: { id: params.id },
        include: {
          children: true,
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        }
      })

      if (!existingCategory) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      // Check if category has products
      if (existingCategory._count.products > 0) {
        return NextResponse.json(
          { error: 'Cannot delete category with existing products. Please move or delete products first.' },
          { status: 400 }
        )
      }

      // Check if category has subcategories
      if (existingCategory._count.children > 0) {
        return NextResponse.json(
          { error: 'Cannot delete category with subcategories. Please delete or move subcategories first.' },
          { status: 400 }
        )
      }

      // Delete category
      await db.category.delete({
        where: { id: params.id }
      })

      return NextResponse.json({ message: 'Category deleted successfully' })
    } catch (error) {
      console.error('Category deletion error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)