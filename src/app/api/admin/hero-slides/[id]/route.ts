// src/app/api/admin/hero-slides/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slide = await db.heroSlide.findUnique({
      where: { id: params.id }
    })

    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    return NextResponse.json(slide)
  } catch (error) {
    console.error('Error fetching hero slide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const body = await request.json()
    const { title, subtitle, description, ctaText, ctaLink, image, gradient, isActive, order } = body

    // Check if slide exists
    const existingSlide = await db.heroSlide.findUnique({
      where: { id: params.id }
    })

    if (!existingSlide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }
      updateData.title = title.trim()
    }

    if (subtitle !== undefined) updateData.subtitle = subtitle?.trim() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (ctaText !== undefined) updateData.ctaText = ctaText?.trim() || null
    if (ctaLink !== undefined) updateData.ctaLink = ctaLink?.trim() || null
    if (image !== undefined) updateData.image = image?.trim() || null
    if (gradient !== undefined) updateData.gradient = gradient?.trim() || 'from-purple-600 to-pink-600'
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    const slide = await db.heroSlide.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(slide)
  } catch (error) {
    console.error('Error updating hero slide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Check if slide exists
    const existingSlide = await db.heroSlide.findUnique({
      where: { id: params.id }
    })

    if (!existingSlide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    await db.heroSlide.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Slide deleted successfully' })
  } catch (error) {
    console.error('Error deleting hero slide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}