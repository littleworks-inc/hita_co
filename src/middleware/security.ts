// ✅ SECURITY: Comprehensive security middleware
import { NextRequest, NextResponse } from 'next/server'
import { getIdentifier, withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { generateCSRFToken, validateCSRFToken } from '@/lib/auth'
import crypto from 'crypto'

// =====================================
// SECURITY HEADERS
// =====================================

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy (formerly Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  
  // HSTS (HTTP Strict Transport Security) for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.mistral.ai",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ]
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  return response
}

// =====================================
// CSRF PROTECTION
// =====================================

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static readonly CSRF_HEADER = 'X-CSRF-Token'
  private static readonly CSRF_COOKIE = 'csrf-token'
  
  /**
   * Generate and set CSRF token
   */
  static async generateToken(response: NextResponse): Promise<string> {
    const token = generateCSRFToken()
    
    // Set token in cookie
    response.cookies.set({
      name: this.CSRF_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })
    
    return token
  }
  
  /**
   * Validate CSRF token from request
   */
  static async validateToken(request: NextRequest): Promise<boolean> {
    // Skip CSRF for GET requests
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return true
    }
    
    const headerToken = request.headers.get(this.CSRF_HEADER)
    const cookieToken = request.cookies.get(this.CSRF_COOKIE)?.value
    
    if (!headerToken || !cookieToken) {
      return false
    }
    
    return validateCSRFToken(headerToken, cookieToken)
  }
}

// =====================================
// REQUEST VALIDATION
// =====================================

/**
 * Validate and sanitize request
 */
export async function validateRequest(request: NextRequest): Promise<{
  valid: boolean
  error?: string
}> {
  // Check request size
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (size > maxSize) {
      return { valid: false, error: 'Request body too large' }
    }
  }
  
  // Validate content type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    
    if (!contentType) {
      return { valid: false, error: 'Content-Type header is required' }
    }
    
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ]
    
    const isAllowed = allowedTypes.some(type => contentType.includes(type))
    
    if (!isAllowed) {
      return { valid: false, error: 'Invalid Content-Type' }
    }
  }
  
  // Check for SQL injection patterns in URL
  const url = request.url
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
    /(--|\||;|\/\*|\*\/)/g,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
  ]
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(url)) {
      return { valid: false, error: 'Potential SQL injection detected' }
    }
  }
  
  return { valid: true }
}

// =====================================
// IP BLOCKING
// =====================================

/**
 * IP-based blocking for suspicious activity
 */
export class IPBlocker {
  private static blockedIPs = new Set<string>()
  private static suspiciousActivity = new Map<string, number>()
  
  /**
   * Check if IP is blocked
   */
  static isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip)
  }
  
  /**
   * Block an IP address
   */
  static block(ip: string, duration: number = 3600000): void {
    this.blockedIPs.add(ip)
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip)
    }, duration)
  }
  
  /**
   * Record suspicious activity
   */
  static recordSuspiciousActivity(ip: string): void {
    const count = (this.suspiciousActivity.get(ip) || 0) + 1
    this.suspiciousActivity.set(ip, count)
    
    // Auto-block after threshold
    if (count >= 10) {
      this.block(ip)
      this.suspiciousActivity.delete(ip)
    }
    
    // Clear count after 1 hour
    setTimeout(() => {
      this.suspiciousActivity.delete(ip)
    }, 3600000)
  }
}

// =====================================
// AUDIT LOGGING
// =====================================

/**
 * Security audit logging
 */
export class SecurityAuditLog {
  static async log(event: {
    type: 'auth_failure' | 'rate_limit' | 'csrf_failure' | 'blocked_ip' | 'suspicious_activity'
    ip: string
    userId?: string
    details?: any
  }): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
      requestId: crypto.randomBytes(16).toString('hex'),
    }
    
    // In production, send to logging service
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry))
    
    // You could also save to database
    // await db.securityLog.create({ data: logEntry })
  }
}

// =====================================
// MAIN SECURITY MIDDLEWARE
// =====================================

/**
 * Comprehensive security middleware
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse> {
  const ip = getIdentifier(request).replace('ip:', '')
  
  // 1. Check IP blocking
  if (IPBlocker.isBlocked(ip)) {
    await SecurityAuditLog.log({
      type: 'blocked_ip',
      ip,
      details: { url: request.url },
    })
    
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  // 2. Validate request
  const validation = await validateRequest(request)
  if (!validation.valid) {
    IPBlocker.recordSuspiciousActivity(ip)
    
    await SecurityAuditLog.log({
      type: 'suspicious_activity',
      ip,
      details: { error: validation.error, url: request.url },
    })
    
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    )
  }
  
  // 3. Apply rate limiting based on route
  let rateLimitConfig = RATE_LIMIT_CONFIGS.public.products
  
  const { pathname } = new URL(request.url)
  
  if (pathname.startsWith('/api/auth/login')) {
    rateLimitConfig = RATE_LIMIT_CONFIGS.auth.login
  } else if (pathname.startsWith('/api/auth/register')) {
    rateLimitConfig = RATE_LIMIT_CONFIGS.auth.register
  } else if (pathname.startsWith('/api/admin')) {
    rateLimitConfig = request.method === 'GET' 
      ? RATE_LIMIT_CONFIGS.admin.read 
      : RATE_LIMIT_CONFIGS.admin.write
  }
  
  const rateLimitResponse = await withRateLimit(request, rateLimitConfig)
  if (rateLimitResponse) {
    await SecurityAuditLog.log({
      type: 'rate_limit',
      ip,
      details: { url: request.url },
    })
    return rateLimitResponse
  }
  
  // 4. CSRF protection for state-changing operations
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const csrfValid = await CSRFProtection.validateToken(request)
    
    if (!csrfValid && pathname.startsWith('/api/admin')) {
      await SecurityAuditLog.log({
        type: 'csrf_failure',
        ip,
        details: { url: request.url, method: request.method },
      })
      
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
  }
  
  // Continue with request
  return NextResponse.next()
}

// =====================================
// EXPORT FOR USE IN MIDDLEWARE
// =====================================

export default {
  applySecurityHeaders,
  CSRFProtection,
  validateRequest,
  IPBlocker,
  SecurityAuditLog,
  securityMiddleware,
}