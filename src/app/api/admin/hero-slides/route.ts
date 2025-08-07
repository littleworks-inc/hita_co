// src/app/api/admin/hero-slides/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { withRateLimiting, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export const GET = withRateLimiting(RATE_LIMIT_CONFIGS.admin.read)(
  async (request: NextRequest) => {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const slides = await db.heroSlide.findMany({
        orderBy: { order: 'asc' }
      })

      return NextResponse.json(slides)
    } catch (error) {
      console.error('Error fetching hero slides:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

export const POST = withRateLimiting(RATE_LIMIT_CONFIGS.admin.write)(
  async (request: NextRequest) => {
    try {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()
      const { title, subtitle, description, ctaText, ctaLink, image, gradient, isActive } = body

      if (!title?.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }

      // Check if we already have 5 slides
      const existingCount = await db.heroSlide.count()
      if (existingCount >= 5) {
        return NextResponse.json({ error: 'Maximum 5 slides allowed' }, { status: 400 })
      }

      // Get the next order number
      const maxOrder = await db.heroSlide.aggregate({
        _max: { order: true }
      })
      const nextOrder = (maxOrder._max.order || 0) + 1

      const slide = await db.heroSlide.create({
        data: {
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          description: description?.trim() || null,
          ctaText: ctaText?.trim() || null,
          ctaLink: ctaLink?.trim() || null,
          image: image?.trim() || null,
          gradient: gradient?.trim() || 'from-purple-600 to-pink-600',
          order: nextOrder,
          isActive: isActive !== undefined ? isActive : true
        }
      })

      return NextResponse.json(slide, { status: 201 })
    } catch (error) {
      console.error('Error creating hero slide:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)