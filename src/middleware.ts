// src/middleware.ts
// =====================================
// 🔧 FIXED: Middleware with Proper Exhibition Route Handling
// Prevents redirect loops by being more specific about path matching
// =====================================

import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🔍 Middleware processing: ${pathname}`)

  // ✅ CRITICAL: Allow all static files and API routes to pass through first
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next()
  }

  // ✅ FIXED: Admin route protection
  if (pathname.startsWith('/admin')) {
    // ✅ CRITICAL: Allow admin login page
    if (pathname === '/admin/login') {
      console.log('✅ Allowing admin login page')
      return NextResponse.next()
    }

    // Check for admin authentication
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      console.log('❌ No admin session token, redirecting to admin login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Basic token validation
    try {
      if (sessionToken.length < 10) {
        console.log('❌ Invalid admin session token format')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
      console.log('✅ Admin session valid, allowing access')
      return NextResponse.next()
    } catch (error) {
      console.error('❌ Error validating admin session token:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // ✅ FIXED: Exhibition route protection with specific path handling
  if (pathname.startsWith('/exhibition')) {
    // ✅ CRITICAL: Always allow exhibition login page - NO AUTHENTICATION CHECK
    if (pathname === '/exhibition/login') {
      console.log('✅ Allowing exhibition login page - no auth check')
      return NextResponse.next()
    }

    // ✅ CRITICAL: Allow exhibition help page
    if (pathname === '/exhibition/help') {
      console.log('✅ Allowing exhibition help page')
      return NextResponse.next()
    }

    // ✅ For ALL other exhibition routes, check authentication
    console.log(`🔐 Checking auth for exhibition route: ${pathname}`)
    
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      console.log('❌ No exhibition session token, redirecting to exhibition login')
      return NextResponse.redirect(new URL('/exhibition/login', request.url))
    }

    // Basic token validation for exhibition access
    try {
      if (sessionToken.length < 10) {
        console.log('❌ Invalid exhibition session token format')
        return NextResponse.redirect(new URL('/exhibition/login', request.url))
      }
      
      console.log('✅ Exhibition session valid, allowing access')
      return NextResponse.next()
    } catch (error) {
      console.error('❌ Error validating exhibition session token:', error)
      return NextResponse.redirect(new URL('/exhibition/login', request.url))
    }
  }

  // ✅ Allow all other routes (customer portal, public pages, etc.)
  console.log(`✅ Allowing public route: ${pathname}`)
  return NextResponse.next()
}

// ✅ CRITICAL: Proper matcher configuration to exclude static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}