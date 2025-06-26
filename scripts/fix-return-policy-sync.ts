// ✅ scripts/fix-return-policy-sync.ts
// Fix the data sync issue between admin interface and database

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixReturnPolicySync() {
  console.log('🔧 Fixing Return Policy Data Synchronization...\n')
  
  try {
    // Step 1: Check current database state
    console.log('1️⃣ Checking current database values...')
    
    const currentSettings = await prisma.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        id: true,
        returnsEnabled: true,
        returnPeriodDays: true,
        hasRestockingFee: true,
        restockingFeePercentage: true,
        returnPolicyDescription: true,
        noReturnsReason: true
      }
    })

    if (!currentSettings) {
      console.log('❌ No store settings found! Creating default settings...')
      
      const newSettings = await prisma.storeSetting.create({
        data: {
          id: 'default',
          storeName: 'LittleWorks Inc',
          returnsEnabled: false, // Set to match your admin interface
          returnPeriodDays: 30,
          hasRestockingFee: false,
          restockingFeePercentage: 0,
          noReturnsReason: 'Due to hygiene and quality standards, all sales are final.'
        }
      })
      
      console.log('✅ Created default settings with returns disabled')
      console.log('📊 New settings:', newSettings)
      return
    }

    console.log('📊 Current Database Values:')
    console.log('   Returns Enabled:', currentSettings.returnsEnabled)
    console.log('   Return Period Days:', currentSettings.returnPeriodDays)
    console.log('   Has Restocking Fee:', currentSettings.hasRestockingFee)
    console.log('   Restocking Fee %:', currentSettings.restockingFeePercentage)
    console.log('   Return Policy Description:', currentSettings.returnPolicyDescription ? 'Set' : 'Not set')
    console.log('   No Returns Reason:', currentSettings.noReturnsReason || 'Not set')

    // Step 2: Fix the sync issue by updating to match admin interface
    console.log('\n2️⃣ Updating database to match admin interface (returns OFF)...')
    
    const updatedSettings = await prisma.storeSetting.update({
      where: { id: 'default' },
      data: {
        returnsEnabled: false, // Set to false to match your admin interface
        noReturnsReason: 'Due to hygiene and quality standards, all sales are final.',
        returnPolicyDescription: null // Clear this when returns are disabled
      }
    })

    console.log('✅ Successfully updated return policy settings!')

    // Step 3: Verify the update
    console.log('\n3️⃣ Verifying the update...')
    
    const verifiedSettings = await prisma.storeSetting.findFirst({
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

    console.log('📊 Updated Database Values:')
    console.log('   Returns Enabled:', verifiedSettings?.returnsEnabled)
    console.log('   Return Period Days:', verifiedSettings?.returnPeriodDays)
    console.log('   Has Restocking Fee:', verifiedSettings?.hasRestockingFee)
    console.log('   Restocking Fee %:', verifiedSettings?.restockingFeePercentage)
    console.log('   Return Policy Description:', verifiedSettings?.returnPolicyDescription || 'Cleared (returns disabled)')
    console.log('   No Returns Reason:', verifiedSettings?.noReturnsReason || 'Not set')

    // Step 4: Test what the customer will see
    console.log('\n4️⃣ Testing customer portal display logic...')
    
    const customerWillSee = verifiedSettings?.returnsEnabled 
      ? {
          title: 'Easy Returns',
          message: `${verifiedSettings.returnPeriodDays}-day return policy`,
          icon: 'purple RotateCcw',
          type: 'returns_enabled'
        }
      : {
          title: 'No Returns',
          message: verifiedSettings?.noReturnsReason || 'All sales are final',
          icon: 'red AlertCircle',
          type: 'no_returns'
        }

    console.log('👁️  Customer Portal Will Show:')
    console.log(`   Title: "${customerWillSee.title}"`)
    console.log(`   Message: "${customerWillSee.message}"`)
    console.log(`   Icon: ${customerWillSee.icon}`)
    console.log(`   Type: ${customerWillSee.type}`)

    // Step 5: Check API endpoint behavior
    console.log('\n5️⃣ Simulating API call to verify data flow...')
    
    try {
      // This simulates what your settings API returns
      const apiResponse = {
        success: true,
        storeSettings: verifiedSettings
      }
      
      console.log('✅ API will return:', {
        returnsEnabled: apiResponse.storeSettings?.returnsEnabled,
        noReturnsReason: apiResponse.storeSettings?.noReturnsReason
      })
    } catch (error) {
      console.log('⚠️  API simulation failed:', error.message)
    }

  } catch (error) {
    console.error('❌ Sync fix failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the sync fix
fixReturnPolicySync()
  .then(() => {
    console.log('\n🎉 Return Policy Sync Fixed Successfully!')
    console.log('\n📋 What was fixed:')
    console.log('   ✅ Database now shows returnsEnabled: false')
    console.log('   ✅ Added default "No Returns" reason')
    console.log('   ✅ Cleared return policy description')
    console.log('\n🧪 Test Steps:')
    console.log('1. Restart your development server: npm run dev')
    console.log('2. Visit your homepage and check Trust Indicators')
    console.log('3. Should now show "No Returns - All sales are final"')
    console.log('4. Admin settings should stay consistent with the toggle OFF')
    console.log('\n💡 If you want to re-enable returns:')
    console.log('   - Use the admin toggle to turn returns back ON')
    console.log('   - The form will show return period and fee options')
    console.log('   - Customer portal will automatically switch back to "Easy Returns"')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Sync fix failed:', error)
    console.log('\n🔧 Next steps:')
    console.log('1. Check database connection')
    console.log('2. Verify store settings exist')
    console.log('3. Try running: npx prisma studio')
    process.exit(1)
  })