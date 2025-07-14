// src/app/api/auth/session/route.ts
// =====================================
// 🔧 NEW: Session Check API Endpoint
// Allows frontend to check if user is already authenticated
// Used to prevent redirect loops and improve UX
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession()
    
    if (session) {
      // User is authenticated
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.userId,
          email: session.email,
          role: session.role || 'user'
        }
      })
    } else {
      // User is not authenticated
      return NextResponse.json({
        authenticated: false,
        user: null
      })
    }
  } catch (error) {
    console.error('Session check error:', error)
    
    // If there's an error, treat as not authenticated
    return NextResponse.json({
      authenticated: false,
      user: null
    })
  }
}