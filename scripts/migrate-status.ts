// File: scripts/migrate-status.ts
// Quick migration to add product status

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateProductStatus() {
  console.log('🚀 Starting Product Status Migration...')
  
  try {
    // Get all existing products
    const existingProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log(`📊 Found ${existingProducts.length} existing products`)

    let publishedCount = 0
    let archivedCount = 0

    // Update products based on their current isActive status
    for (const product of existingProducts) {
      if (product.isActive) {
        // Active products → PUBLISHED
        await prisma.product.update({
          where: { id: product.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: product.createdAt // Use creation date as published date
          }
        })
        publishedCount++
        console.log(`✅ ${product.name} → PUBLISHED`)
      } else {
        // Inactive products → ARCHIVED
        await prisma.product.update({
          where: { id: product.id },
          data: {
            status: 'ARCHIVED',
            archivedAt: new Date()
          }
        })
        archivedCount++
        console.log(`📦 ${product.name} → ARCHIVED`)
      }
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log(`📈 ${publishedCount} products set to PUBLISHED`)
    console.log(`📦 ${archivedCount} products set to ARCHIVED`)
    
    // Verify the migration
    const statusCounts = await prisma.product.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    console.log('\n📊 Final Status Distribution:')
    statusCounts.forEach(({ status, _count }) => {
      console.log(`   ${status}: ${_count.status}`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateProductStatus()
  .then(() => {
    console.log('✨ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error)
    process.exit(1)
  })