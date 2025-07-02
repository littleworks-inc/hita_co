// =====================================
// src/lib/stock-sync.ts - Stock Synchronization Utility
// =====================================

import { db } from '@/lib/db'

export interface StockSyncResult {
  productId: string
  previousStock: number
  newStock: number
  hasSizes: boolean
  success: boolean
  error?: string
}

export interface ProductStockData {
  id: string
  stockQuantity: number
  requiresSizes: boolean
  productSizes?: {
    stockQuantity: number
    isActive: boolean
  }[]
}

/**
 * Calculate the correct stock quantity for a product
 * For sized products: sum of all active size quantities
 * For non-sized products: return existing stockQuantity
 */
export function calculateProductStock(product: ProductStockData): number {
  if (product.requiresSizes && product.productSizes?.length) {
    // Sum only active size quantities
    return product.productSizes
      .filter(size => size.isActive)
      .reduce((total, size) => total + size.stockQuantity, 0)
  }
  
  // For non-sized products, return existing stock
  return product.stockQuantity
}

/**
 * Sync stock for a single product
 */
export async function syncProductStock(productId: string): Promise<StockSyncResult> {
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

/**
 * Sync stock for multiple products
 */
export async function syncMultipleProductsStock(productIds: string[]): Promise<StockSyncResult[]> {
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

/**
 * Sync stock for all products in the system
 */
export async function syncAllProductsStock(): Promise<{
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

/**
 * Hook function to automatically sync stock after size changes
 * Call this after creating, updating, or deleting product sizes
 */
export async function autoSyncAfterSizeChange(productId: string): Promise<void> {
  try {
    await syncProductStock(productId)
  } catch (error) {
    // Log error but don't throw to avoid breaking the main operation
    console.error(`Auto-sync failed for product ${productId}:`, error)
  }
}