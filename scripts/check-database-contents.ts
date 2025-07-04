// scripts/check-database-contents.ts
// Quick script to see what's actually in your database

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseContents() {
  console.log('🔍 Checking actual database contents...\n')

  try {
    // Check categories
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    console.log('📁 CATEGORIES:')
    console.log(`   Total: ${categories.length}`)
    if (categories.length > 0) {
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat._count.products} products)`)
      })
    } else {
      console.log('   ❌ No categories found')
    }

    // Check products
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        country: { select: { name: true } },
        supplier: { select: { name: true } }
      }
    })

    console.log('\n📦 PRODUCTS:')
    console.log(`   Total: ${products.length}`)
    if (products.length > 0) {
      products.forEach(product => {
        console.log(`   - ${product.name} (${product.category.name}) - $${product.sellingPriceUSD}`)
      })
    } else {
      console.log('   ❌ No products found')
    }

    // Check countries
    const countries = await prisma.country.findMany()
    console.log('\n🌍 COUNTRIES:')
    console.log(`   Total: ${countries.length}`)
    countries.forEach(country => {
      console.log(`   - ${country.name} (${country.code})`)
    })

    // Check suppliers
    const suppliers = await prisma.supplier.findMany()
    console.log('\n🏢 SUPPLIERS:')
    console.log(`   Total: ${suppliers.length}`)
    suppliers.forEach(supplier => {
      console.log(`   - ${supplier.name}`)
    })

    // Check exhibitions
    const exhibitions = await prisma.exhibition.findMany()
    console.log('\n🎪 EXHIBITIONS:')
    console.log(`   Total: ${exhibitions.length}`)
    exhibitions.forEach(exhibition => {
      console.log(`   - ${exhibition.title} (${exhibition.location})`)
    })

    console.log('\n✅ Database content check complete!')

  } catch (error) {
    console.error('❌ Error checking database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseContents()
  .then(() => {
    console.log('\n🎯 If you see fake data above but expected empty database:')
    console.log('   1. Check if seed script was run accidentally')
    console.log('   2. Look for hardcoded data in your components')
    console.log('   3. Check API routes for mock data')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Database check failed:', error)
    process.exit(1)
  })