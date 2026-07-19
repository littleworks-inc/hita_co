// src/middleware.ts
// =====================================
// 🔧 FIXED: Middleware with Proper Exhibition Route Handling
// Prevents redirect loops by being more specific about path matching
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Edge-compatible JWT verification. Uses the same HS256 secret as src/lib/auth.ts.
// jose works on the Edge runtime (Web Crypto), unlike the bcrypt-based auth module.
const secret = process.env.JWT_SECRET
const secretKey = secret ? new TextEncoder().encode(secret) : null

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token =
    request.cookies.get('session')?.value ||
    request.cookies.get('auth-token')?.value

  if (!token || !secretKey) return false

  try {
    await jwtVerify(token, secretKey, { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

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

    // Verify the session token's signature (not just its presence/length)
    if (!(await hasValidSession(request))) {
      console.log('❌ Invalid or missing admin session, redirecting to admin login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    console.log('✅ Admin session valid, allowing access')
    return NextResponse.next()
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

    // ✅ For ALL other exhibition routes, verify the session signature
    console.log(`🔐 Checking auth for exhibition route: ${pathname}`)

    if (!(await hasValidSession(request))) {
      console.log('❌ Invalid or missing exhibition session, redirecting to exhibition login')
      return NextResponse.redirect(new URL('/exhibition/login', request.url))
    }

    console.log('✅ Exhibition session valid, allowing access')
    return NextResponse.next()
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