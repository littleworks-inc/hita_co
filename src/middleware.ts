// ✅ SECURITY: Enhanced middleware with comprehensive security features
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth'
import { applySecurityHeaders, securityMiddleware } from '@/middleware/security'
import { getIdentifier } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🔍 Processing: ${pathname} [${request.method}]`)
  
  // =====================================
  // 1. APPLY SECURITY CHECKS FIRST
  // =====================================
  
  // Skip security for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next()
  }
  
  // Apply security middleware to all other routes
  if (pathname.startsWith('/api/')) {
    const securityResponse = await securityMiddleware(request)
    if (securityResponse.status !== 200) {
      return securityResponse
    }
  }
  
  // =====================================
  // 2. ROUTE-SPECIFIC AUTHENTICATION
  // =====================================
  
  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Allow admin login page
    if (pathname === '/admin/login') {
      console.log('✅ Allowing admin login page')
      const response = NextResponse.next()
      return applySecurityHeaders(response)
    }
    
    // Check for admin authentication
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      console.log('❌ No admin session, redirecting to login')
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      return applySecurityHeaders(response)
    }
    
    // Validate token properly
    try {
      const payload = await decrypt(sessionToken)
      
      if (!payload?.userId || !payload?.email) {
        console.log('❌ Invalid admin session')
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        return applySecurityHeaders(response)
      }
      
      // Check for admin role
      if (payload.role !== 'admin' && payload.role !== 'super_admin') {
        console.log('❌ User lacks admin privileges')
        const response = NextResponse.redirect(new URL('/unauthorized', request.url))
        return applySecurityHeaders(response)
      }
      
      console.log('✅ Admin session valid')
      const response = NextResponse.next()
      
      // Add user info to request headers for use in API routes
      response.headers.set('X-User-Id', payload.userId)
      response.headers.set('X-User-Email', payload.email)
      response.headers.set('X-User-Role', payload.role)
      
      return applySecurityHeaders(response)
      
    } catch (error) {
      console.error('❌ Token validation error:', error)
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      return applySecurityHeaders(response)
    }
  }
  
  // Exhibition route protection
  if (pathname.startsWith('/exhibition')) {
    // Allow exhibition login and help pages
    if (pathname === '/exhibition/login' || pathname === '/exhibition/help') {
      console.log('✅ Allowing exhibition public page')
      const response = NextResponse.next()
      return applySecurityHeaders(response)
    }
    
    // Check for exhibition authentication
    const sessionToken = request.cookies.get('session')?.value || 
                        request.cookies.get('auth-token')?.value
    
    if (!sessionToken) {
      console.log('❌ No exhibition session, redirecting to login')
      const response = NextResponse.redirect(new URL('/exhibition/login', request.url))
      return applySecurityHeaders(response)
    }
    
    // Validate token
    try {
      const payload = await decrypt(sessionToken)
      
      if (!payload?.userId) {
        console.log('❌ Invalid exhibition session')
        const response = NextResponse.redirect(new URL('/exhibition/login', request.url))
        return applySecurityHeaders(response)
      }
      
      console.log('✅ Exhibition session valid')
      const response = NextResponse.next()
      
      // Add user info to headers
      response.headers.set('X-User-Id', payload.userId)
      response.headers.set('X-User-Email', payload.email || '')
      
      return applySecurityHeaders(response)
      
    } catch (error) {
      console.error('❌ Exhibition token validation error:', error)
      const response = NextResponse.redirect(new URL('/exhibition/login', request.url))
      return applySecurityHeaders(response)
    }
  }
  
  // =====================================
  // 3. API ROUTE PROTECTION
  // =====================================
  
  if (pathname.startsWith('/api/admin')) {
    // Admin API routes require authentication
    const sessionToken = request.cookies.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    try {
      const payload = await decrypt(sessionToken)
      
      if (!payload?.userId || payload.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
      
      // Add user context to API request
      const response = NextResponse.next()
      response.headers.set('X-User-Id', payload.userId)
      response.headers.set('X-User-Role', payload.role)
      
      return applySecurityHeaders(response)
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }
  }
  
  // =====================================
  // 4. PUBLIC ROUTES
  // =====================================
  
  console.log(`✅ Allowing public route: ${pathname}`)
  const response = NextResponse.next()
  
  // Apply security headers to all responses
  return applySecurityHeaders(response)
}

// ✅ SECURITY: Proper matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - public folder
     * - images and other static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|public|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|mp4)$).*)',
  ],
}