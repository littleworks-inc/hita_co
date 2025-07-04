// scripts/add-missing-sizetype-field.ts
// =====================================
// 🔧 Quick Fix: Add Missing sizeType Field
// This will complete your size system implementation
// =====================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMissingSizeTypeField() {
  console.log('🔧 Adding missing sizeType field...\n')

  try {
    // Add the missing sizeType field to Product table
    console.log('1️⃣ Adding sizeType field to Product table...')
    await prisma.$executeRaw`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS "sizeType" TEXT;
    `
    console.log('✅ sizeType field added to Product table')

    // Add sizeType field to Category table too (for defaults)
    console.log('\n2️⃣ Adding sizeType field to Category table...')
    await prisma.$executeRaw`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS "defaultSizeType" TEXT;
    `
    console.log('✅ defaultSizeType field added to Category table')

    // Update existing products that require sizes
    console.log('\n3️⃣ Updating existing products with sizeType...')
    
    // Update kurtas and other clothing items
    await prisma.$executeRaw`
      UPDATE products 
      SET "sizeType" = 'CLOTHING'
      WHERE "requiresSizes" = true;
    `
    console.log('✅ Updated products that require sizes to use CLOTHING sizeType')

    // Update categories with appropriate defaults
    console.log('\n4️⃣ Setting category defaults...')
    const categoryUpdates = [
      'Kurtas', 'Blouses', 'Lehengas', 'Salwars', 'Pants', 'Clothing'
    ]

    for (const categoryName of categoryUpdates) {
      try {
        await prisma.$executeRaw`
          UPDATE categories 
          SET "defaultSizeType" = 'CLOTHING'
          WHERE LOWER(name) LIKE ${`%${categoryName.toLowerCase()}%`};
        `
        console.log(`   ✅ Updated ${categoryName} category`)
      } catch (error) {
        console.log(`   ⚠️  Category ${categoryName} not found, skipping`)
      }
    }

    // Verification
    console.log('\n5️⃣ Verifying the fix...')
    
    const verification = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN "requiresSizes" = true THEN 1 ELSE 0 END) as products_requiring_sizes,
        SUM(CASE WHEN "sizeType" IS NOT NULL THEN 1 ELSE 0 END) as products_with_size_type
      FROM products;
    ` as Array<{total_products: number, products_requiring_sizes: number, products_with_size_type: number}>

    const stats = verification[0]
    console.log('📊 Verification Results:')
    console.log(`   Total products: ${stats.total_products}`)
    console.log(`   Products requiring sizes: ${stats.products_requiring_sizes}`)
    console.log(`   Products with sizeType: ${stats.products_with_size_type}`)

    // Test accessing a kurta product
    console.log('\n6️⃣ Testing kurta product access...')
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
          category: { select: { name: true } },
          productSizes: {
            select: {
              id: true,
              size: true,
              stockQuantity: true
            }
          }
        }
      })

      if (kurtas.length > 0) {
        console.log(`✅ Successfully accessed ${kurtas.length} kurta product(s):`)
        kurtas.forEach(kurta => {
          console.log(`   📦 ${kurta.name} (${kurta.sku})`)
          console.log(`      Requires Sizes: ${kurta.requiresSizes}`)
          console.log(`      Size Type: ${kurta.sizeType}`)
          console.log(`      Available Sizes: ${kurta.productSizes?.length || 0}`)
          if (kurta.productSizes && kurta.productSizes.length > 0) {
            console.log(`      Sizes: ${kurta.productSizes.map(s => s.size).join(', ')}`)
          }
        })
      } else {
        console.log('   ⚠️  No kurta products found')
      }
    } catch (error) {
      console.log('   ❌ Still unable to access product data:', error)
    }

    console.log('\n🎉 Fix Complete!')
    console.log('\n📋 What was fixed:')
    console.log('✅ Added missing sizeType field to Product table')
    console.log('✅ Added defaultSizeType field to Category table')
    console.log('✅ Updated existing products with appropriate sizeType')
    console.log('✅ Set category defaults for clothing items')

    console.log('\n🔄 Next steps:')
    console.log('1. Run: npx prisma generate')
    console.log('2. Replace ExhibitionProductsManager component with enhanced version')
    console.log('3. Restart your development server')
    console.log('4. Test size selection in exhibition management')

  } catch (error) {
    console.error('❌ Fix failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addMissingSizeTypeField()
  .then(() => {
    console.log('\n✨ Size system fix completed successfully!')
    console.log('\nNow your kurta products should show size selection in exhibition management!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error)
    process.exit(1)
  })

// 🚀 USAGE:
// 1. Save as scripts/add-missing-sizetype-field.ts
// 2. Run: npx tsx scripts/add-missing-sizetype-field.ts
// 3. Run: npx prisma generate
// 4. Restart server and test