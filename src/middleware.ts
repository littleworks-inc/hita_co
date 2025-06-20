import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is an admin route (except login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const authenticated = await isAuthenticated(request)
    
    if (!authenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Redirect authenticated users away from login page
  if (pathname === '/admin/login') {
    const authenticated = await isAuthenticated(request)
    
    if (authenticated) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // Redirect root admin path to dashboard
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}