import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const includeOrders = searchParams.get('includeOrders') === 'true'

    const exhibitions = await db.exhibition.findMany({
      include: {
        ...(includeProducts && {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  sellingPriceUSD: true
                }
              }
            }
          }
        }),
        ...(includeOrders && {
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            }
          }
        }),
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json(exhibitions)
  } catch (error) {
    console.error('Exhibitions GET error:', error)
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

    // Create exhibition
    const exhibition = await db.exhibition.create({
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
    console.error('Exhibition creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}