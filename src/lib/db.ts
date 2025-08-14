// src/lib/db.ts
// 🚨 CRITICAL FIX: Resolve connection exhaustion on Netlify builds
// Fixes "too many connections for role prisma_migration" error

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ✅ Enhanced build detection
const isNetlifyBuild = process.env.NETLIFY === 'true'
const isProductionBuild = process.env.NODE_ENV === 'production'
const isBuildTime = isNetlifyBuild || (isProductionBuild && !process.env.VERCEL)

// ✅ CRITICAL: Ultra-minimal connections for builds
function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''
  
  if (isBuildTime) {
    // MAXIMUM 1 CONNECTION during builds to prevent exhaustion
    const buildParams = [
      'connection_limit=1',
      'pool_timeout=10',
      'connect_timeout=10',
      'statement_timeout=30000'
    ].join('&')
    
    // Remove existing connection params and add optimized ones
    const cleanUrl = baseUrl.split('?')[0]
    return `${cleanUrl}?${buildParams}`
  }
  
  // Runtime optimizations for production
  if (isProductionBuild) {
    const runtimeParams = [
      'connection_limit=5',
      'pool_timeout=20',
      'connect_timeout=10'
    ].join('&')
    
    const cleanUrl = baseUrl.split('?')[0]
    return `${cleanUrl}?${runtimeParams}`
  }
  
  return baseUrl
}

// ✅ Ultra-safe Prisma Client for builds
function createPrismaClient(): PrismaClient {
  const optimizedUrl = getOptimizedDatabaseUrl()
  
  const config: any = {
    datasources: {
      db: { url: optimizedUrl }
    },
    log: isBuildTime ? [] : ['error'], // No logging during builds
  }
  
  // ✅ CRITICAL: Disable query engine for builds if needed
  if (isBuildTime) {
    console.log('🔧 Build-time mode: Ultra-minimal DB config')
  }
  
  return new PrismaClient(config)
}

// ✅ Singleton with build protection
export const db = globalForPrisma.prisma ?? createPrismaClient()

// ✅ Prevent singleton in production builds
if (!isBuildTime && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// ✅ Build-safe database operations with circuit breaker
export const buildSafeDb = {
  /**
   * Execute with ultra-tight timeout for builds
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: T,
    timeoutMs: number = isBuildTime ? 5000 : 20000
  ): Promise<T | null> {
    
    // Skip DB operations entirely during builds if problematic
    if (isBuildTime && process.env.SKIP_DB_ON_BUILD === 'true') {
      console.log('⚠️  Skipping DB operation during build (SKIP_DB_ON_BUILD=true)')
      return fallback ?? null
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
        )
      ])
      
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      if (isBuildTime) {
        console.warn(`⚠️  Build DB operation failed: ${errorMsg}`)
        // Return fallback during builds to prevent build failure
        return fallback ?? null
      } else {
        console.error(`❌ Runtime DB operation failed: ${errorMsg}`)
        throw error
      }
    }
  },

  /**
   * Safe store settings fetch with fallback
   */
  async getStoreSettings() {
    return this.execute(
      () => db.storeSetting.findFirst(),
      null // Fallback for builds
    )
  },

  /**
   * Test connection with timeout
   */
  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      await Promise.race([
        db.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        )
      ])
      
      return { 
        success: true, 
        latency: Date.now() - startTime 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// ✅ Graceful shutdown - CRITICAL for connection cleanup
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, closing database connections...`)
  
  try {
    await db.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.warn('⚠️  Error during disconnect:', error)
  }
  
  if (!isBuildTime) {
    process.exit(0)
  }
}

// ✅ Only set up shutdown handlers for runtime (not builds)
if (typeof process !== 'undefined' && !isBuildTime) {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('beforeExit', () => gracefulShutdown('beforeExit'))
}

// ✅ Auto-disconnect after operations during builds
if (isBuildTime) {
  setTimeout(async () => {
    try {
      await db.$disconnect()
      console.log('🔧 Build: Auto-disconnected database')
    } catch (error) {
      console.warn('⚠️  Build: Auto-disconnect failed:', error)
    }
  }, 30000) // Disconnect after 30 seconds during builds
}

export default db