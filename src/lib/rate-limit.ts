// ✅ SECURITY: Universal rate limiting implementation
import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

// =====================================
// RATE LIMITER CONFIGURATION
// =====================================

export interface RateLimitConfig {
  uniqueTokenPerInterval?: number
  interval?: number
  maxRequests?: number
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
    login: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 5 },
    register: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 3 },
    passwordReset: { uniqueTokenPerInterval: 500, interval: 3600000, maxRequests: 3 },
  },
  
  // API endpoints - moderate limits
  api: {
    read: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 100 },
    write: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 30 },
    upload: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 10 },
  },
  
  // Public endpoints - relaxed limits
  public: {
    products: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 200 },
    search: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 60 },
  },
  
  // Admin endpoints - balanced limits
  admin: {
    read: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 200 },
    write: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 50 },
    delete: { uniqueTokenPerInterval: 500, interval: 60000, maxRequests: 20 },
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
      interval: config.interval || 60000,
      maxRequests: config.maxRequests || 10,
    }

    this.cache = new LRUCache<string, number[]>({
      max: this.config.uniqueTokenPerInterval!,
      ttl: this.config.interval!,
    })
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.interval!
    
    const requests = this.cache.get(identifier) || []
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)
    
    if (recentRequests.length >= this.config.maxRequests!) {
      return {
        success: false,
        limit: this.config.maxRequests!,
        remaining: 0,
        reset: Math.min(...recentRequests) + this.config.interval!,
      }
    }
    
    recentRequests.push(now)
    this.cache.set(identifier, recentRequests)
    
    return {
      success: true,
      limit: this.config.maxRequests!,
      remaining: this.config.maxRequests! - recentRequests.length,
      reset: now + this.config.interval!,
    }
  }

  reset(identifier: string): void {
    this.cache.delete(identifier)
  }
}

// =====================================
// MIDDLEWARE FUNCTIONS
// =====================================

export function getIdentifier(request: NextRequest): string {
  const session = request.cookies.get('session')?.value
  if (session) {
    return `user:${session.substring(0, 20)}`
  }
  
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || 
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown'
  
  return `ip:${ip}`
}

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
  
  return null
}

// =====================================
// UNIVERSAL RATE LIMIT WRAPPER
// =====================================

/**
 * Universal rate limit wrapper that works with any route handler signature
 * This is the ONLY function you need to use for ALL your routes
 */
export function withRateLimiting<T extends any[], R>(
  config: RateLimitConfig
): (handler: (...args: T) => Promise<R>) => (...args: T) => Promise<R | NextResponse> {
  return (handler: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R | NextResponse> => {
      // Extract the request object (always the first argument)
      const request = args[0] as NextRequest
      
      // Check rate limit
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
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(result.reset).toISOString(),
              'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            },
          }
        ) as R
      }
      
      // Call the original handler
      const response = await handler(...args)
      
      // Add rate limit headers if response is NextResponse
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining - 1).toString())
        response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())
      }
      
      return response
    }
  }
}

// =====================================
// DISTRIBUTED RATE LIMITING (Redis)
// =====================================

export class DistributedRateLimiter {
  private redisClient: any
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
      return {
        success: true,
        limit: this.config.maxRequests!,
        remaining: 1,
        reset: now + this.config.interval!,
      }
    }
  }
}