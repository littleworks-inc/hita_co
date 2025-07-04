// scripts/get-exact-database-schema.ts
// Get the exact current structure of your database

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getExactDatabaseSchema() {
  try {
    console.log('🔍 Getting exact database schema structure...')
    
    // Get all columns in store_settings table
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'store_settings'
      ORDER BY column_name;
    ` as Array<{
      column_name: string, 
      data_type: string, 
      is_nullable: string,
      column_default: string | null
    }>
    
    console.log('\n📊 Current store_settings table structure:')
    console.log('=====================================')
    
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '?' : ''
      const defaultVal = col.column_default ? ` @default(${col.column_default})` : ''
      
      let prismaType = 'String'
      if (col.data_type === 'boolean') prismaType = 'Boolean'
      if (col.data_type === 'double precision') prismaType = 'Float'
      if (col.data_type === 'jsonb') prismaType = 'Json'
      if (col.data_type === 'timestamp without time zone') prismaType = 'DateTime'
      
      console.log(`${col.column_name.padEnd(25)} ${prismaType}${nullable.padEnd(2)} ${defaultVal}`)
    })
    
    console.log('\n📋 Prisma schema format:')
    console.log('=====================================')
    console.log('model StoreSettings {')
    
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '?' : ''
      let prismaType = 'String'
      let defaultStr = ''
      
      if (col.data_type === 'boolean') {
        prismaType = 'Boolean'
        if (col.column_default) {
          defaultStr = col.column_default === 'false' ? ' @default(false)' : ' @default(true)'
        }
      } else if (col.data_type === 'double precision') {
        prismaType = 'Float'
        if (col.column_default) {
          defaultStr = ` @default(${col.column_default})`
        }
      } else if (col.data_type === 'jsonb') {
        prismaType = 'Json'
      } else if (col.data_type === 'timestamp without time zone') {
        prismaType = 'DateTime'
        if (col.column_default === 'CURRENT_TIMESTAMP') {
          defaultStr = ' @default(now())'
        }
      } else if (col.data_type === 'text') {
        if (col.column_default && col.column_default !== 'NULL') {
          defaultStr = ` @default("${col.column_default.replace(/'/g, '')}")`
        }
      }
      
      console.log(`  ${col.column_name.padEnd(25)} ${prismaType}${nullable}${defaultStr}`)
    })
    
    console.log('  createdAt                 DateTime @default(now())')
    console.log('  updatedAt                 DateTime @updatedAt')
    console.log('')
    console.log('  @@map("store_settings")')
    console.log('}')
    
    return columns
    
  } catch (error) {
    console.error('❌ Error getting database schema:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the schema check
getExactDatabaseSchema()
  .then((columns) => {
    console.log('\n✅ Database schema analysis complete!')
    console.log(`📊 Found ${columns.length} columns in store_settings table`)
    console.log('\n🔄 Next steps:')
    console.log('1. Copy the Prisma schema format above')
    console.log('2. Replace your StoreSettings model in prisma/schema.prisma')
    console.log('3. Run: npx prisma generate')
    console.log('4. Restart your dev server')
  })
  .catch((error) => {
    console.error('💥 Schema analysis failed:', error)
  })