// ✅ SECURITY: Rate limiting implementation to prevent abuse
import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

// =====================================
// RATE LIMITER CONFIGURATION
// =====================================

export interface RateLimitConfig {
  uniqueTokenPerInterval?: number // Max number of unique tokens per interval
  interval?: number // Time window in milliseconds
  maxRequests?: number // Max requests per interval
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - strict limits
  auth: {
    login: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 5 }, // 5 attempts per minute
    register: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 3 }, // 3 registrations per minute
    passwordReset: { uniqueTokenPerInterval: 500, interval: 3600000, maxRequests: 3 }, // 3 resets per hour
  },
  
  // API endpoints - moderate limits
  api: {
    read: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 100 }, // 100 reads per minute
    write: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 30 }, // 30 writes per minute
    upload: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 10 }, // 10 uploads per minute
  },
  
  // Public endpoints - relaxed limits
  public: {
    products: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 200 }, // 200 requests per minute
    search: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 60 }, // 60 searches per minute
  },
  
  // Admin endpoints - balanced limits
  admin: {
    read: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 200 }, // 200 reads per minute
    write: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 50 }, // 50 writes per minute
    delete: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 20 }, // 20 deletes per minute
  },
}

// =====================================
// RATE LIMITER CLASS
// =====================================

export class RateLimiter {
  private cache: LRUCache<string, number[]>
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = {}) {
    this.config = {
      uniqueTokenPerInterval: config.uniqueTokenPerInterval || 500,
      interval: config.interval || 60000, // 1 minute default
      maxRequests: config.maxRequests || 10,
    }

    this.cache = new LRUCache<string, number[]>({
      max: this.config.uniqueTokenPerInterval!,
      ttl: this.config.interval!,
    })
  }

  /**
   * Check if request should be rate limited
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.interval!
    
    // Get existing requests for this identifier
    const requests = this.cache.get(identifier) || []
    
    // Filter out old requests outside the current window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= this.config.maxRequests!) {
      return {
        success: false,
        limit: this.config.maxRequests!,
        remaining: 0,
        reset: Math.min(...recentRequests) + this.config.interval!,
      }
    }
    
    // Add current request
    recentRequests.push(now)
    this.cache.set(identifier, recentRequests)
    
    return {
      success: true,
      limit: this.config.maxRequests!,
      remaining: this.config.maxRequests! - recentRequests.length,
      reset: now + this.config.interval!,
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.cache.delete(identifier)
  }
}

// =====================================
// MIDDLEWARE FUNCTIONS
// =====================================

/**
 * Get identifier from request (IP address or user ID)
 */
export function getIdentifier(request: NextRequest): string {
  // Try to get user ID from session
  const session = request.cookies.get('session')?.value
  if (session) {
    // In production, decode the JWT to get user ID
    // For now, use session as identifier
    return `user:${session.substring(0, 20)}`
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || 
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown'
  
  return `ip:${ip}`
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  const limiter = new RateLimiter(config)
  const identifier = getIdentifier(request)
  
  const result = await limiter.check(identifier)
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please slow down and try again later',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.reset).toISOString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }
  
  // Add rate limit headers to successful responses
  return null
}

/**
 * Apply rate limiting to an API handler
 */
export function rateLimitedHandler(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await withRateLimit(request, config)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    const response = await handler(request)
    
    // Add rate limit headers to response
    const identifier = getIdentifier(request)
    const limiter = new RateLimiter(config)
    const result = await limiter.check(identifier)
    
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining - 1).toString())
    response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())
    
    return response
  }
}

// =====================================
// DISTRIBUTED RATE LIMITING (Redis)
// =====================================

/**
 * Redis-based rate limiter for production environments
 * This requires Redis to be configured
 */
export class DistributedRateLimiter {
  private redisClient: any // Replace with actual Redis client type
  private config: RateLimitConfig

  constructor(redisClient: any, config: RateLimitConfig = {}) {
    this.redisClient = redisClient
    this.config = {
      uniqueTokenPerInterval: config.uniqueTokenPerInterval || 500,
      interval: config.interval || 60000,
      maxRequests: config.maxRequests || 10,
    }
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    const windowStart = now - this.config.interval!
    
    try {
      // Use Redis sorted set for sliding window
      await this.redisClient.zremrangebyscore(key, '-inf', windowStart)
      const count = await this.redisClient.zcard(key)
      
      if (count >= this.config.maxRequests!) {
        const oldestTimestamp = await this.redisClient.zrange(key, 0, 0, 'WITHSCORES')
        const reset = oldestTimestamp?.[1] ? parseInt(oldestTimestamp[1]) + this.config.interval! : now + this.config.interval!
        
        return {
          success: false,
          limit: this.config.maxRequests!,
          remaining: 0,
          reset,
        }
      }
      
      await this.redisClient.zadd(key, now, `${now}:${Math.random()}`)
      await this.redisClient.expire(key, Math.ceil(this.config.interval! / 1000))
      
      return {
        success: true,
        limit: this.config.maxRequests!,
        remaining: this.config.maxRequests! - count - 1,
        reset: now + this.config.interval!,
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fail open in case of Redis errors (allow request)
      return {
        success: true,
        limit: this.config.maxRequests!,
        remaining: 1,
        reset: now + this.config.interval!,
      }
    }
  }
}

// =====================================
// USAGE EXAMPLES
// =====================================

/*
// In your API route:

import { rateLimitedHandler, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export const POST = rateLimitedHandler(
  RATE_LIMIT_CONFIGS.auth.login,
  async (request: NextRequest) => {
    // Your login logic here
    return NextResponse.json({ success: true })
  }
)

// Or with custom configuration:

export const GET = rateLimitedHandler(
  { interval: 60000, maxRequests: 100 },
  async (request: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ data: [] })
  }
)
*/