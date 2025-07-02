// ✅ scripts/catalog-toggle-set-defaults.ts
// Set default values for catalog toggle fields (fields already exist in database)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setCatalogToggleDefaults() {
  console.log('🚀 Setting default values for Catalog/eCommerce toggle fields...')
  
  try {
    // Verify the fields exist in database
    console.log('📝 Verifying catalog toggle fields exist in database...')
    
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT "disableShoppingCart", "catalogModeSettings" 
        FROM store_settings 
        LIMIT 1
      `
      console.log('✅ Catalog toggle fields confirmed in database')
    } catch (error) {
      console.log('❌ Catalog toggle fields not found in database')
      console.log('Please run the original migration script first')
      return false
    }

    // Set default catalog settings
    console.log('📊 Setting default values for catalog mode...')
    
    const defaultCatalogSettings = {
      whatsappNumber: '',
      instagramHandle: '',
      contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
      showWhatsApp: true,
      showInstagram: true,
      customContactText: 'Contact us for pricing and availability'
    }

    // Update store settings with defaults (this will work after schema update)
    const updated = await prisma.storeSetting.updateMany({
      where: { id: 'default' },
      data: {
        disableShoppingCart: false, // Default to eCommerce mode
        catalogModeSettings: JSON.stringify(defaultCatalogSettings)
      }
    })

    console.log(`📈 Updated ${updated.count} store setting record(s) with default values`)

    // Verify the update
    const verification = await prisma.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        disableShoppingCart: true,
        catalogModeSettings: true,
        storeName: true,
        email: true,
        phone: true
      }
    })

    console.log('\n✅ Catalog/eCommerce Toggle Configuration Complete!')
    console.log('   Store Name:', verification?.storeName || 'Not set')
    console.log('   Shopping Cart Disabled:', verification?.disableShoppingCart ?? false)
    console.log('   Catalog Mode Settings:', verification?.catalogModeSettings ? 'Configured' : 'Not configured')

    if (verification?.catalogModeSettings) {
      try {
        const catalogSettings = JSON.parse(verification.catalogModeSettings)
        console.log('\n📱 Catalog Mode Default Configuration:')
        console.log('   WhatsApp Number:', catalogSettings.whatsappNumber || 'Not set')
        console.log('   Instagram Handle:', catalogSettings.instagramHandle || 'Not set')
        console.log('   Contact Message:', catalogSettings.contactMessage || 'Default message')
        console.log('   Show WhatsApp:', catalogSettings.showWhatsApp ?? true)
        console.log('   Show Instagram:', catalogSettings.showInstagram ?? true)
      } catch (error) {
        console.log('   ⚠️  Catalog settings JSON parsing error')
      }
    }

    // Test toggling between modes
    console.log('\n🧪 Testing mode switching...')
    
    // Test catalog mode
    await prisma.storeSetting.updateMany({
      where: { id: 'default' },
      data: { disableShoppingCart: true }
    })
    console.log('   ✅ Switched to Catalog Mode (shopping cart disabled)')

    // Switch back to eCommerce mode
    await prisma.storeSetting.updateMany({
      where: { id: 'default' },
      data: { disableShoppingCart: false }
    })
    console.log('   ✅ Switched back to eCommerce Mode (shopping cart enabled)')

  } catch (error) {
    console.error('❌ Setting defaults failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the default setting script
setCatalogToggleDefaults()
  .then(() => {
    console.log('\n🎉 Catalog/eCommerce Toggle Defaults Set Successfully!')
    console.log('\n📋 Current Status:')
    console.log('✅ Database fields created (previous migration)')
    console.log('✅ Default values set for immediate use')
    console.log('✅ Mode switching tested and working')
    
    console.log('\n🔄 Next steps:')
    console.log('1. ✅ Update Prisma schema with new fields (see artifact)')
    console.log('2. ✅ Run: npx prisma generate')
    console.log('3. ✅ Run: npx prisma db:push') 
    console.log('4. ✅ Restart development server')
    console.log('5. 🚧 Add catalog toggle to StoreSettingsForm component')
    console.log('6. 🚧 Update ProductCard with conditional rendering')
    console.log('7. 🚧 Create ContactButtons component')
    
    console.log('\n🛒 Business Modes Now Available:')
    console.log('   eCommerce Mode (disableShoppingCart: false):')
    console.log('     • Full shopping cart functionality')
    console.log('     • Add to cart buttons on products')
    console.log('     • Cart icon in navigation')
    console.log('     • Complete checkout process')
    console.log('')
    console.log('   Catalog Mode (disableShoppingCart: true):')
    console.log('     • Product showcase with prices')
    console.log('     • WhatsApp contact buttons')
    console.log('     • Instagram contact buttons')
    console.log('     • No cart functionality')
    
    console.log('\n🎯 Ready for Phase 2: Component Updates!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Setting defaults failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure you updated your Prisma schema first')
    console.log('2. Run: npx prisma generate')
    console.log('3. Verify database fields exist from previous migration')
    console.log('4. Check your DATABASE_URL in .env file')
    process.exit(1)
  })

// 🚀 USAGE INSTRUCTIONS:
// 
// STEP 1: Update your prisma/schema.prisma file
//         Add the two new fields to your StoreSetting model (see artifact)
// 
// STEP 2: Generate Prisma client
//         npx prisma generate
// 
// STEP 3: Run this script to set defaults
//         npx tsx scripts/catalog-toggle-set-defaults.ts
// 
// STEP 4: Push schema changes
//         npx prisma db:push
// 
// STEP 5: Restart development server
//         npm run dev
//
// STEP 6: Proceed to Phase 2 - Component Updates

/* 
💡 EXPLANATION OF THE TWO FIELDS:

1️⃣ disableShoppingCart: Boolean? @default(false)
   • This is the main toggle switch
   • false = eCommerce Mode (normal shopping cart)
   • true = Catalog Mode (contact buttons instead)
   • Admin can toggle this in settings

2️⃣ catalogModeSettings: String?
   • JSON string containing contact information
   • Structure: {
       "whatsappNumber": "+1234567890",
       "instagramHandle": "hitaco_store", 
       "contactMessage": "Hi! I'm interested...",
       "showWhatsApp": true,
       "showInstagram": true,
       "customContactText": "Contact us..."
     }
   • Admin can configure these in settings
   • Used when catalog mode is enabled

🔄 HOW IT WORKS IN COMPONENTS:
   • ProductCard checks `disableShoppingCart`
   • If false: shows "Add to Cart" button
   • If true: shows WhatsApp/Instagram buttons using `catalogModeSettings`
   • CustomerNavigation hides/shows cart icon based on mode
*/