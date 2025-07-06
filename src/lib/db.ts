// src/lib/db.ts
// ✅ FIXED: TypeScript-compatible database configuration for Prisma Accelerate
// Resolves connection pool exhaustion without TypeScript errors

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ✅ Build-time detection
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY

// ✅ TypeScript-compatible Prisma Client configuration
function createPrismaClient(): PrismaClient {
  // Use build-specific URL with reduced connections during build
  const databaseUrl = isBuildTime 
    ? process.env.DATABASE_URL?.includes('connection_limit') 
      ? process.env.DATABASE_URL.replace(/connection_limit=\d+/, 'connection_limit=2')
      : `${process.env.DATABASE_URL}&connection_limit=2&pool_timeout=10`
    : process.env.DATABASE_URL

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    },
    
    // ✅ Only use officially supported configuration options
    log: isBuildTime ? ['error'] : ['error', 'warn'],
    
    // ✅ REMOVED: __internal configuration to fix TypeScript error
    // Connection management is handled via URL parameters instead
  })
}

// ✅ Singleton with build optimizations
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// ✅ Build-safe database operations
export const buildSafeDb = {
  /**
   * Execute database operation with timeout and fallback
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: T,
    timeoutMs: number = 20000
  ): Promise<T | null> {
    if (!isBuildTime) {
      // Normal operation during runtime
      return await operation()
    }

    try {
      // Build-time operation with timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Build timeout')), timeoutMs)
        )
      ])
      
      return result
    } catch (error) {
      console.warn('⚠️  Build operation failed:', error instanceof Error ? error.message : error)
      return fallback || null
    }
  },

  /**
   * Get store settings with fallback
   */
  async getStoreSettings() {
    return this.execute(
      () => db.storeSetting.findFirst({
        where: { id: 'default' },
        select: {
          id: true,
          storeName: true,
          tagline: true,
          currency: true
        }
      }),
      {
        id: 'default',
        storeName: 'Hita&Co',
        tagline: 'Premium fashion and accessories',
        currency: 'USD'
      }
    )
  },

  /**
   * Get categories with fallback
   */
  async getCategories() {
    return this.execute(
      () => db.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          parentId: true
        },
        take: 20
      }),
      []
    )
  },

  /**
   * Get countries with fallback
   */
  async getCountries() {
    return this.execute(
      () => db.country.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          currency: true,
          currencySymbol: true
        },
        take: 50
      }),
      []
    )
  },

  /**
   * Get published products with fallback
   */
  async getProducts() {
    return this.execute(
      () => db.product.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          name: true,
          sku: true,
          sellingPriceUSD: true,
          images: true
        },
        take: 10
      }),
      []
    )
  },

  /**
   * Batch operations with automatic spacing
   */
  async batchOperations<T>(operations: Array<() => Promise<T>>): Promise<Array<T | null>> {
    const results: Array<T | null> = []
    
    for (let i = 0; i < operations.length; i++) {
      const result = await this.execute(operations[i])
      results.push(result)
      
      // Space out operations during build to prevent connection spam
      if (isBuildTime && i < operations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
    
    return results
  }
}

// ✅ Connection utilities
export const dbUtils = {
  /**
   * Test database connection
   */
  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      await db.$queryRaw`SELECT 1`
      const latency = Date.now() - startTime
      
      return { 
        success: true, 
        latency 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Get connection status for monitoring
   */
  async getConnectionStatus(): Promise<{
    connected: boolean
    databaseName?: string
    version?: string
  }> {
    try {
      const result = await db.$queryRaw<Array<{ current_database: string; version: string }>>`
        SELECT current_database(), version()
      `
      
      return {
        connected: true,
        databaseName: result[0]?.current_database,
        version: result[0]?.version?.split(' ')[0] // Just get PostgreSQL version
      }
    } catch (error) {
      return { connected: false }
    }
  },

  /**
   * Gracefully disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await db.$disconnect()
      console.log('✅ Database connection closed')
    } catch (error) {
      console.warn('⚠️  Error disconnecting:', error)
    }
  }
}

// ✅ Auto-optimization during build
if (isBuildTime) {
  console.log('🔧 Build-time database optimizations active')
  
  // Pre-warm connection during build (with error handling)
  setTimeout(async () => {
    try {
      const status = await dbUtils.testConnection()
      if (status.success) {
        console.log(`✅ Prisma Accelerate connected (${status.latency}ms)`)
      } else {
        console.warn('⚠️  Connection test failed:', status.error)
      }
    } catch (error) {
      console.warn('⚠️  Connection pre-warm failed:', error)
    }
  }, 1000)
}

// ✅ Graceful shutdown handlers
if (typeof process !== 'undefined') {
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing database connections...`)
    await dbUtils.disconnect()
    process.exit(0)
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  
  // Handle unhandled promise rejections without crashing
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason)
    // Don't exit process in production
  })
}

export default db