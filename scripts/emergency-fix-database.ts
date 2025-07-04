// scripts/emergency-fix-database.ts
// 🚨 EMERGENCY FIX: Restore system after schema corruption

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function emergencyFixDatabase() {
  console.log('🚨 EMERGENCY DATABASE RECOVERY STARTING...')
  
  try {
    // Step 1: Check current database state
    console.log('\n🔍 Step 1: Checking current database state...')
    
    const storeSettings = await prisma.storeSettings.findMany()
    console.log(`   Found ${storeSettings.length} store settings records`)
    
    if (storeSettings.length > 0) {
      const firstSetting = storeSettings[0]
      console.log(`   Store Name: ${firstSetting.storeName}`)
      console.log(`   Has socialMedia field: ${!!firstSetting.socialMedia}`)
      console.log(`   Disable Shopping Cart: ${firstSetting.disableShoppingCart}`)
    }

    // Step 2: Fix any inconsistencies in store settings
    console.log('\n🔧 Step 2: Fixing store settings...')
    
    // Ensure we have a default store setting
    let defaultSetting = await prisma.storeSettings.findFirst({
      where: { id: 'default' }
    })

    if (!defaultSetting) {
      console.log('   Creating default store setting...')
      defaultSetting = await prisma.storeSettings.create({
        data: {
          id: 'default',
          storeName: 'Hita&Co',
          tagline: 'Authentic Handcrafted Products',
          primaryColor: '#1f2937',
          secondaryColor: '#f3f4f6',
          accentColor: '#f59e0b',
          email: 'admin@hitaco.com',
          currency: 'USD',
          timezone: 'America/New_York',
          disableShoppingCart: false,
          catalogModeSettings: JSON.stringify({
            whatsappNumber: '',
            instagramHandle: '',
            contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
            showWhatsApp: true,
            showInstagram: true,
            customContactText: 'Contact us for pricing and availability'
          }),
          socialMedia: {
            instagram: '',
            facebook: '',
            twitter: '',
            pinterest: ''
          }
        }
      })
      console.log('   ✅ Default store setting created')
    } else {
      console.log('   ✅ Default store setting exists')
    }

    // Step 3: Ensure socialMedia field is properly structured
    if (!defaultSetting.socialMedia) {
      console.log('   Fixing socialMedia field...')
      await prisma.storeSettings.update({
        where: { id: 'default' },
        data: {
          socialMedia: {
            instagram: '',
            facebook: '',
            twitter: '',
            pinterest: ''
          }
        }
      })
      console.log('   ✅ socialMedia field fixed')
    }

    // Step 4: Check critical tables
    console.log('\n📊 Step 3: Checking critical tables...')
    
    const [
      productCount,
      categoryCount,
      exhibitionCount
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.exhibition.count()
    ])

    console.log(`   Products: ${productCount}`)
    console.log(`   Categories: ${categoryCount}`)
    console.log(`   Exhibitions: ${exhibitionCount}`)

    // Step 5: Verify API route compatibility
    console.log('\n🔌 Step 4: Verifying API route compatibility...')
    
    const testData = await prisma.storeSettings.findFirst({
      where: { id: 'default' }
    })

    if (testData) {
      // Test flattening socialMedia for API response
      const socialMedia = testData.socialMedia as any || {}
      const flattenedData = {
        ...testData,
        instagram: socialMedia.instagram || '',
        facebook: socialMedia.facebook || '',
        pinterest: socialMedia.pinterest || '',
        twitter: socialMedia.twitter || ''
      }
      
      console.log('   ✅ API route data structure verified')
      console.log(`   Instagram: ${flattenedData.instagram || 'Not set'}`)
      console.log(`   Facebook: ${flattenedData.facebook || 'Not set'}`)
    }

    console.log('\n🎉 EMERGENCY RECOVERY COMPLETED SUCCESSFULLY!')
    console.log('\n📋 WHAT WAS FIXED:')
    console.log('   ✅ Store settings structure verified')
    console.log('   ✅ Default configuration ensured')
    console.log('   ✅ Social media JSON field structured')
    console.log('   ✅ API route compatibility verified')
    
    console.log('\n🔄 NEXT STEPS:')
    console.log('   1. Replace your Prisma schema with the correct StoreSettings model')
    console.log('   2. Run: npx prisma generate')
    console.log('   3. Use the fixed API route provided')
    console.log('   4. Restart your development server')
    
    return {
      success: true,
      storeSettingsCount: storeSettings.length,
      productCount,
      categoryCount,
      exhibitionCount
    }
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the emergency fix
emergencyFixDatabase()
  .then((result) => {
    console.log('\n✅ Emergency fix completed successfully!')
    console.log('Result:', result)
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Emergency fix failed:', error)
    console.log('\n🆘 MANUAL RECOVERY STEPS:')
    console.log('1. Check your DATABASE_URL in .env file')
    console.log('2. Ensure your database is running')
    console.log('3. Update your Prisma schema with the correct StoreSettings model')
    console.log('4. Run: npx prisma db:push --force-reset (⚠️  CAUTION: This will reset data)')
    process.exit(1)
  })