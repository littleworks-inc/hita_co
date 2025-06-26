// ✅ scripts/add-return-policy-fields.ts
// Safe migration script to add return policy fields

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addReturnPolicyFields() {
  console.log('🚀 Adding return policy fields to StoreSetting model...')
  
  try {
    // Check if fields already exist
    console.log('📝 Checking if return policy fields already exist...')
    
    try {
      await prisma.$queryRaw`
        SELECT "returnPeriodDays" 
        FROM store_settings 
        LIMIT 1
      `
      console.log('✅ Return policy fields already exist, skipping migration')
      return
    } catch (error) {
      console.log('📝 Fields not found, proceeding with migration...')
    }

    // Add the new fields
    console.log('🔧 Adding return policy fields...')
    
    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "returnPeriodDays" INTEGER DEFAULT 30
    `

    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "returnPolicyUrl" TEXT
    `

    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "hasRestockingFee" BOOLEAN DEFAULT false
    `

    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "restockingFeePercentage" DOUBLE PRECISION DEFAULT 0
    `

    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "returnPolicyDescription" TEXT
    `

    console.log('✅ Successfully added all return policy fields')

    // Update existing store settings with defaults
    console.log('📊 Setting default values for existing store settings...')
    
    const updated = await prisma.storeSetting.updateMany({
      where: {},
      data: {
        returnPeriodDays: 30,
        hasRestockingFee: false,
        restockingFeePercentage: 0,
        returnPolicyDescription: 'We offer hassle-free returns within 30 days of purchase. Items must be in original condition with tags attached.'
      }
    })

    console.log(`📈 Updated ${updated.count} store setting records`)

    // Verify the migration
    const storeSettings = await prisma.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        returnPeriodDays: true,
        hasRestockingFee: true,
        restockingFeePercentage: true,
        returnPolicyDescription: true
      }
    })

    console.log('\n📈 Migration Summary:')
    console.log('   Return Period Days:', storeSettings?.returnPeriodDays)
    console.log('   Has Restocking Fee:', storeSettings?.hasRestockingFee)
    console.log('   Restocking Fee %:', storeSettings?.restockingFeePercentage)
    console.log('   Policy Description:', storeSettings?.returnPolicyDescription ? 'Set' : 'Not set')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
addReturnPolicyFields()
  .then(() => {
    console.log('\n✨ Return policy migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your Prisma schema with the new fields')
    console.log('2. Run: npx prisma generate')
    console.log('3. Add the Policies tab to your StoreSettingsForm')
    console.log('4. Restart your development server')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })

// 🚀 USAGE INSTRUCTIONS:
// 
// 1. Save this file as: scripts/add-return-policy-fields.ts
// 
// 2. Run the migration:
//    npx tsx scripts/add-return-policy-fields.ts
// 
// 3. Update your Prisma schema with the new fields (use the updated schema)
// 
// 4. Generate Prisma client:
//    npx prisma generate
// 
// 5. Add the Policies tab to your admin settings
//
// 6. Restart your development server