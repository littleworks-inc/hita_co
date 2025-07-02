// =====================================
// scripts/fix-stock-sync.ts - Fixed for your project structure
// Run with: npx tsx scripts/fix-stock-sync.ts
// =====================================

import { PrismaClient } from '@prisma/client'

// Create Prisma client directly (since we can't import from src/lib/db in scripts)
const db = new PrismaClient()

interface StockSyncResult {
  productId: string
  previousStock: number
  newStock: number
  hasSizes: boolean
  success: boolean
  error?: string
}

interface ProductStockData {
  id: string
  stockQuantity: number
  requiresSizes: boolean
  productSizes?: {
    stockQuantity: number
    isActive: boolean
  }[]
}

// Calculate the correct stock quantity for a product
function calculateProductStock(product: ProductStockData): number {
  if (product.requiresSizes && product.productSizes?.length) {
    // Sum only active size quantities
    return product.productSizes
      .filter(size => size.isActive)
      .reduce((total, size) => total + size.stockQuantity, 0)
  }
  
  // For non-sized products, return existing stock
  return product.stockQuantity
}

// Sync stock for a single product
async function syncProductStock(productId: string): Promise<StockSyncResult> {
  try {
    // Get product with current stock and sizes
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stockQuantity: true,
        requiresSizes: true,
        productSizes: {
          select: {
            stockQuantity: true,
            isActive: true
          }
        }
      }
    })

    if (!product) {
      return {
        productId,
        previousStock: 0,
        newStock: 0,
        hasSizes: false,
        success: false,
        error: 'Product not found'
      }
    }

    const previousStock = product.stockQuantity
    const newStock = calculateProductStock(product)

    // Only update if stock has changed
    if (previousStock !== newStock) {
      await db.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock }
      })
    }

    return {
      productId,
      previousStock,
      newStock,
      hasSizes: product.requiresSizes,
      success: true
    }
  } catch (error) {
    console.error(`Error syncing stock for product ${productId}:`, error)
    return {
      productId,
      previousStock: 0,
      newStock: 0,
      hasSizes: false,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Sync stock for multiple products
async function syncMultipleProductsStock(productIds: string[]): Promise<StockSyncResult[]> {
  const results: StockSyncResult[] = []
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 10
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(id => syncProductStock(id))
    )
    results.push(...batchResults)
    
    // Small delay between batches to be gentle on the database
    if (i + batchSize < productIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

// Sync stock for all products in the system
async function syncAllProductsStock(): Promise<{
  totalProcessed: number
  successCount: number
  errorCount: number
  results: StockSyncResult[]
}> {
  console.log('Starting stock synchronization for all products...')
  
  // Get all product IDs
  const products = await db.product.findMany({
    select: { id: true }
  })
  
  const productIds = products.map(p => p.id)
  const results = await syncMultipleProductsStock(productIds)
  
  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length
  
  console.log(`Stock sync completed: ${successCount} success, ${errorCount} errors`)
  
  return {
    totalProcessed: results.length,
    successCount,
    errorCount,
    results
  }
}

interface MigrationStats {
  totalProducts: number
  sizedProducts: number
  nonSizedProducts: number
  fixed: number
  errors: number
  noChangeNeeded: number
  results: StockSyncResult[]
}

async function runStockMigration(): Promise<MigrationStats> {
  console.log('🚀 Starting Stock Synchronization Migration...\n')

  try {
    // Get all products first for reporting
    const allProducts = await db.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        requiresSizes: true,
        stockQuantity: true,
        productSizes: {
          select: {
            stockQuantity: true,
            isActive: true
          }
        }
      }
    })

    console.log(`📊 Found ${allProducts.length} products in total`)
    
    const sizedProducts = allProducts.filter(p => p.requiresSizes)
    const nonSizedProducts = allProducts.filter(p => !p.requiresSizes)
    
    console.log(`   📦 ${sizedProducts.length} sized products (need stock sync)`)
    console.log(`   📋 ${nonSizedProducts.length} non-sized products (stock OK)\n`)

    // Show products that need fixing
    const problematicProducts = sizedProducts.filter(product => {
      const calculatedStock = product.productSizes
        ?.filter(size => size.isActive)
        ?.reduce((total, size) => total + size.stockQuantity, 0) || 0
      return product.stockQuantity !== calculatedStock
    })

    if (problematicProducts.length > 0) {
      console.log(`🚨 Found ${problematicProducts.length} products with stock sync issues:`)
      problematicProducts.forEach(product => {
        const calculatedStock = product.productSizes
          ?.filter(size => size.isActive)
          ?.reduce((total, size) => total + size.stockQuantity, 0) || 0
        console.log(`   - ${product.name} (${product.sku}): Main=${product.stockQuantity}, Should be=${calculatedStock}`)
      })
      console.log('')
    } else {
      console.log('✅ All products already have correct stock synchronization!\n')
    }

    // Run the stock synchronization
    console.log('🔄 Running stock synchronization...')
    const syncResults = await syncAllProductsStock()

    // Calculate statistics
    const fixed = syncResults.results.filter(r => r.success && r.previousStock !== r.newStock).length
    const errors = syncResults.results.filter(r => !r.success).length
    const noChangeNeeded = syncResults.results.filter(r => r.success && r.previousStock === r.newStock).length

    const stats: MigrationStats = {
      totalProducts: allProducts.length,
      sizedProducts: sizedProducts.length,
      nonSizedProducts: nonSizedProducts.length,
      fixed,
      errors,
      noChangeNeeded,
      results: syncResults.results
    }

    return stats

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

async function displayResults(stats: MigrationStats) {
  console.log('\n📈 MIGRATION RESULTS:')
  console.log('='.repeat(50))
  console.log(`📊 Total Products: ${stats.totalProducts}`)
  console.log(`📦 Sized Products: ${stats.sizedProducts}`)
  console.log(`📋 Non-sized Products: ${stats.nonSizedProducts}`)
  console.log(`✅ Fixed: ${stats.fixed}`)
  console.log(`⚠️  Errors: ${stats.errors}`)
  console.log(`➡️  No Change Needed: ${stats.noChangeNeeded}`)

  if (stats.fixed > 0) {
    console.log('\n🔧 PRODUCTS FIXED:')
    const fixedProducts = stats.results.filter(r => r.success && r.previousStock !== r.newStock)
    fixedProducts.forEach(result => {
      console.log(`   ✅ Product ${result.productId}: ${result.previousStock} → ${result.newStock} stock`)
    })
  }

  if (stats.errors > 0) {
    console.log('\n❌ ERRORS:')
    const errorProducts = stats.results.filter(r => !r.success)
    errorProducts.forEach(result => {
      console.log(`   ❌ Product ${result.productId}: ${result.error}`)
    })
  }

  console.log('\n🎉 Migration completed!')
  
  if (stats.fixed > 0) {
    console.log(`\n✨ ${stats.fixed} products now have correct stock quantities!`)
    console.log('Your products should now be visible in the customer portal.')
  }
}

// Verify the results by checking a few products
async function verifyResults() {
  console.log('\n🔍 VERIFYING RESULTS...')
  
  const sampleProducts = await db.product.findMany({
    where: { requiresSizes: true },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      productSizes: {
        select: {
          size: true,
          stockQuantity: true,
          isActive: true
        }
      }
    },
    take: 3
  })

  console.log('Sample sized products after migration:')
  sampleProducts.forEach(product => {
    const calculatedStock = product.productSizes
      ?.filter(size => size.isActive)
      ?.reduce((total, size) => total + size.stockQuantity, 0) || 0
    
    const status = product.stockQuantity === calculatedStock ? '✅' : '❌'
    console.log(`   ${status} ${product.name}: Main=${product.stockQuantity}, Calculated=${calculatedStock}`)
    
    if (product.productSizes?.length > 0) {
      product.productSizes.forEach(size => {
        console.log(`      - Size ${size.size}: ${size.stockQuantity} units`)
      })
    }
  })
}

// Main execution
async function main() {
  try {
    const stats = await runStockMigration()
    await displayResults(stats)
    await verifyResults()
    
    console.log('\n🚀 NEXT STEPS:')
    console.log('1. Check your admin products page - all products should show correct stock')
    console.log('2. Visit your customer portal - sized products should now be visible')
    console.log('3. Test adding products to cart to ensure stock validation works')
    console.log('4. Proceed with payment integration once confirmed working')
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

// Run the migration
main()