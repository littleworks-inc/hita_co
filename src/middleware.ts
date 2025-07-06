// src/middleware.ts
// ✅ FIXED: Properly handle exhibition routes to prevent redirect loops

import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // ✅ FIXED: Admin route protection
  if (pathname.startsWith('/admin')) {
    // Allow login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for admin authentication
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      console.log('No admin session token, redirecting to admin login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Basic token validation
    try {
      if (sessionToken.length < 10) {
        console.log('Invalid admin session token format')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
      // Token seems valid, allow admin access
      return NextResponse.next()
    } catch (error) {
      console.error('Error validating admin session token:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // ✅ NEW: Exhibition route protection
  if (pathname.startsWith('/exhibition')) {
    // ✅ CRITICAL: Allow exhibition login page
    if (pathname === '/exhibition/login') {
      return NextResponse.next()
    }

    // ✅ CRITICAL: Allow exhibition help page
    if (pathname === '/exhibition/help') {
      return NextResponse.next()
    }

    // ✅ For other exhibition routes, check authentication
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      console.log('No exhibition session token, redirecting to exhibition login')
      return NextResponse.redirect(new URL('/exhibition/login', request.url))
    }

    // Basic token validation for exhibition access
    try {
      if (sessionToken.length < 10) {
        console.log('Invalid exhibition session token format')
        return NextResponse.redirect(new URL('/exhibition/login', request.url))
      }
      
      // Token seems valid, allow exhibition access
      return NextResponse.next()
    } catch (error) {
      console.error('Error validating exhibition session token:', error)
      return NextResponse.redirect(new URL('/exhibition/login', request.url))
    }
  }

  // ✅ API Route Protection
  if (pathname.startsWith('/api/admin')) {
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Basic token validation
    try {
      if (sessionToken.length < 10) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      
      // Token seems valid, allow API access
      return NextResponse.next()
    } catch (error) {
      console.error('Error validating API token:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }

  // ✅ Exhibition API protection (if you have exhibition-specific APIs)
  if (pathname.startsWith('/api/exhibition')) {
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Basic token validation
    try {
      if (sessionToken.length < 10) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      
      // Token seems valid, allow exhibition API access
      return NextResponse.next()
    } catch (error) {
      console.error('Error validating exhibition API token:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }

  // Draft System Protection for Customer Routes
  if (pathname.startsWith('/products/') && pathname !== '/products') {
    // Extract product slug from URL
    const productSlug = pathname.split('/products/')[1]
    
    if (productSlug && !productSlug.includes('/')) {
      // This is a product detail page - let the page component handle 404 for drafts
      return NextResponse.next()
    }
  }

  // Allow all other routes (public pages, customer routes, etc.)
  return NextResponse.next()
}

// ✅ CRITICAL: Specify runtime as nodejs to avoid Edge Runtime issues
export const config = {
  runtime: 'nodejs',
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