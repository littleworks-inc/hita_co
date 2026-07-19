// src/app/api/hero-slides/route.ts (Public API for client-side)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Always read live from the DB. Without this, Next.js caches the response at
// build time and hero slides edited in the admin panel never appear on the site.
export const dynamic = 'force-dynamic'

export async function GET() {
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