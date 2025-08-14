// src/app/api/shipping/calculate/route.ts
// =====================================
// Shipping Calculation API Endpoint
// Real-time shipping cost calculation for cart and checkout
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import {
  calculateShipping,
  checkFreeShippingEligibility,
  validateShippingRequest,
  detectCountryFromIP,
  formatCurrency,
  convertCurrency,
  type ShippingCalculationRequest,
  type ShippingCalculationResult
} from '@/lib/shipping-utils'

// =================
// INTERFACES
// =================

interface ShippingAPIRequest {
  countryCode?: string // Optional - will detect from IP if not provided
  subtotalUSD: number
  currency?: string    // Customer's display currency
  items?: Array<{      // Optional: for future weight/item-based calculations
    productId: string
    quantity: number
    weight?: number
  }>
}

interface ShippingAPIResponse extends ShippingCalculationResult {
  success: boolean
  requestId?: string
  convertedAmounts?: {
    shippingCost: number
    freeShippingThreshold?: number
    remainingForFreeShipping?: number
  }
}

// =================
// MAIN API HANDLERS
// =================

/**
 * POST /api/shipping/calculate
 * Calculate shipping costs for cart/checkout
 */
export async function POST(request: NextRequest): Promise<NextResponse<ShippingAPIResponse>> {
  const requestId = generateRequestId()
  
  try {
    // Parse request body
    const body: ShippingAPIRequest = await request.json()
    
    // Auto-detect country if not provided
    let countryCode = body.countryCode?.toUpperCase()
    if (!countryCode) {
      // Try to detect from various sources
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIP = request.headers.get('x-real-ip')
      const cloudflareIP = request.headers.get('cf-connecting-ip')
      const cloudflareCountry = request.headers.get('cf-ipcountry')
      
      // Use Cloudflare country if available (most reliable)
      if (cloudflareCountry && cloudflareCountry !== 'XX') {
        countryCode = cloudflareCountry.toUpperCase()
      } else {
        // Fallback to IP detection
        const detectedIP = cloudflareIP || realIP || forwardedFor?.split(',')[0] || 
                          request.headers.get('x-forwarded-for')?.split(',')[0]
        countryCode = detectCountryFromIP(detectedIP)
      }
    }

    // Build shipping calculation request
    const shippingRequest: ShippingCalculationRequest = {
      countryCode: countryCode || 'US', // Default to US
      subtotalUSD: body.subtotalUSD,
      currency: body.currency,
      items: body.items
    }

    // Validate request
    const validation = validateShippingRequest(shippingRequest)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        shippingCostUSD: 0,
        shippingCostFormatted: '$0.00',
        isEligibleForFreeShipping: false,
        shippingZoneName: 'Invalid Request',
        error: validation.errors.join(', '),
        requestId
      } as ShippingAPIResponse, { status: 400 })
    }

    // Calculate shipping
    const shippingResult = await calculateShipping(shippingRequest)

    // Convert amounts to customer's currency if needed
    let convertedAmounts: ShippingAPIResponse['convertedAmounts']
    if (body.currency && body.currency !== 'USD') {
      try {
        const convertedShippingCost = await convertCurrency(shippingResult.shippingCostUSD, body.currency)
        const convertedThreshold = shippingResult.freeShippingThreshold 
          ? await convertCurrency(shippingResult.freeShippingThreshold, body.currency)
          : undefined
        const convertedRemaining = shippingResult.remainingForFreeShipping
          ? await convertCurrency(shippingResult.remainingForFreeShipping, body.currency)
          : undefined

        convertedAmounts = {
          shippingCost: convertedShippingCost,
          freeShippingThreshold: convertedThreshold,
          remainingForFreeShipping: convertedRemaining
        }
      } catch (error) {
        console.warn(`Currency conversion failed for ${body.currency}:`, error)
        // Continue without converted amounts
      }
    }

    // Build response
    const response: ShippingAPIResponse = {
      success: true,
      requestId,
      ...shippingResult,
      convertedAmounts
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Request-ID': requestId
      }
    })

  } catch (error) {
    console.error('Shipping calculation API error:', error)
    
    return NextResponse.json({
      success: false,
      shippingCostUSD: 0,
      shippingCostFormatted: '$0.00',
      isEligibleForFreeShipping: false,
      shippingZoneName: 'Error',
      error: 'Internal server error during shipping calculation',
      requestId
    } as ShippingAPIResponse, { status: 500 })
  }
}

