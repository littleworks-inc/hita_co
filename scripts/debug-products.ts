// ✅ DEBUGGING SCRIPT: scripts/debug-products.ts
// Run with: npx tsx scripts/debug-products.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugProducts() {
  console.log('🔍 DEBUGGING PRODUCTS DATABASE...\n')

  try {
    // 1. Check total product count
    const totalProducts = await prisma.product.count()
    console.log(`📊 Total products in database: ${totalProducts}`)

    if (totalProducts === 0) {
      console.log('❌ No products found in database!')
      console.log('💡 You need to create products first via admin panel')
      return
    }

    // 2. Check products by status
    const statusCounts = await prisma.product.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    console.log('\n📈 Product Status Distribution:')
    statusCounts.forEach(({ status, _count }) => {
      console.log(`   ${status || 'NULL'}: ${_count.status}`)
    })

    // 3. Show first 5 products with key details
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        isActive: true,
        stockQuantity: true,
        requiresSizes: true,
        images: true,
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('\n📋 Recent Products (First 5):')
    sampleProducts.forEach((product, index) => {
      const slug = generateProductSlug(product.name, product.sku)
      console.log(`   ${index + 1}. "${product.name}"`)
      console.log(`      SKU: ${product.sku}`)
      console.log(`      Status: ${product.status || 'NULL'} | Active: ${product.isActive}`)
      console.log(`      Stock: ${product.stockQuantity} | Sizes: ${product.requiresSizes}`)
      console.log(`      Images: ${product.images?.length || 0}`)
      console.log(`      Category: ${product.category?.name}`)
      console.log(`      Expected URL: /products/${slug}`)
      console.log(`      Direct SKU URL: /products/${product.sku}`)
      console.log('')
    })

    // 4. Check for the specific kurta product
    console.log('🔍 Looking for KURTA products specifically:')
    const kurtaProducts = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: 'KURT', mode: 'insensitive' } },
          { name: { contains: 'kurta', mode: 'insensitive' } },
          { sku: '790016' },
          { sku: 'HC-KURT-790016' }
        ]
      },
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        isActive: true,
        stockQuantity: true,
        productSizes: {
          select: {
            id: true,
            size: true,
            stockQuantity: true,
            isActive: true
          }
        }
      }
    })

    if (kurtaProducts.length > 0) {
      console.log(`✅ Found ${kurtaProducts.length} kurta product(s):`)
      kurtaProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. "${product.name}" (${product.sku})`)
        console.log(`      Status: ${product.status} | Active: ${product.isActive}`)
        console.log(`      Main Stock: ${product.stockQuantity}`)
        if (product.productSizes?.length > 0) {
          console.log(`      Sizes:`)
          product.productSizes.forEach(size => {
            console.log(`        - ${size.size}: ${size.stockQuantity} (Active: ${size.isActive})`)
          })
        }
        console.log('')
      })
    } else {
      console.log('❌ No kurta products found!')
    }

    // 5. Check published products visible to customers
    const publishedProducts = await prisma.product.findMany({
      where: {
        OR: [
          { status: 'PUBLISHED' },
          { 
            AND: [
              { status: null },
              { isActive: true }
            ]
          }
        ],
        stockQuantity: { gt: 0 }
      },
      select: {
        name: true,
        sku: true,
        stockQuantity: true
      },
      take: 3
    })

    console.log(`\n🌐 Products visible to customers: ${publishedProducts.length}`)
    if (publishedProducts.length > 0) {
      publishedProducts.forEach((product, index) => {
        const slug = generateProductSlug(product.name, product.sku)
        console.log(`   ${index + 1}. ${product.name} - /products/${slug}`)
      })
    } else {
      console.log('❌ No products are currently visible to customers!')
      console.log('💡 Products need to be:')
      console.log('   - Status: PUBLISHED (or legacy isActive: true)')
      console.log('   - Stock quantity > 0')
    }

  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function to generate product slug
function generateProductSlug(name: string, sku: string): string {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
  
  return `${nameSlug}-${sku}`
}

// Run the debugging
debugProducts()
  .then(() => {
    console.log('✅ Product debugging completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Debugging failed:', error)
    process.exit(1)
  })