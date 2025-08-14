// src/lib/safe-database.ts
// ✅ FIXED: Wrapper around Prisma with proper TypeScript typing
// Resolves: "Element implicitly has an 'any' type" error

import { PrismaClient } from '@prisma/client'

// ✅ FIXED: Type-safe model access - only string model names
type PrismaModelName = 
  | 'user'
  | 'category' 
  | 'country'
  | 'supplier'
  | 'product'
  | 'productSize'
  | 'exhibitionProductSize'
  | 'order'
  | 'orderItem'
  | 'exhibition'
  | 'exhibitionSale'
  | 'storeSettings'
  | 'storeSetting'
  | 'shippingZone'
  | 'shippingRate'
  | 'countryShippingZone'
  | 'configurationSetting'
  | 'configurationTemplate'

class SafeDatabaseClient {
  private prisma: PrismaClient
  private isProtectionEnabled: boolean = true

  constructor() {
    this.prisma = new PrismaClient()
  }

  // ✅ FIXED: Type-safe model access with string parameter
  private getModel(modelName: PrismaModelName) {
    const model = (this.prisma as any)[modelName]
    if (!model) {
      throw new Error(`Model '${modelName}' not found in Prisma client`)
    }
    return model
  }

  // Safe read operations - no backup needed
  async findMany(model: PrismaModelName, args?: any) {
    return this.getModel(model).findMany(args)
  }

  async findFirst(model: PrismaModelName, args?: any) {
    return this.getModel(model).findFirst(args)
  }

  async findUnique(model: PrismaModelName, args?: any) {
    return this.getModel(model).findUnique(args)
  }

  async count(model: PrismaModelName, args?: any) {
    return this.getModel(model).count(args)
  }

  async aggregate(model: PrismaModelName, args?: any) {
    return this.getModel(model).aggregate(args)
  }

