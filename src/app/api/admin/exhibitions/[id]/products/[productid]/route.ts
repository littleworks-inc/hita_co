import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if exhibition product exists
    const existingExhibitionProduct = await db.exhibitionProduct.findUnique({
      where: { id: params.productId }
    })

    if (!existingExhibitionProduct) {
      return NextResponse.json({ error: 'Exhibition product not found' }, { status: 404 })
    }

    const data = await request.json()

    // Validate quantities
    if (data.quantityTaken < 0 || data.quantitySold < 0) {
      return NextResponse.json(
        { error: 'Quantities cannot be negative' },
        { status: 400 }
      )
    }

    if (data.quantitySold > data.quantityTaken) {
      return NextResponse.json(
        { error: 'Quantity sold cannot exceed quantity taken' },
        { status: 400 }
      )
    }

    // Update exhibition product
    const exhibitionProduct = await db.exhibitionProduct.update({
      where: { id: params.productId },
      data: {
        quantityTaken: data.quantityTaken,
        quantitySold: data.quantitySold
      },
      include: {
        product: {
          include: {
            category: true,
            country: true
          }
        }
      }
    })

    return NextResponse.json(exhibitionProduct)
  } catch (error) {
    console.error('Exhibition product update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if exhibition product exists
    const existingExhibitionProduct = await db.exhibitionProduct.findUnique({
      where: { id: params.productId }
    })

    if (!existingExhibitionProduct) {
      return NextResponse.json({ error: 'Exhibition product not found' }, { status: 404 })
    }

    // Check if any sales have been recorded
    if (existingExhibitionProduct.quantitySold > 0) {
      return NextResponse.json(
        { error: 'Cannot remove product with recorded sales. Set quantity sold to 0 first.' },
        { status: 400 }
      )
    }

    // Delete exhibition product
    await db.exhibitionProduct.delete({
      where: { id: params.productId }
    })

    return NextResponse.json({ message: 'Product removed from exhibition successfully' })
  } catch (error) {
    console.error('Exhibition product deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}