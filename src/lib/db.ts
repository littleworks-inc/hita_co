// src/lib/db.ts
// 🚨 CRITICAL FIX: Proper Prisma singleton for serverless (Netlify)
// Prevents "too many connections" errors

import { PrismaClient } from '@prisma/client'

// Global singleton storage
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Environment detection
const isServerless = process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined
const isDevelopment = process.env.NODE_ENV === 'development'

// ✅ CRITICAL: Optimized connection string for serverless
function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''

  // Remove any existing query params
  const cleanUrl = baseUrl.split('?')[0]

  // Serverless needs minimal connections
  if (isServerless) {
    const params = [
      'connection_limit=1',      // Single connection per function instance
      'pool_timeout=10',         // Quick timeout
      'connect_timeout=10',      // Quick connect timeout
    ].join('&')
    return `${cleanUrl}?${params}`
  }

  // Development can have more connections
  if (isDevelopment) {
    return baseUrl
  }

  // Production non-serverless
  const params = [
    'connection_limit=3',
    'pool_timeout=20',
    'connect_timeout=10',
  ].join('&')
  return `${cleanUrl}?${params}`
}

// ✅ Create Prisma client with optimized settings
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: getOptimizedDatabaseUrl() }
    },
    log: isDevelopment ? ['error', 'warn'] : ['error'],
  })
}

// ✅ SINGLETON PATTERN - Works in both serverless and traditional environments
// In serverless, globalThis persists within the same container/warm instance
export const db = globalForPrisma.prisma ?? createPrismaClient()

// ✅ CRITICAL FIX: Always save to global in non-production OR production
// This ensures warm serverless instances reuse the connection
if (process.env.NODE_ENV !== 'production') {
  // Development: hot reloading creates new modules
  globalForPrisma.prisma = db
} else {
  // Production: save for warm serverless instances
  globalForPrisma.prisma = db
}

// ✅ Prisma client alias for compatibility
export const prisma = db

export default db
