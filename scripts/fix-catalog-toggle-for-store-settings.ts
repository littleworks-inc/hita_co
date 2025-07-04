// scripts/fix-catalog-toggle-for-store-settings.ts
// Fixed migration script that uses the correct model name

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCatalogToggleForStoreSettings() {
  console.log('🚀 Setting default values for Catalog/eCommerce toggle (using correct model)...')
  
  try {
    // Set default catalog settings for StoreSettings model (plural)
    const defaultCatalogSettings = {
      whatsappNumber: '',
      instagramHandle: '',
      contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
      showWhatsApp: true,
      showInstagram: true,
      customContactText: 'Contact us for pricing and availability'
    }

    // Update using correct model name: storeSettings (not storeSetting)
    const updated = await prisma.storeSettings.updateMany({
      where: { id: 'default' },
      data: {
        disableShoppingCart: false, // Default to eCommerce mode
        catalogModeSettings: JSON.stringify(defaultCatalogSettings)
      }
    })

    console.log(`📈 Updated ${updated.count} store setting record(s) with default values`)

    // Verify the update
    const verification = await prisma.storeSettings.findFirst({
      where: { id: 'default' },
      select: {
        disableShoppingCart: true,
        catalogModeSettings: true,
        storeName: true
      }
    })

    console.log('\n✅ Catalog/eCommerce Toggle Configuration Complete!')
    console.log('   Store Name:', verification?.storeName || 'Not set')
    console.log('   Shopping Cart Disabled:', verification?.disableShoppingCart ?? false)
    console.log('   Catalog Mode Settings:', verification?.catalogModeSettings ? 'Configured' : 'Not configured')

  } catch (error) {
    console.error('❌ Setting defaults failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixCatalogToggleForStoreSettings()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. ✅ Update all files to use db.storeSettings (plural)')
    console.log('2. ✅ Run: npx prisma generate')
    console.log('3. ✅ Run: npx prisma db:push')
    console.log('4. ✅ Restart development server: npm run dev')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })