// src/middleware.ts
// ✅ FIXED: Remove next-auth dependency, use custom JWT auth system
// Updated to work with your custom authentication

import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Allow login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // ✅ FIXED: Check for session using your custom auth system
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      console.log('No session token found, redirecting to login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // ✅ FIXED: Validate JWT token using your decrypt function
    try {
      const payload = await decrypt(sessionToken)
      if (!payload || !payload.userId) {
        console.log('Invalid session token, redirecting to login')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
      // Token is valid, allow access
      console.log('Valid session found for user:', payload.userId)
      return NextResponse.next()
    } catch (error) {
      console.error('Error validating session token:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Draft System Protection for Customer Routes
  if (pathname.startsWith('/products/') && pathname !== '/products') {
    // Extract product slug from URL
    const productSlug = pathname.split('/products/')[1]
    
    if (productSlug && !productSlug.includes('/')) {
      // This is a product detail page - we'll let the page component handle 404
      // for draft products, but we can add additional protection here if needed
      
      // Optional: Add draft detection at edge (requires database call)
      // For now, we'll rely on the page component's protection
      return NextResponse.next()
    }
  }

  // API Route Protection
  if (pathname.startsWith('/api/admin')) {
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // ✅ FIXED: Validate API token using your decrypt function
    try {
      const payload = await decrypt(sessionToken)
      if (!payload || !payload.userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      
      // Token is valid, allow API access
      return NextResponse.next()
    } catch (error) {
      console.error('Error validating API token:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }

  // Allow all other routes
  return NextResponse.next()
}

// ✅ FIXED: Update matcher to work with your route structure
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

// =================
// UTILITY FUNCTIONS
// =================

/**
 * Check if user has admin access
 */
export async function isAdminUser(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get('session')?.value || 
                      request.cookies.get('auth-token')?.value
  
  if (!sessionToken) {
    return false
  }
  
  try {
    const payload = await decrypt(sessionToken)
    return !!(payload && payload.userId)
  } catch (error) {
    console.error('Error checking admin access:', error)
    return false
  }
}

/**
 * Get user info from request
 */
export async function getUserFromRequest(request: NextRequest): Promise<{
  userId: string
  email: string
} | null> {
  const sessionToken = request.cookies.get('session')?.value || 
                      request.cookies.get('auth-token')?.value
  
  if (!sessionToken) {
    return null
  }
  
  try {
    const payload = await decrypt(sessionToken)
    if (payload && payload.userId) {
      return {
        userId: payload.userId,
        email: payload.email
      }
    }
    return null
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

/**
 * Advanced middleware function for future expansion
 */
export async function advancedMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Enhanced Draft Protection (requires database access)
  if (pathname.startsWith('/products/') && pathname !== '/products') {
    const productSlug = pathname.split('/products/')[1]
    
    if (productSlug && !productSlug.includes('/')) {
      // Extract SKU from slug (last part after final dash)
      const parts = productSlug.split('-')
      const sku = parts[parts.length - 1]
      
      // In a real implementation, you might want to cache product status
      // in Redis or similar for edge-level protection
      
      // For now, we'll add a header to indicate this should be checked
      const response = NextResponse.next()
      response.headers.set('X-Check-Product-Status', sku)
      return response
    }
  }

  return NextResponse.next()
}