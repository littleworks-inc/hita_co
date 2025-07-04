// scripts/diagnose-database.ts
// =====================================
// 🔍 Diagnose Database Connection and Products
// This will help us understand why the kurta isn't showing up
// =====================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnoseDatabase() {
  console.log('🔍 Diagnosing database connection and products...\n')

  try {
    // Test basic database connection
    console.log('1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check database name and basic info
    console.log('\n2️⃣ Checking database info...')
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version();` as any[]
    console.log(`   Database: ${dbInfo[0].current_database}`)
    console.log(`   User: ${dbInfo[0].current_user}`)

    // Check if tables exist
    console.log('\n3️⃣ Checking if tables exist...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    ` as Array<{table_name: string}>

    console.log(`   Found ${tables.length} tables:`)
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`)
    })

    const requiredTables = ['products', 'categories', 'countries', 'suppliers', 'product_sizes']
    const missingTables = requiredTables.filter(table => 
      !tables.some(t => t.table_name === table)
    )

    if (missingTables.length > 0) {
      console.log(`   ❌ Missing tables: ${missingTables.join(', ')}`)
    } else {
      console.log('   ✅ All required tables exist')
    }

    // Check product count with raw SQL
    console.log('\n4️⃣ Checking products with raw SQL...')
    try {
      const productCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products;` as Array<{count: number}>
      console.log(`   Raw SQL product count: ${productCount[0]?.count || 0}`)

      if (productCount[0]?.count > 0) {
        const products = await prisma.$queryRaw`
          SELECT id, name, sku, "requiresSizes", "sizeType" 
          FROM products 
          LIMIT 10;
        ` as Array<any>

        console.log('   Products found:')
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (${product.sku})`)
          console.log(`      Requires Sizes: ${product.requiresSizes}`)
          console.log(`      Size Type: ${product.sizeType}`)
        })
      }
    } catch (error) {
      console.log(`   ❌ Error querying products: ${error}`)
    }

    // Check product count with Prisma
    console.log('\n5️⃣ Checking products with Prisma...')
    try {
      const prismaProductCount = await prisma.product.count()
      console.log(`   Prisma product count: ${prismaProductCount}`)

      if (prismaProductCount > 0) {
        const prismaProducts = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            sku: true,
            requiresSizes: true,
            sizeType: true
          },
          take: 10
        })

        console.log('   Prisma products:')
        prismaProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (${product.sku})`)
          console.log(`      Requires Sizes: ${product.requiresSizes}`)
          console.log(`      Size Type: ${product.sizeType}`)
        })
      }
    } catch (error) {
      console.log(`   ❌ Error with Prisma products: ${error}`)
    }

    // Look specifically for kurta
    console.log('\n6️⃣ Looking specifically for kurta products...')
    try {
      const kurtaSearch = await prisma.$queryRaw`
        SELECT * FROM products 
        WHERE LOWER(name) LIKE '%kurta%' OR LOWER(sku) LIKE '%kurt%'
        LIMIT 5;
      ` as Array<any>

      if (kurtaSearch.length > 0) {
        console.log(`   Found ${kurtaSearch.length} kurta products:`)
        kurtaSearch.forEach(kurta => {
          console.log(`   📦 ${kurta.name} (${kurta.sku})`)
          console.log(`      ID: ${kurta.id}`)
          console.log(`      Requires Sizes: ${kurta.requiresSizes}`)
          console.log(`      Active: ${kurta.isActive}`)
        })
      } else {
        console.log('   ❌ No kurta products found in database')
      }
    } catch (error) {
      console.log(`   ❌ Error searching for kurtas: ${error}`)
    }

    // Check product sizes
    console.log('\n7️⃣ Checking product sizes...')
    try {
      const sizeCount = await prisma.productSize.count()
      console.log(`   Total product sizes: ${sizeCount}`)

      if (sizeCount > 0) {
        const sizes = await prisma.productSize.findMany({
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          },
          take: 10
        })

        console.log('   Product sizes:')
        sizes.forEach(size => {
          console.log(`   📏 ${size.product.name} - Size ${size.size} (${size.sku})`)
          console.log(`      Stock: ${size.stockQuantity}`)
        })
      }
    } catch (error) {
      console.log(`   ❌ Error checking product sizes: ${error}`)
    }

    // Check categories
    console.log('\n8️⃣ Checking categories...')
    try {
      const categoryCount = await prisma.category.count()
      console.log(`   Total categories: ${categoryCount}`)

      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          defaultRequiresSizes: true,
          defaultSizeType: true
        }
      })

      categories.forEach(category => {
        console.log(`   📂 ${category.name}`)
        console.log(`      Default Requires Sizes: ${category.defaultRequiresSizes}`)
        console.log(`      Default Size Type: ${category.defaultSizeType}`)
      })
    } catch (error) {
      console.log(`   ❌ Error checking categories: ${error}`)
    }

    console.log('\n📋 DIAGNOSIS SUMMARY:')
    console.log('✅ Database connection works')
    
    if (tables.find(t => t.table_name === 'products')) {
      console.log('✅ Products table exists')
    } else {
      console.log('❌ Products table missing')
    }

    const productCount = await prisma.product.count().catch(() => 0)
    if (productCount > 0) {
      console.log(`✅ Found ${productCount} products in database`)
    } else {
      console.log('❌ No products found in database')
      console.log('\n💡 This explains why the kurta isn\'t showing up!')
      console.log('   The kurta you see in the customer portal might be:')
      console.log('   1. In a different database')
      console.log('   2. Using a different DATABASE_URL')
      console.log('   3. Cached data in the frontend')
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseDatabase()

// 🚀 USAGE:
// 1. Save as scripts/diagnose-database.ts
// 2. Run: npx tsx scripts/diagnose-database.ts