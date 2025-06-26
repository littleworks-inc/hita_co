// ✅ scripts/add-no-returns-reason-field.ts
// Quick fix: Add the missing noReturnsReason field to complete "No Returns" feature

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addNoReturnsReasonField() {
  console.log('🚀 Adding missing noReturnsReason field to StoreSetting model...')
  
  try {
    // Check if the field already exists
    console.log('📝 Checking if noReturnsReason field exists...')
    
    try {
      await prisma.$queryRaw`
        SELECT "noReturnsReason" 
        FROM store_settings 
        LIMIT 1
      `
      console.log('✅ noReturnsReason field already exists!')
      
      // Even if it exists, let's check the current settings
      const currentSettings = await prisma.storeSetting.findFirst({
        where: { id: 'default' },
        select: {
          returnsEnabled: true,
          noReturnsReason: true,
          returnPeriodDays: true
        }
      })
      
      console.log('\n📊 Current Return Policy Settings:')
      console.log('   Returns Enabled:', currentSettings?.returnsEnabled)
      console.log('   No Returns Reason:', currentSettings?.noReturnsReason || 'Not set')
      console.log('   Return Period:', currentSettings?.returnPeriodDays || 'Not set')
      
      return true
    } catch (error) {
      console.log('📝 Field not found in database, adding it...')
    }

    // Add the missing field
    console.log('🔧 Adding noReturnsReason field to database...')
    
    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "noReturnsReason" TEXT
    `

    console.log('✅ Successfully added noReturnsReason field!')

    // Test the field by updating a setting
    console.log('🧪 Testing field functionality...')
    
    const testUpdate = await prisma.storeSetting.updateMany({
      where: { id: 'default' },
      data: {
        noReturnsReason: 'Due to hygiene and quality standards, all sales are final.'
      }
    })

    console.log(`📈 Test update successful: ${testUpdate.count} record(s) updated`)

    // Verify the complete setup
    const verification = await prisma.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        returnsEnabled: true,
        returnPeriodDays: true,
        hasRestockingFee: true,
        restockingFeePercentage: true,
        returnPolicyDescription: true,
        noReturnsReason: true
      }
    })

    console.log('\n✅ Migration Complete! Current Settings:')
    console.log('   Returns Enabled:', verification?.returnsEnabled ?? 'Not set')
    console.log('   Return Period Days:', verification?.returnPeriodDays ?? 'Not set')
    console.log('   Has Restocking Fee:', verification?.hasRestockingFee ?? 'Not set')
    console.log('   Restocking Fee %:', verification?.restockingFeePercentage ?? 'Not set')
    console.log('   Policy Description:', verification?.returnPolicyDescription ? 'Set' : 'Not set')
    console.log('   No Returns Reason:', verification?.noReturnsReason ? 'Set' : 'Not set')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
addNoReturnsReasonField()
  .then(() => {
    console.log('\n🎉 Success! Your "No Returns" feature should now work properly!')
    console.log('\n📋 Next steps:')
    console.log('1. Run: npx prisma generate')
    console.log('2. Restart your development server')
    console.log('3. Test the toggle in admin settings')
    console.log('4. Check the customer portal trust indicators')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure your database is running')
    console.log('2. Check your DATABASE_URL in .env file')
    console.log('3. Verify you have write permissions to the database')
    process.exit(1)
  })

// 🚀 USAGE INSTRUCTIONS:
// 
// 1. Save this file as: scripts/add-no-returns-reason-field.ts
// 
// 2. Run the migration:
//    npx tsx scripts/add-no-returns-reason-field.ts
// 
// 3. Generate updated Prisma client:
//    npx prisma generate
// 
// 4. Restart your development server:
//    npm run dev
// 
// 5. Test the feature:
//    - Go to admin settings → Policies tab
//    - Toggle "Enable Returns & Exchanges" OFF
//    - Add a reason in the "Reason for No Returns" field
//    - Save settings
//    - Check customer portal homepage for "No Returns" in trust indicators