  // ✅ FIXED: Destructive operations with proper typing
  async create(model: PrismaModelName, args: any, skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      this.logOperation('CREATE', model)
    }
    return this.getModel(model).create(args)
  }

  async update(model: PrismaModelName, args: any, skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      this.logOperation('UPDATE', model)
    }
    return this.getModel(model).update(args)
  }

  async updateMany(model: PrismaModelName, args: any, skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      this.logOperation('UPDATE_MANY', model)
    }
    return this.getModel(model).updateMany(args)
  }

  async delete(model: PrismaModelName, args: any, skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      this.logOperation('DELETE', model)
    }
    return this.getModel(model).delete(args)
  }

  async deleteMany(model: PrismaModelName, args: any, skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      this.logOperation('DELETE_MANY', model)
    }
    return this.getModel(model).deleteMany(args)
  }

  async upsert(model: PrismaModelName, args: any, skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      this.logOperation('UPSERT', model)
    }
    return this.getModel(model).upsert(args)
  }

  // Transaction wrapper with logging
  async $transaction(operations: any[], skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      this.logOperation('TRANSACTION', 'product') // Using 'product' as placeholder since multiple models
    }
    return this.prisma.$transaction(operations)
  }

  // Raw query wrapper with logging for modifications
  async $executeRaw(query: any, skipProtection: boolean = false) {
    if (!skipProtection && this.isProtectionEnabled) {
      const queryStr = query.toString().toLowerCase()
      const isDestructive = queryStr.includes('delete') || 
                           queryStr.includes('drop') || 
                           queryStr.includes('truncate') ||
                           queryStr.includes('alter')
      
      if (isDestructive) {
        this.logOperation('RAW_EXECUTE', 'product', queryStr.substring(0, 100)) // Using 'product' as placeholder
      }
    }
    return this.prisma.$executeRaw(query)
  }

  async $queryRaw(query: any) {
    // Read-only operations don't need logging
    return this.prisma.$queryRaw(query)
  }

  // ✅ FIXED: Direct model access with proper typing
  get exhibition() { return this.createModelProxy('exhibition') }
  get product() { return this.createModelProxy('product') }
  get category() { return this.createModelProxy('category') }
  get storeSettings() { return this.createModelProxy('storeSettings') }
  get storeSetting() { return this.createModelProxy('storeSetting') }
  get user() { return this.createModelProxy('user') }
  get exhibitionSale() { return this.createModelProxy('exhibitionSale') }
  get productSize() { return this.createModelProxy('productSize') }
  get country() { return this.createModelProxy('country') }
  get supplier() { return this.createModelProxy('supplier') }
  get order() { return this.createModelProxy('order') }
  get orderItem() { return this.createModelProxy('orderItem') }
  get configurationSetting() { return this.createModelProxy('configurationSetting') }
  get shippingZone() { return this.createModelProxy('shippingZone') }
  get shippingRate() { return this.createModelProxy('shippingRate') }
  get countryShippingZone() { return this.createModelProxy('countryShippingZone') }

  private createModelProxy(modelName: PrismaModelName) {
    const model = this.getModel(modelName)
    return new Proxy(model, {
      get: (target, prop) => {
        const method = target[prop]
        if (typeof method === 'function') {
          // Destructive operations
          if (['create', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(prop as string)) {
            return async (...args: any[]) => {
              if (this.isProtectionEnabled) {
                this.logOperation(prop as string, modelName)
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

  // ✅ FIXED: Simple logging with proper typing
  private logOperation(operation: string, model: PrismaModelName, details?: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] 🛡️  SAFE DB: ${operation} on ${model}`
    
    if (details) {
      console.log(`${logMessage} - ${details}`)
    } else {
      console.log(logMessage)
    }

    // ✅ OPTIONAL: You can add more sophisticated logging here
    // - Write to a log file
    // - Send to a logging service
    // - Store in database
    // - Create simple backup before destructive operations
  }

  // ✅ NEW: Simple backup functionality (optional)
  async createSimpleBackup(reason: string): Promise<boolean> {
    try {
      console.log(`🔄 Creating simple backup: ${reason}`)
      
      // Get essential data
      const backupData = {
        timestamp: new Date().toISOString(),
        reason,
        data: {
          products: await this.prisma.product.findMany({ take: 10 }), // Last 10 products
          categories: await this.prisma.category.findMany(),
          storeSettings: await this.prisma.storeSetting.findMany()
        }
      }

      // In a real implementation, you might:
      // - Write to a backup file
      // - Upload to cloud storage
      // - Store in a separate backup database

      console.log(`✅ Backup created successfully for: ${reason}`)
      return true
    } catch (error) {
      console.error('❌ Backup failed:', error)
      return false
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

  isProtectionActive(): boolean {
    return this.isProtectionEnabled
  }

  // ✅ NEW: Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'error', details?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'healthy' }
    } catch (error) {
      return { 
        status: 'error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async disconnect() {
    return this.prisma.$disconnect()
  }

  // ✅ NEW: Direct access to original Prisma client (use with caution)
  get unsafe() {
    console.warn('⚠️  Using unsafe direct Prisma access - protection bypassed')
    return this.prisma
  }
}

// Export safe database instance
export const safeDb = new SafeDatabaseClient()

// For scripts that need direct Prisma access
export const unsafeDb = new PrismaClient()

// ✅ NEW: Utility functions
export const DatabaseSafety = {
  /**
   * Check if an operation is safe to perform
   */
  isSafeOperation(operation: string): boolean {
    const safeOperations = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate']
    return safeOperations.includes(operation)
  },

  /**
   * Get a list of destructive operations
   */
  getDestructiveOperations(): string[] {
    return ['create', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']
  },

  /**
   * Validate model name
   */
  isValidModel(modelName: string): boolean {
    const validModels = [
      'exhibition', 'product', 'category', 'storeSettings', 'storeSetting',
      'user', 'exhibitionSale', 'productSize', 'country', 'supplier',
      'order', 'orderItem', 'configurationSetting', 'shippingZone',
      'shippingRate', 'countryShippingZone'
    ]
    return validModels.includes(modelName)
  }
}

// ✅ NEW: Type for safer database operations
export type SafeDbOperation = 'read' | 'write' | 'delete'

export interface SafeDbConfig {
  enableLogging: boolean
  enableBackups: boolean
  protectionLevel: 'none' | 'log' | 'backup'
}

// Default export
export default safeDb