import { NextResponse } from 'next/server'

export async function GET() {
  // Create a simple SVG placeholder
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f3f4f6"/>
      <circle cx="200" cy="160" r="40" fill="#d1d5db"/>
      <rect x="160" y="220" width="80" height="60" rx="8" fill="#d1d5db"/>
      <text x="200" y="320" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="16">
        No Image
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    },
  })
}