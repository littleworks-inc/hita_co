// lib/safe-database.ts
// Wrapper around Prisma that prevents destructive operations

import { PrismaClient } from '@prisma/client'
import { dbProtection } from '../scripts/auto-backup-system'

class SafeDatabaseClient {
  private prisma: PrismaClient
  private isProtectionEnabled: boolean = true

  constructor() {
    this.prisma = new PrismaClient()
  }

  // Safe read operations - no backup needed
  async findMany(model: string, args?: any) {
    return this.prisma[model].findMany(args)
  }

  async findFirst(model: string, args?: any) {
    return this.prisma[model].findFirst(args)
  }

  async findUnique(model: string, args?: any) {
    return this.prisma[model].findUnique(args)
  }

  async count(model: string, args?: any) {
    return this.prisma[model].count(args)
  }

  async aggregate(model: string, args?: any) {
    return this.prisma[model].aggregate(args)
  }

  // Destructive operations - require backup first
  async create(model: string, args: any, skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      await this.ensureBackup('before-create')
    }
    return this.prisma[model].create(args)
  }

  async update(model: string, args: any, skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      await this.ensureBackup('before-update')
    }
    return this.prisma[model].update(args)
  }

  async updateMany(model: string, args: any, skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      await this.ensureBackup('before-updateMany')
    }
    return this.prisma[model].updateMany(args)
  }

  async delete(model: string, args: any, skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      await this.ensureBackup('before-delete')
    }
    return this.prisma[model].delete(args)
  }

  async deleteMany(model: string, args: any, skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      await this.ensureBackup('before-deleteMany')
    }
    return this.prisma[model].deleteMany(args)
  }

  async upsert(model: string, args: any, skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      await this.ensureBackup('before-upsert')
    }
    return this.prisma[model].upsert(args)
  }

  // Transaction wrapper with backup
  async $transaction(operations: any[], skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      await this.ensureBackup('before-transaction')
    }
    return this.prisma.$transaction(operations)
  }

  // Raw query wrapper with backup for modifications
  async $executeRaw(query: any, skipBackup: boolean = false) {
    if (!skipBackup && this.isProtectionEnabled) {
      const queryStr = query.toString().toLowerCase()
      const isDestructive = queryStr.includes('delete') || 
                           queryStr.includes('drop') || 
                           queryStr.includes('truncate') ||
                           queryStr.includes('alter')
      
      if (isDestructive) {
        await this.ensureBackup('before-raw-query')
      }
    }
    return this.prisma.$executeRaw(query)
  }

  async $queryRaw(query: any) {
    // Read-only operations don't need backup
    return this.prisma.$queryRaw(query)
  }

  // Direct model access (for backward compatibility)
  get exhibition() { return this.createModelProxy('exhibition') }
  get product() { return this.createModelProxy('product') }
  get category() { return this.createModelProxy('category') }
  get storeSettings() { return this.createModelProxy('storeSettings') }
  get user() { return this.createModelProxy('user') }
  get exhibitionSale() { return this.createModelProxy('exhibitionSale') }
  get productSize() { return this.createModelProxy('productSize') }
  get country() { return this.createModelProxy('country') }
  get supplier() { return this.createModelProxy('supplier') }

  private createModelProxy(modelName: string) {
    return new Proxy(this.prisma[modelName], {
      get: (target, prop) => {
        const method = target[prop]
        if (typeof method === 'function') {
          // Destructive operations
          if (['create', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(prop as string)) {
            return async (...args: any[]) => {
              if (this.isProtectionEnabled) {
                await this.ensureBackup(`before-${modelName}-${prop as string}`)
              }
              return method.apply(target, args)
            }
          }
          // Safe operations
          return method.bind(target)
        }
        return method
      }
    })
  }

  private async ensureBackup(reason: string) {
    try {
      await dbProtection.createEmergencyBackup(reason)
    } catch (error) {
      console.error('⚠️  Backup failed, aborting operation:', error)
      throw new Error('Database operation aborted due to backup failure')
    }
  }

  // Admin functions
  disableProtection() {
    console.log('⚠️  Database protection DISABLED')
    this.isProtectionEnabled = false
  }

  enableProtection() {
    console.log('🛡️  Database protection ENABLED')
    this.isProtectionEnabled = true
  }

  async disconnect() {
    return this.prisma.$disconnect()
  }
}

// Export safe database instance
export const safeDb = new SafeDatabaseClient()

// For scripts that need to disable protection temporarily
export const unsafeDb = new PrismaClient()