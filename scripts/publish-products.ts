// scripts/publish-products.ts
// Quick script to publish existing products

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function publishExistingProducts() {
  console.log('🚀 Publishing existing products for customers...')
  
  try {
    // Check current status distribution
    const statusCounts = await prisma.product.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    console.log('\n📊 Current Product Status Distribution:')
    statusCounts.forEach(({ status, _count }) => {
      console.log(`   ${status}: ${_count.status}`)
    })

    // Find products that should be published
    const productsToPublish = await prisma.product.findMany({
      where: {
        AND: [
          { isActive: true },           // Products marked as active
          { stockQuantity: { gt: 0 } }, // Products with stock
          { status: 'DRAFT' }           // Currently in draft status
        ]
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        createdAt: true
      }
    })

    console.log(`\n🔧 Found ${productsToPublish.length} products to publish`)

    if (productsToPublish.length === 0) {
      console.log('✅ No products need publishing')
      
      // Check if there are any published products
      const publishedCount = await prisma.product.count({
        where: {
          status: 'PUBLISHED',
          stockQuantity: { gt: 0 }
        }
      })
      
      console.log(`📦 Products already visible to customers: ${publishedCount}`)
      
      if (publishedCount === 0) {
        console.log('\n⚠️  No products are visible to customers!')
        console.log('💡 This might be why customers can\'t see any products.')
        
        // Show all active products regardless of status
        const activeProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            stockQuantity: { gt: 0 }
          },
          select: {
            id: true,
            name: true,
            status: true,
            stockQuantity: true
          },
          take: 5
        })
        
        console.log('\n📋 Active products that could be published:')
        activeProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (Status: ${product.status}, Stock: ${product.stockQuantity})`)
        })
        
        if (activeProducts.length > 0) {
          console.log('\n🚀 Would you like to publish these? Update the script to force publish all active products.')
        }
      }
      
      return
    }

    // Show which products will be published
    console.log('\n📋 Products that will be published:')
    productsToPublish.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.sku}) - Stock: ${product.stockQuantity}`)
    })

    // Publish the products
    const publishResult = await prisma.product.updateMany({
      where: {
        id: {
          in: productsToPublish.map(p => p.id)
        }
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })

    console.log(`\n🎉 Successfully published ${publishResult.count} products!`)

    // Verify the results
    const visibleProducts = await prisma.product.count({
      where: {
        status: 'PUBLISHED',
        stockQuantity: { gt: 0 }
      }
    })

    console.log(`\n✅ Products now visible to customers: ${visibleProducts}`)

    // Show sample published products
    const samplePublished = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        stockQuantity: { gt: 0 }
      },
      select: {
        name: true,
        sku: true,
        stockQuantity: true
      },
      take: 5
    })

    console.log('\n📦 Sample products now visible to customers:')
    samplePublished.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.sku}) - Stock: ${product.stockQuantity}`)
    })

  } catch (error) {
    console.error('❌ Publishing failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Also create a function to force publish ALL active products
async function forcePublishAllActiveProducts() {
  console.log('🚀 Force publishing ALL active products...')
  
  try {
    const result = await prisma.product.updateMany({
      where: {
        isActive: true
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })

    console.log(`✅ Force published ${result.count} products!`)
    
    const visibleCount = await prisma.product.count({
      where: {
        status: 'PUBLISHED'
      }
    })
    
    console.log(`📦 Total products now visible to customers: ${visibleCount}`)
    
  } catch (error) {
    console.error('❌ Force publishing failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the appropriate function based on command line argument
const forcePublish = process.argv.includes('--force')

if (require.main === module) {
  const publishFunction = forcePublish ? forcePublishAllActiveProducts : publishExistingProducts
  
  publishFunction()
    .then(() => {
      console.log('\n✨ Product publishing completed!')
      console.log('🌐 Your customers should now be able to see products!')
      console.log('🔗 Test: Visit http://localhost:3001/ to see products')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Publishing failed:', error)
      process.exit(1)
    })
}

export { publishExistingProducts, forcePublishAllActiveProducts }