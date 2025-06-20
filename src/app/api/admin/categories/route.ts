import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'

    const categories = await db.category.findMany({
      include: {
        parent: true,
        children: true,
        ...(includeProducts && {
          products: {
            select: {
              id: true,
              name: true,
              isActive: true
            }
          }
        }),
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Check if slug already exists
    const existingCategory = await db.category.findUnique({
      where: { slug: data.slug }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existingName = await db.category.findUnique({
      where: { name: data.name }
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

      // Ensure parent is not a subcategory itself (only allow 2-level hierarchy)
      if (parentCategory.parentId) {
        return NextResponse.json(
          { error: 'Cannot create subcategory under another subcategory' },
          { status: 400 }
        )
      }
    }

    // Create category
    const category = await db.category.create({
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
    console.error('Category creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}