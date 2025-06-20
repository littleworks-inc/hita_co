import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibition = await db.exhibition.findUnique({
      where: { id: params.id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                sellingPriceUSD: true,
                images: true
              }
            }
          }
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            customerName: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    return NextResponse.json(exhibition)
  } catch (error) {
    console.error('Exhibition GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if exhibition exists
    const existingExhibition = await db.exhibition.findUnique({
      where: { id: params.id }
    })

    if (!existingExhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.location || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, location, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate participation fee
    if (data.participationFee < 0) {
      return NextResponse.json(
        { error: 'Participation fee cannot be negative' },
        { status: 400 }
      )
    }

    // Update exhibition
    const exhibition = await db.exhibition.update({
      where: { id: params.id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        location: data.location.trim(),
        startDate: startDate,
        endDate: endDate,
        participationFee: data.participationFee || 0,
        images: data.images || [],
        isActive: data.isActive ?? true
      },
      include: {
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    })

    return NextResponse.json(exhibition)
  } catch (error) {
    console.error('Exhibition update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if exhibition exists
    const existingExhibition = await db.exhibition.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    })

    if (!existingExhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Check if exhibition has products or orders
    if (existingExhibition._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete exhibition with tracked products. Please remove products first.' },
        { status: 400 }
      )
    }

    if (existingExhibition._count.orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete exhibition with associated orders.' },
        { status: 400 }
      )
    }

    // Delete exhibition
    await db.exhibition.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Exhibition deleted successfully' })
  } catch (error) {
    console.error('Exhibition deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}