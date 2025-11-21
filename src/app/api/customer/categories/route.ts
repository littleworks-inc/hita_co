 import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'

    const categories = await db.category.findMany({
      where: { 
        parentId: null, // Only top-level categories for showcase
        products: {
          some: {
            isActive: true,
            stockQuantity: { gt: 0 }
          }
        }
      },
      include: {
        products: includeProducts ? {
          where: {
            isActive: true,
            stockQuantity: { gt: 0 }
          },
          select: {
            id: true,
            images: true
          },
          take: 1 // Just one product for preview image
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
        },
        children: {
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
            slug: true,
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
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}