import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const includeChildren = searchParams.get('includeChildren') === 'true'

    const categories = await db.category.findMany({
      where: parentId ? { parentId } : { parentId: null },
      include: {
        children: includeChildren ? {
          where: {
            products: {
              some: {
                isActive: true,
                stockQuantity: { gt: 0 }
              }
            }
          },
          select: {
            id: true,
            name: true,
            slug: true
          }
        } : false,
        _count: {
          select: { 
            products: {
              where: {
                isActive: true,
                stockQuantity: { gt: 0 }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Filter out categories with no active products
    const activeCategories = categories.filter(category => category._count.products > 0)

    return NextResponse.json(activeCategories)
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}