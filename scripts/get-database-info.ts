// scripts/get-database-info.ts
// Get current database structure and data for debugging

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getDatabaseInfo() {
  try {
    console.log('🔍 Getting database information...')
    
    // Get current store settings data
    const storeSettings = await prisma.storeSettings.findMany()
    
    console.log('\n📊 Current StoreSettings data:')
    console.log('Count:', storeSettings.length)
    
    if (storeSettings.length > 0) {
      const firstSetting = storeSettings[0]
      console.log('\n📋 Available fields in StoreSettings object:')
      Object.keys(firstSetting).forEach(key => {
        const value = firstSetting[key as keyof typeof firstSetting]
        console.log(`   - ${key}: ${typeof value} = ${value}`)
      })
    }
    
    // Check what fields are actually in the database table
    console.log('\n🗄️ Database table structure:')
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'store_settings'
      ORDER BY column_name;
    ` as Array<{
      column_name: string, 
      data_type: string, 
      is_nullable: string,
      column_default: string | null
    }>
    
    console.log('Available columns in store_settings table:')
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) default: ${col.column_default || 'none'}`)
    })

    // Check for missing columns that API route needs
    const requiredColumns = ['instagram', 'facebook', 'pinterest', 'twitter', 'aiProvider', 'aiApiKey', 'aiModel']
    const existingColumns = tableInfo.map(col => col.column_name)
    
    console.log('\n❌ Missing columns needed by API route:')
    requiredColumns.forEach(col => {
      if (!existingColumns.includes(col)) {
        console.log(`   - ${col} (needed by API route)`)
      }
    })

    console.log('\n✅ Existing columns that API route uses:')
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`   - ${col} (exists)`)
      }
    })
    
    return {
      currentData: storeSettings,
      tableStructure: tableInfo,
      missingColumns: requiredColumns.filter(col => !existingColumns.includes(col))
    }
    
  } catch (error) {
    console.error('❌ Error getting database info:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the info gathering
getDatabaseInfo()
  .then((info) => {
    console.log('\n📋 SUMMARY:')
    console.log(`   - Store settings records: ${info.currentData.length}`)
    console.log(`   - Database columns: ${info.tableStructure.length}`)
    console.log(`   - Missing columns: ${info.missingColumns.length}`)
    
    if (info.missingColumns.length > 0) {
      console.log('\n🚨 ACTION NEEDED:')
      console.log('Your API route is trying to update fields that don\'t exist in your database.')
      console.log('Missing fields:', info.missingColumns.join(', '))
      console.log('\nNext steps:')
      console.log('1. Add missing fields to your Prisma schema')
      console.log('2. Run: npx prisma db:push')
      console.log('3. Run: npx prisma generate')
      console.log('4. Restart your dev server')
    }
  })
  .catch((error) => {
    console.error('💥 Failed to get database info:', error)
  })