import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// ✅ SECURITY FIX: Enforce JWT_SECRET presence with no fallback
const getSecretKey = () => {
  const secretKey = process.env.JWT_SECRET
  
  if (!secretKey) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Application cannot start securely.')
  }
  
  // Validate minimum key length for security
  if (secretKey.length < 32) {
    throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters long for security.')
  }
  
  return new TextEncoder().encode(secretKey)
}

// Get the key once at module load
const key = getSecretKey()

// ✅ SECURITY: Enhanced token generation with additional claims
export async function encrypt(payload: any) {
  // Add security claims
  const securePayload = {
    ...payload,
    iat: Date.now() / 1000,
    jti: crypto.randomBytes(16).toString('hex'), // Unique token ID for revocation
    iss: process.env.NEXT_PUBLIC_APP_URL || 'ecommers-platform', // Issuer
  }
  
  return await new SignJWT(securePayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setNotBefore('0s') // Token valid immediately
    .sign(key)
}

// ✅ SECURITY: Enhanced token verification with additional checks
export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
      issuer: process.env.NEXT_PUBLIC_APP_URL || 'ecommers-platform',
    })
    
    // Additional security check: Ensure token is not too old
    const tokenAge = Date.now() / 1000 - (payload.iat as number)
    const maxAge = 7 * 24 * 60 * 60 // 7 days in seconds
    
    if (tokenAge > maxAge) {
      console.warn('Token age exceeds maximum allowed age')
      return null
    }
    
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// ✅ SECURITY: Enhanced password hashing with configurable rounds
export async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
  
  // Use environment variable for bcrypt rounds if available, default to 12
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  return await bcrypt.hash(password, rounds)
}

// ✅ SECURITY: Password verification with timing attack protection
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Bcrypt already includes timing attack protection
  return await bcrypt.compare(password, hashedPassword)
}

// ✅ SECURITY: Enhanced session management with additional validation
export async function getSession() {
  try {
    const session = cookies().get('session')?.value
    if (!session) return null
    
    const payload = await decrypt(session)
    
    // Additional validation
    if (!payload?.userId || !payload?.email) {
      console.warn('Invalid session payload structure')
      return null
    }
    
    return payload
  } catch (error) {
    console.error('Session retrieval error:', error)
    return null
  }
}

// ✅ SECURITY: Set session with enhanced security options
export async function setSession(userId: string, email: string, role?: string) {
  const session = await encrypt({ 
    userId, 
    email,
    role: role || 'user',
    loginTime: new Date().toISOString()
  })
  
  const cookieOptions = {
    name: 'session',
    value: session,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }
  
  cookies().set(cookieOptions)
  
  // Also set a backup auth-token for middleware compatibility
  cookies().set({
    ...cookieOptions,
    name: 'auth-token'
  })
}

// ✅ SECURITY: Proper session cleanup
export async function deleteSession() {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0, // Expire immediately
    path: '/',
  }
  
  cookies().set({ ...cookieOptions, name: 'session', value: '' })
  cookies().set({ ...cookieOptions, name: 'auth-token', value: '' })
}

// ✅ SECURITY: Enhanced authentication check with role validation
export async function isAuthenticated(request?: NextRequest, requiredRole?: string) {
  const session = request
    ? request.cookies.get('session')?.value
    : cookies().get('session')?.value
  
  if (!session) return false
  
  const payload = await decrypt(session)
  
  if (!payload?.userId) return false
  
  // Check role if required
  if (requiredRole && payload.role !== requiredRole && payload.role !== 'admin') {
    return false
  }
  
  return true
}

// ✅ SECURITY: Generate secure random tokens for various purposes
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// ✅ SECURITY: Generate CSRF token
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

// ✅ SECURITY: Validate CSRF token
export async function validateCSRFToken(token: string, sessionToken: string): Promise<boolean> {
  // Implementation depends on how you store CSRF tokens
  // This is a placeholder for the validation logic
  return token === sessionToken && token.length === 64
}