// src/app/api/auth/logout/route.ts
// ✅ FIXED: Logout API with proper redirect handling

import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get the referer to determine where the logout came from
    const referer = request.headers.get('referer') || ''
    const isExhibitionLogout = referer.includes('/exhibition')
    
    // Determine redirect URL based on where logout came from
    const redirectUrl = isExhibitionLogout ? '/exhibition/login' : '/admin/login'
    
    // Create redirect response
    const response = NextResponse.redirect(new URL(redirectUrl, request.url))

    // Clear both session cookies
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    console.log(`🔓 User logged out, redirecting to: ${redirectUrl}`)
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    
    // Fallback redirect on error
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    
    // Still clear cookies even on error
    response.cookies.set('session', '', { maxAge: 0, path: '/' })
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
    
    return response
  }
}

// ✅ ALSO handle GET requests (in case someone visits the URL directly)
export async function GET(request: NextRequest) {
  return POST(request)
}