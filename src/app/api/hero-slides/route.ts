// src/app/api/hero-slides/route.ts (Public API for client-side)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withRateLimiting, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export const GET = withRateLimiting(RATE_LIMIT_CONFIGS.public.products)(
  async () => {
    try {
      const slides = await db.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      })

      return NextResponse.json(slides)
    } catch (error) {
      console.error('Error fetching public hero slides:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)