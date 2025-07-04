// scripts/auto-backup-system.ts
// Automatic backup system that runs before any database operations

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

class DatabaseProtectionSystem {
  private backupDir = path.join(process.cwd(), 'backups')
  
  constructor() {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  async createEmergencyBackup(reason: string = 'emergency'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(this.backupDir, `emergency-backup-${timestamp}.json`)
    
    try {
      console.log('🚨 Creating emergency backup...')
      
      // Export ALL critical data
      const backupData = {
        timestamp: new Date().toISOString(),
        reason,
        data: {
          exhibitions: await prisma.exhibition.findMany({
            include: {
              products: true,
              sales: true
            }
          }),
          products: await prisma.product.findMany({
            include: {
              productSizes: true,
              category: true,
              country: true,
              supplier: true
            }
          }),
          categories: await prisma.category.findMany(),
          countries: await prisma.country.findMany(),
          suppliers: await prisma.supplier.findMany(),
          storeSettings: await prisma.storeSettings.findMany(),
          users: await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, isActive: true }
          })
        },
        counts: {
          exhibitions: await prisma.exhibition.count(),
          products: await prisma.product.count(),
          categories: await prisma.category.count(),
          users: await prisma.user.count()
        }
      }
      
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
      
      console.log(`✅ Emergency backup created: ${backupFile}`)
      console.log(`📊 Backed up:`)
      console.log(`   - ${backupData.counts.exhibitions} exhibitions`)
      console.log(`   - ${backupData.counts.products} products`)
      console.log(`   - ${backupData.counts.categories} categories`)
      
      return backupFile
      
    } catch (error) {
      console.error('❌ Emergency backup failed:', error)
      throw new Error(`Backup failed: ${error}`)
    }
  }

  async getDatabaseInfo(): Promise<any> {
    try {
      console.log('📊 Getting current database information...')
      
      const info = {
        exhibitions: await prisma.exhibition.findMany({
          select: {
            id: true,
            title: true,
            location: true,
            startDate: true,
            endDate: true,
            isActive: true
          }
        }),
        products: await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPriceUSD: true,
            stockQuantity: true,
            category: { select: { name: true } },
            status: true
          }
        }),
        categories: await prisma.category.findMany({
          select: { id: true, name: true, slug: true }
        }),
        storeSettings: await prisma.storeSettings.findMany(),
        counts: {
          exhibitions: await prisma.exhibition.count(),
          products: await prisma.product.count(),
          categories: await prisma.category.count(),
          activeProducts: await prisma.product.count({ where: { status: 'PUBLISHED' } })
        }
      }
      
      console.log('Database Summary:')
      console.log(`- Exhibitions: ${info.counts.exhibitions}`)
      console.log(`- Products: ${info.counts.products} (${info.counts.activeProducts} active)`)
      console.log(`- Categories: ${info.counts.categories}`)
      
      return info
      
    } catch (error) {
      console.error('❌ Failed to get database info:', error)
      throw error
    }
  }

  async validateBeforeChanges(): Promise<boolean> {
    try {
      const info = await this.getDatabaseInfo()
      
      // Check if there's valuable data that could be lost
      const hasValuableData = (
        info.counts.exhibitions > 1 ||  // More than just sample data
        info.counts.products > 3 ||     // More than just sample products
        info.counts.categories > 3      // More than just sample categories
      )
      
      if (hasValuableData) {
        console.log('⚠️  WARNING: Database contains valuable data!')
        console.log('Creating automatic backup before proceeding...')
        await this.createEmergencyBackup('pre-modification-backup')
        return true
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Validation failed:', error)
      return false
    }
  }

  async restoreFromBackup(backupFile: string): Promise<void> {
    try {
      console.log(`🔄 Restoring from backup: ${backupFile}`)
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`)
      }
      
      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
      
      console.log('🧹 Clearing current data...')
      // Clear in correct order to avoid foreign key constraints
      await prisma.exhibitionSale.deleteMany()
      await prisma.exhibitionProduct.deleteMany()
      await prisma.exhibition.deleteMany()
      await prisma.productSize.deleteMany()
      await prisma.product.deleteMany()
      
      console.log('📥 Restoring data...')
      
      // Restore exhibitions
      for (const exhibition of backupData.data.exhibitions) {
        await prisma.exhibition.create({
          data: {
            id: exhibition.id,
            title: exhibition.title,
            description: exhibition.description,
            location: exhibition.location,
            startDate: new Date(exhibition.startDate),
            endDate: new Date(exhibition.endDate),
            participationFee: exhibition.participationFee,
            images: exhibition.images,
            isActive: exhibition.isActive
          }
        })
      }
      
      // Restore products
      for (const product of backupData.data.products) {
        await prisma.product.create({
          data: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description,
            sellingPriceUSD: product.sellingPriceUSD,
            stockQuantity: product.stockQuantity,
            categoryId: product.categoryId,
            countryId: product.countryId,
            supplierId: product.supplierId,
            // Add other required fields based on your schema
          }
        })
      }
      
      console.log('✅ Restore completed successfully!')
      
    } catch (error) {
      console.error('❌ Restore failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const dbProtection = new DatabaseProtectionSystem()

// Emergency functions for immediate use
export async function emergencyBackup() {
  return await dbProtection.createEmergencyBackup('manual-emergency-backup')
}

export async function getDatabaseInfo() {
  return await dbProtection.getDatabaseInfo()
}

// Auto-run backup if this script is executed directly
if (require.main === module) {
  emergencyBackup()
    .then((backupFile) => {
      console.log(`🎉 Emergency backup completed: ${backupFile}`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Emergency backup failed:', error)
      process.exit(1)
    })
}