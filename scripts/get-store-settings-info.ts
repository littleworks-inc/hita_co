// scripts/get-store-settings-info.ts
// Get current StoreSettings schema and data

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getStoreSettingsInfo() {
  try {
    console.log('🔍 Getting StoreSettings information...')
    
    // Get current store settings data
    const storeSettings = await prisma.storeSettings.findMany()
    
    console.log('\n📊 Current StoreSettings data:')
    console.log('Count:', storeSettings.length)
    
    if (storeSettings.length > 0) {
      const firstSetting = storeSettings[0]
      console.log('\n📋 Available fields in StoreSettings:')
      Object.keys(firstSetting).forEach(key => {
        console.log(`   - ${key}: ${typeof firstSetting[key]} (${firstSetting[key]})`)
      })
    }
    
    // Check what fields are actually in the database table
    console.log('\n🗄️ Database table structure:')
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'store_settings'
      ORDER BY column_name;
    ` as Array<{column_name: string, data_type: string, is_nullable: string}>
    
    console.log('Available columns in store_settings table:')
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    return {
      currentData: storeSettings,
      tableStructure: tableInfo
    }
    
  } catch (error) {
    console.error('❌ Error getting store settings info:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the info gathering
getStoreSettingsInfo()
  .then((info) => {
    console.log('\n✅ Store settings information collected successfully!')
  })
  .catch((error) => {
    console.error('💥 Failed to get store settings info:', error)
  })