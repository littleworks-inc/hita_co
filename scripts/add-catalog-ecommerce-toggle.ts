// ✅ scripts/add-catalog-ecommerce-toggle.ts
// Safe migration script to add catalog/eCommerce toggle fields to StoreSetting model

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addCatalogECommerceToggle() {
  console.log('🚀 Adding Catalog/eCommerce toggle fields to StoreSetting model...')
  
  try {
    // Check if fields already exist
    console.log('📝 Checking if catalog toggle fields already exist...')
    
    try {
      await prisma.$queryRaw`
        SELECT "disableShoppingCart" 
        FROM store_settings 
        LIMIT 1
      `
      console.log('✅ Catalog toggle fields already exist, skipping migration')
      
      // Show current settings
      const currentSettings = await prisma.storeSetting.findFirst({
        where: { id: 'default' },
        select: {
          disableShoppingCart: true,
          catalogModeSettings: true,
          storeName: true
        }
      })
      
      console.log('\n📊 Current Catalog Settings:')
      console.log('   Shopping Cart Disabled:', currentSettings?.disableShoppingCart ?? false)
      console.log('   Catalog Mode Settings:', currentSettings?.catalogModeSettings ? 'Configured' : 'Not configured')
      
      return true
    } catch (error) {
      console.log('📝 Fields not found in database, adding them...')
    }

    // Add the new fields
    console.log('🔧 Adding catalog/eCommerce toggle fields to database...')
    
    // Add disableShoppingCart field
    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "disableShoppingCart" BOOLEAN DEFAULT false
    `
    console.log('   ✅ Added disableShoppingCart field')

    // Add catalogModeSettings field (JSON for contact information)
    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "catalogModeSettings" TEXT
    `
    console.log('   ✅ Added catalogModeSettings field')

    console.log('✅ Successfully added all catalog toggle fields!')

    // Set default values for existing store settings
    console.log('📊 Setting default values for catalog mode...')
    
    const defaultCatalogSettings = {
      whatsappNumber: '',
      instagramHandle: '',
      contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
      showWhatsApp: true,
      showInstagram: true,
      customContactText: 'Contact us for pricing and availability'
    }

    const updated = await prisma.storeSetting.updateMany({
      where: {},
      data: {
        disableShoppingCart: false, // Default to eCommerce mode
        catalogModeSettings: JSON.stringify(defaultCatalogSettings)
      }
    })

    console.log(`📈 Updated ${updated.count} store setting record(s) with default values`)

    // Test the fields functionality
    console.log('🧪 Testing catalog toggle functionality...')
    
    // Test updating to catalog mode
    const testCatalogMode = await prisma.storeSetting.updateMany({
      where: { id: 'default' },
      data: {
        disableShoppingCart: true,
        catalogModeSettings: JSON.stringify({
          ...defaultCatalogSettings,
          whatsappNumber: '+1234567890',
          instagramHandle: 'hitaco_store',
          contactMessage: 'Hello! I would like to know more about this beautiful piece.'
        })
      }
    })

    console.log(`📈 Test catalog mode update: ${testCatalogMode.count} record(s) updated`)

    // Switch back to eCommerce mode for normal operation
    await prisma.storeSetting.updateMany({
      where: { id: 'default' },
      data: {
        disableShoppingCart: false
      }
    })

    console.log('📈 Switched back to eCommerce mode (default)')

    // Verify the complete setup
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

    console.log('\n✅ Migration Complete! Catalog/eCommerce Toggle Ready:')
    console.log('   Store Name:', verification?.storeName || 'Not set')
    console.log('   Shopping Cart Disabled:', verification?.disableShoppingCart ?? false)
    console.log('   Catalog Mode Settings:', verification?.catalogModeSettings ? 'Configured' : 'Not configured')
    console.log('   Store Email:', verification?.email || 'Not set')
    console.log('   Store Phone:', verification?.phone || 'Not set')

    if (verification?.catalogModeSettings) {
      try {
        const catalogSettings = JSON.parse(verification.catalogModeSettings)
        console.log('\n📱 Catalog Mode Configuration:')
        console.log('   WhatsApp Number:', catalogSettings.whatsappNumber || 'Not set')
        console.log('   Instagram Handle:', catalogSettings.instagramHandle || 'Not set')
        console.log('   Contact Message:', catalogSettings.contactMessage || 'Default message')
        console.log('   Show WhatsApp:', catalogSettings.showWhatsApp ?? true)
        console.log('   Show Instagram:', catalogSettings.showInstagram ?? true)
      } catch (error) {
        console.log('   ⚠️  Catalog settings JSON parsing error')
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
addCatalogECommerceToggle()
  .then(() => {
    console.log('\n🎉 Catalog/eCommerce Toggle Migration Completed Successfully!')
    console.log('\n📋 What was added:')
    console.log('✅ disableShoppingCart - Boolean field to toggle between modes')
    console.log('✅ catalogModeSettings - JSON field for WhatsApp/Instagram contact info')
    console.log('✅ Default values set for immediate use')
    console.log('✅ Test functionality verified')
    
    console.log('\n🔄 Next steps:')
    console.log('1. Update your Prisma schema with the new fields')
    console.log('2. Run: npx prisma generate')
    console.log('3. Add catalog toggle to StoreSettingsForm component')
    console.log('4. Update ProductCard component with conditional rendering')
    console.log('5. Create ContactButtons component for catalog mode')
    console.log('6. Update CustomerNavigation to hide/show cart icon')
    
    console.log('\n🛒 Business Modes Available:')
    console.log('   eCommerce Mode (disableShoppingCart: false):')
    console.log('     • Full shopping cart functionality')
    console.log('     • Add to cart buttons')
    console.log('     • Checkout process')
    console.log('     • Payment integration')
    console.log('')
    console.log('   Catalog Mode (disableShoppingCart: true):')
    console.log('     • Product showcase with prices')
    console.log('     • WhatsApp contact buttons')
    console.log('     • Instagram contact buttons')
    console.log('     • Custom contact messages')
    
    console.log('\n⚠️  IMPORTANT: Add these fields to your Prisma schema:')
    console.log('   disableShoppingCart     Boolean?  @default(false)')
    console.log('   catalogModeSettings     String?   // JSON for contact info')
    
    console.log('\n🚀 Ready for Phase 2: Component Updates!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure your database is running')
    console.log('2. Check your DATABASE_URL in .env file')
    console.log('3. Verify you have write permissions to the database')
    console.log('4. Check if StoreSetting table exists')
    process.exit(1)
  })

// 🚀 USAGE INSTRUCTIONS:
// 
// 1. Save this file as: scripts/add-catalog-ecommerce-toggle.ts
// 
// 2. Run the migration:
//    npx tsx scripts/add-catalog-ecommerce-toggle.ts
// 
// 3. Update your Prisma schema with the new fields:
//    - Add to StoreSetting model:
//      disableShoppingCart     Boolean?  @default(false)
//      catalogModeSettings     String?   // JSON for contact info
// 
// 4. Generate Prisma client:
//    npx prisma generate
// 
// 5. Push schema changes:
//    npx prisma db:push
// 
// 6. Restart your development server:
//    npm run dev
//
// 7. Proceed to Phase 2: Component Updates

/* 
🎯 CATALOG/ECOMMERCE TOGGLE FEATURE SPECIFICATION:

📊 Database Fields Added:
- disableShoppingCart: Boolean (false = eCommerce, true = Catalog)
- catalogModeSettings: JSON string containing:
  {
    whatsappNumber: string,
    instagramHandle: string, 
    contactMessage: string,
    showWhatsApp: boolean,
    showInstagram: boolean,
    customContactText: string
  }

🔄 Mode Behavior:
- eCommerce Mode (disableShoppingCart: false):
  • Show "Add to Cart" buttons
  • Display cart icon in navigation
  • Enable full checkout process
  • Allow quantity selection

- Catalog Mode (disableShoppingCart: true):
  • Show contact buttons instead of cart
  • Hide cart icon from navigation
  • Display prices for reference
  • WhatsApp/Instagram contact options

💼 Business Value:
- Flexibility for different business models
- Easy switching without code changes
- Professional catalog presentation
- Direct customer communication channels
*/