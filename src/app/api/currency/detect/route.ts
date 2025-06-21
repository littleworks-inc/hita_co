import { NextRequest, NextResponse } from 'next/server'
import { getCustomerLocation } from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    const location = await getCustomerLocation(request)
    
    return NextResponse.json({
      country: location.country,
      currency: location.currency,
      detected: true
    })
  } catch (error) {
    console.error('Currency detection error:', error)
    
    // Return fallback
    return NextResponse.json({
      country: 'US',
      currency: 'USD',
      detected: false,
      error: 'Failed to detect location'
    })
  }
}