// src/lib/db.ts
// 🚨 CRITICAL FIX: Proper Prisma setup for Prisma Accelerate (db.prisma.io)
// Prevents "too many connections" errors

import { PrismaClient } from '@prisma/client'

// Global singleton storage - critical for serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with minimal configuration
// Prisma Accelerate handles connection pooling automatically
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// ✅ SINGLETON PATTERN - Essential for serverless environments
// Reuse the same client instance across requests
export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

// Always save to global for warm instances to reuse
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = db
}

// Alias for compatibility
export const prisma = db

export default db