/**
 * GET /api/shipping/calculate?country=US&subtotal=150&currency=USD
 * Quick shipping calculation via query parameters (for simple cases)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ShippingAPIResponse>> {
  const requestId = generateRequestId()
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract parameters
    const countryCode = searchParams.get('country')?.toUpperCase() || 'US'
    const subtotalParam = searchParams.get('subtotal')
    const currency = searchParams.get('currency') || 'USD'
    
    // Validate subtotal
    if (!subtotalParam) {
      return NextResponse.json({
        success: false,
        shippingCostUSD: 0,
        shippingCostFormatted: '$0.00',
        isEligibleForFreeShipping: false,
        shippingZoneName: 'Invalid Request',
        error: 'Subtotal parameter is required',
        requestId
      } as ShippingAPIResponse, { status: 400 })
    }

    const subtotalUSD = parseFloat(subtotalParam)
    if (isNaN(subtotalUSD) || subtotalUSD < 0) {
      return NextResponse.json({
        success: false,
        shippingCostUSD: 0,
        shippingCostFormatted: '$0.00',
        isEligibleForFreeShipping: false,
        shippingZoneName: 'Invalid Request',
        error: 'Invalid subtotal value',
        requestId
      } as ShippingAPIResponse, { status: 400 })
    }

    // Build shipping request
    const shippingRequest: ShippingCalculationRequest = {
      countryCode,
      subtotalUSD,
      currency
    }

    // Calculate shipping
    const shippingResult = await calculateShipping(shippingRequest)

    // Build response
    const response: ShippingAPIResponse = {
      success: true,
      requestId,
      ...shippingResult
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600', // Cache for 10 minutes for GET requests
        'X-Request-ID': requestId
      }
    })

  } catch (error) {
    console.error('Shipping calculation GET API error:', error)
    
    return NextResponse.json({
      success: false,
      shippingCostUSD: 0,
      shippingCostFormatted: '$0.00',
      isEligibleForFreeShipping: false,
      shippingZoneName: 'Error',
      error: 'Internal server error during shipping calculation',
      requestId
    } as ShippingAPIResponse, { status: 500 })
  }
}

// =================
// HELPER FUNCTIONS
// =================

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `ship-${timestamp}-${random}`
}

/**
 * Extract IP address from request headers
 */
function extractIPAddress(request: NextRequest): string | undefined {
  // Try multiple headers in order of preference
  const headers = [
    'cf-connecting-ip',    // Cloudflare
    'x-forwarded-for',     // Load balancers/proxies
    'x-real-ip',           // Nginx
    'x-client-ip',         // Apache
    'forwarded',           // RFC 7239
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      const ip = value.split(',')[0].trim()
      if (ip && ip !== '::1' && ip !== '127.0.0.1') {
        return ip
      }
    }
  }

  return undefined
}

/**
 * Log shipping calculation for analytics (optional)
 */
function logShippingCalculation(
  request: ShippingCalculationRequest, 
  result: ShippingCalculationResult,
  requestId: string
): void {
  try {
    // Optional: Log to analytics service, database, or monitoring tool
    console.log(`[${requestId}] Shipping calculated:`, {
      country: request.countryCode,
      subtotal: request.subtotalUSD,
      shippingCost: result.shippingCostUSD,
      zone: result.shippingZoneName,
      freeShipping: result.isEligibleForFreeShipping
    })
  } catch (error) {
    // Ignore logging errors
    console.warn('Failed to log shipping calculation:', error)
  }
}