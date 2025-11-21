// src/app/api/auth/login/route.ts
// =====================================
// 🔧 FIX: Unified Authentication Endpoint
// This creates the missing /api/auth/login route that both admin and exhibition pages expect
// Consolidates authentication logic into a single, secure endpoint
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, encrypt } from '@/lib/auth'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT session token
    const session = await encrypt({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    })

    // Create successful response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    // Set authentication cookies for compatibility with both middleware and getSession
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    }

    // Primary session cookie for getSession() function
    response.cookies.set('session', session, cookieOptions)

    // Secondary auth-token cookie for middleware compatibility
    response.cookies.set('auth-token', session, cookieOptions)

    console.log('🔐 Authentication successful for:', email)
    console.log('🍪 Session cookies set for user:', user.id)

    return response

  } catch (error) {
    console.error('❌ Authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}