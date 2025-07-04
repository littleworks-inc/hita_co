// scripts/add-missing-store-settings-columns.ts
// This script adds the missing columns to the store_settings table

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to store_settings table...')
  
  try {
    // Check if columns already exist first
    console.log('📝 Checking if columns already exist...')
    
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT "disableShoppingCart", "catalogModeSettings" 
        FROM store_settings 
        LIMIT 1
      `
      console.log('✅ Columns already exist!')
      return true
    } catch (error) {
      console.log('📝 Columns not found, adding them...')
    }

    // Add disableShoppingCart column
    console.log('🔧 Adding disableShoppingCart column...')
    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "disableShoppingCart" BOOLEAN DEFAULT false
    `
    console.log('   ✅ Added disableShoppingCart column')

    // Add catalogModeSettings column
    console.log('🔧 Adding catalogModeSettings column...')
    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "catalogModeSettings" TEXT
    `
    console.log('   ✅ Added catalogModeSettings column')

    // Set default values
    console.log('📊 Setting default values...')
    
    const defaultCatalogSettings = {
      whatsappNumber: '',
      instagramHandle: '',
      contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
      showWhatsApp: true,
      showInstagram: true,
      customContactText: 'Contact us for pricing and availability'
    }

    await prisma.storeSettings.updateMany({
      data: {
        disableShoppingCart: false, // Default to eCommerce mode
        catalogModeSettings: JSON.stringify(defaultCatalogSettings)
      }
    })

    console.log('   ✅ Set default values')

    // Verify the changes
    console.log('🧪 Verifying the changes...')
    
    const verification = await prisma.storeSettings.findFirst()
    
    console.log('\n✅ Migration Complete! Store Settings:')
    console.log('   Store Name:', verification?.storeName || 'Not set')
    console.log('   Shopping Cart Disabled:', verification?.disableShoppingCart ?? false)
    console.log('   Catalog Mode Settings:', verification?.catalogModeSettings ? 'Configured' : 'Not configured')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
addMissingColumns()
  .then(() => {
    console.log('\n🎉 Successfully added missing columns to store_settings table!')
    console.log('\n📋 What was added:')
    console.log('✅ disableShoppingCart - Boolean field (default: false)')
    console.log('✅ catalogModeSettings - JSON field for contact info')
    console.log('✅ Default values set for immediate use')
    
    console.log('\n🔄 Next steps:')
    console.log('1. ✅ Columns added to database')
    console.log('2. ✅ Run: npx prisma generate (to sync Prisma client)')
    console.log('3. ✅ Restart your development server: npm run dev')
    
    console.log('\n🛒 Your platform now supports:')
    console.log('   • eCommerce Mode (full shopping cart)')
    console.log('   • Catalog Mode (contact buttons instead of cart)')
    console.log('   • Admin toggle to switch between modes')
    
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