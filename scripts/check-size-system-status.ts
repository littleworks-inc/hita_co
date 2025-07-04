// scripts/check-size-system-status.ts
// =====================================
// 🔍 Check if Size System is Implemented
// Run this to see what's missing for size selection
// =====================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSizeSystemStatus() {
  try {
    console.log('🔍 Checking Size System Implementation Status...\n')

    // Check if Product table has size fields
    console.log('1️⃣ Checking Product table for size fields...')
    const productFields = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('requiresSizes', 'sizeType')
      ORDER BY column_name;
    ` as Array<{column_name: string}>
    
    console.log(`   Product size fields: ${productFields.length}/2 found`)
    productFields.forEach(field => console.log(`   ✅ ${field.column_name}`))
    
    if (productFields.length < 2) {
      console.log('   ❌ Missing size fields in Product table')
    }

    // Check if ProductSize table exists
    console.log('\n2️⃣ Checking ProductSize table...')
    const productSizeTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'product_sizes';
    ` as Array<{table_name: string}>
    
    if (productSizeTable.length > 0) {
      console.log('   ✅ ProductSize table exists')
      
      // Check if there are any product sizes
      const sizeCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM product_sizes;
      ` as Array<{count: number}>
      
      console.log(`   📊 Total product sizes: ${sizeCount[0]?.count || 0}`)
    } else {
      console.log('   ❌ ProductSize table does not exist')
    }

    // Check if ExhibitionProductSize table exists
    console.log('\n3️⃣ Checking ExhibitionProductSize table...')
    const exhibitionSizeTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'exhibition_product_sizes';
    ` as Array<{table_name: string}>
    
    if (exhibitionSizeTable.length > 0) {
      console.log('   ✅ ExhibitionProductSize table exists')
    } else {
      console.log('   ❌ ExhibitionProductSize table does not exist')
    }

    // Check specific kurta product
    console.log('\n4️⃣ Checking kurta product specifically...')
    try {
      const kurtas = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: 'kurta', mode: 'insensitive' } },
            { sku: { contains: 'KURT', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          sku: true,
          requiresSizes: true,
          sizeType: true,
          category: { select: { name: true } }
        }
      })

      if (kurtas.length > 0) {
        console.log(`   Found ${kurtas.length} kurta product(s):`)
        kurtas.forEach(kurta => {
          console.log(`   📦 ${kurta.name} (${kurta.sku})`)
          console.log(`      Category: ${kurta.category.name}`)
          console.log(`      Requires Sizes: ${kurta.requiresSizes ? 'Yes' : 'No'}`)
          console.log(`      Size Type: ${kurta.sizeType || 'Not set'}`)
        })
      } else {
        console.log('   ❌ No kurta products found')
      }
    } catch (error) {
      console.log('   ❌ Error accessing product data (size fields might not exist)')
    }

    // Summary
    console.log('\n📋 SUMMARY:')
    const hasProductFields = productFields.length >= 2
    const hasProductSizeTable = productSizeTable.length > 0
    const hasExhibitionSizeTable = exhibitionSizeTable.length > 0
    
    if (hasProductFields && hasProductSizeTable && hasExhibitionSizeTable) {
      console.log('✅ Size system is fully implemented!')
      console.log('\n🔧 Next steps:')
      console.log('1. Update products to set requiresSizes = true for kurtas')
      console.log('2. Add product sizes for each kurta')
      console.log('3. Deploy enhanced ExhibitionProductsManager component')
    } else {
      console.log('❌ Size system is NOT fully implemented')
      console.log('\n🔧 Missing components:')
      if (!hasProductFields) console.log('   - Product table size fields')
      if (!hasProductSizeTable) console.log('   - ProductSize table')
      if (!hasExhibitionSizeTable) console.log('   - ExhibitionProductSize table')
      
      console.log('\n💡 Solution:')
      console.log('Run the size system migration script:')
      console.log('   npx tsx scripts/add-size-system-fixed.ts')
    }

  } catch (error) {
    console.error('❌ Error checking size system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSizeSystemStatus()

// 🚀 USAGE:
// Save this as scripts/check-size-system-status.ts
// Run: npx tsx scripts/check-size-system-status.ts