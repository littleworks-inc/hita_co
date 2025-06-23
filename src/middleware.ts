// File: src/middleware.ts - Enhanced with Draft System Protection

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Admin route protection (existing functionality)
  if (pathname.startsWith('/admin')) {
    // Allow login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for admin authentication
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Additional token validation could be added here
    return NextResponse.next()
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
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.next()
  }

  // Block access to draft-related URLs (if they somehow exist)
  const draftPaths = ['/draft/', '/preview/', '/admin-preview/']
  const isDraftPath = draftPaths.some(path => pathname.startsWith(path))
  
  if (isDraftPath) {
    // Redirect draft access attempts to homepage
    return NextResponse.redirect(new URL('/', request.url))
  }

  // SEO Protection: Add no-index headers for admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  // Enhanced Security Headers for Customer Routes
  if (!pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Add cache headers for published content
    if (pathname.startsWith('/products/') || pathname.startsWith('/categories/')) {
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    }
    
    return response
  }

  return NextResponse.next()
}

// Enhanced matcher to include product routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/products/:path*',
    '/categories/:path*',
    '/draft/:path*',
    '/preview/:path*'
  ]
}

// Alternative: More granular middleware for draft protection
export async function advancedMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // ... existing admin protection code ...

  // Advanced Draft Protection (requires database access)
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

// Utility function for checking if user has admin access
export function isAdminUser(request: NextRequest): boolean {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return false
  }
  
  // In a real implementation, you'd validate the JWT token here
  // For now, we just check if it exists
  return true
}

// Utility function for getting user info from request
export function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return null
  }
  
  // In a real implementation, decode JWT and return user info
  return {
    isAdmin: true,
    id: 'admin-user'
  }
}