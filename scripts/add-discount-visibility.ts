// File: scripts/add-discount-visibility.ts
// Migration script to add showDiscountToCustomers field

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addDiscountVisibilityField() {
  console.log('🚀 Adding discount visibility control to Product model...')
  
  try {
    // First, check if the field already exists by trying to query it
    try {
      await prisma.$queryRaw`
        SELECT "showDiscountToCustomers" 
        FROM products 
        LIMIT 1
      `
      console.log('✅ Field already exists, skipping migration')
      return
    } catch (error) {
      // Field doesn't exist, proceed with adding it
      console.log('📝 Field not found, adding showDiscountToCustomers...')
    }

    // Add the new field with default value
    await prisma.$executeRaw`
      ALTER TABLE products 
      ADD COLUMN "showDiscountToCustomers" BOOLEAN DEFAULT false NOT NULL
    `

    console.log('✅ Successfully added showDiscountToCustomers field')

    // Update existing products with discounts > 0 to show discounts by default
    const updatedProducts = await prisma.product.updateMany({
      where: {
        discountPercentage: {
          gt: 0
        }
      },
      data: {
        showDiscountToCustomers: true
      }
    })

    console.log(`📊 Updated ${updatedProducts.count} products with existing discounts to show discounts to customers`)

    // Verify the update
    const productsWithDiscounts = await prisma.product.count({
      where: {
        discountPercentage: {
          gt: 0
        }
      }
    })

    const productsShowingDiscounts = await prisma.product.count({
      where: {
        showDiscountToCustomers: true
      }
    })

    console.log('\n📈 Migration Summary:')
    console.log(`   Products with discounts: ${productsWithDiscounts}`)
    console.log(`   Products showing discounts to customers: ${productsShowingDiscounts}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
addDiscountVisibilityField()
  .then(() => {
    console.log('✨ Discount visibility migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })

// 🚀 USAGE INSTRUCTIONS:
// 
// 1. Save this file as: scripts/add-discount-visibility.ts
// 
// 2. Run the migration:
//    npx tsx scripts/add-discount-visibility.ts
// 
// 3. Update your Prisma schema (add the field to Product model):
//    showDiscountToCustomers Boolean @default(false)
// 
// 4. Generate Prisma client:
//    npx prisma generate
// 
// 5. Push schema changes:
//    npx prisma db push