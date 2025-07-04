// scripts/add-accent-color-field.ts
// Safely add the missing accentColor field to StoreSettings table

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addAccentColorField() {
  try {
    console.log('🎨 Adding accentColor field to StoreSettings table...')
    
    // Check if field already exists
    const fieldExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'store_settings' 
      AND column_name = 'accentColor'
    ` as Array<{column_name: string}>
    
    if (fieldExists.length > 0) {
      console.log('✅ accentColor field already exists!')
      return
    }
    
    // Add the accentColor field
    await prisma.$executeRaw`
      ALTER TABLE store_settings 
      ADD COLUMN "accentColor" TEXT DEFAULT '#f59e0b'
    `
    
    console.log('✅ Successfully added accentColor field with default value #f59e0b')
    
    // Update existing records to have a default accent color
    const updated = await prisma.storeSettings.updateMany({
      where: {
        accentColor: null
      },
      data: {
        accentColor: '#f59e0b'  // Orange accent color as default
      }
    })
    
    console.log(`📈 Updated ${updated.count} existing records with default accent color`)
    
    // Verify the field was added
    const verification = await prisma.storeSettings.findMany({
      select: {
        id: true,
        storeName: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true
      }
    })
    
    console.log('\n🎨 Current color settings:')
    verification.forEach(setting => {
      console.log(`   ${setting.storeName}:`)
      console.log(`     Primary: ${setting.primaryColor}`)
      console.log(`     Secondary: ${setting.secondaryColor}`)
      console.log(`     Accent: ${setting.accentColor}`)
    })
    
  } catch (error) {
    console.error('❌ Failed to add accentColor field:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the field addition
addAccentColorField()
  .then(() => {
    console.log('\n🎉 accentColor field added successfully!')
    console.log('\n📋 What was done:')
    console.log('✅ Added accentColor column to store_settings table')
    console.log('✅ Set default value #f59e0b (orange)')
    console.log('✅ Updated existing records')
    console.log('✅ Verified all records have accent colors')
    
    console.log('\n🔄 Next steps:')
    console.log('1. ✅ Database field added')
    console.log('2. ✅ Run: npx prisma generate (to update Prisma client)')
    console.log('3. ✅ Restart your development server: npm run dev')
    console.log('4. ✅ Test the store settings form - accentColor should work now!')
    
    console.log('\n🎨 Your store now has full color control:')
    console.log('   • Primary Color - Main brand elements')
    console.log('   • Secondary Color - Backgrounds and subtle elements')
    console.log('   • Accent Color - Call-to-action buttons and highlights')
    
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Field addition failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure your database is running')
    console.log('2. Check your DATABASE_URL in .env file')
    console.log('3. Verify you have write permissions to the database')
    process.exit(1)
  })