// src/app/api/currency/detect/route.ts
// ✅ FIXED: Properly handle dynamic server usage

import { NextRequest, NextResponse } from 'next/server'

// ✅ IMPORTANT: Mark as dynamic to prevent build warnings
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ✅ SAFE: Access headers after marking as dynamic
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')
    
    // Extract IP address
    const ip = forwardedFor?.split(',')[0] || realIP || '127.0.0.1'
    
    // Default currency detection logic
    let detectedCurrency = 'USD'
    let detectedCountry = 'US'
    
    // Basic country detection (you can enhance this)
    if (process.env.NODE_ENV === 'development') {
      // Development defaults
      detectedCurrency = 'USD'
      detectedCountry = 'US'
    } else {
      // In production, you could integrate with:
      // - Cloudflare headers (CF-IPCountry)
      // - MaxMind GeoIP
      // - ipinfo.io
      // For now, use simple detection
      
      // Check for some common patterns
      if (userAgent?.includes('Mobile')) {
        // Mobile users might prefer local currency
        // This is just an example - implement proper geolocation
      }
      
      // Default to USD for now
      detectedCurrency = 'USD'
      detectedCountry = 'US'
    }

    return NextResponse.json({
      success: true,
      currency: detectedCurrency,
      country: detectedCountry,
      ip: process.env.NODE_ENV === 'development' ? ip : undefined, // Hide IP in production
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Currency detection error:', error)
    
    // Return safe defaults on error
    return NextResponse.json({
      success: true,
      currency: 'USD',
      country: 'US',
      error: 'Detection failed, using defaults'
    })
  }
}