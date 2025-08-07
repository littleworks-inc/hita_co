// =====================================
// src/app/api/admin/stock-sync/route.ts - Stock Sync Management API
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db' // ✅ ADDED: Missing db import
import { syncAllProductsStock, syncProductStock, syncMultipleProductsStock } from '@/lib/stock-sync'
import { withRateLimiting } from '@/lib/rate-limit'

// POST /api/admin/stock-sync - Trigger stock synchronization
export const POST = withRateLimiting({ interval: 60000, maxRequests: 5 })(
  async (request: NextRequest) => {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, productIds } = body

    let result

    switch (type) {
      case 'all':
        // Sync all products
        result = await syncAllProductsStock()
        break

      case 'single':
        // Sync single product
        if (!productIds || productIds.length !== 1) {
          return NextResponse.json({
            error: 'Single product sync requires exactly one product ID'
          }, { status: 400 })
        }
        const singleResult = await syncProductStock(productIds[0])
        result = {
          totalProcessed: 1,
          successCount: singleResult.success ? 1 : 0,
          errorCount: singleResult.success ? 0 : 1,
          results: [singleResult]
        }
        break

      case 'multiple':
        // Sync multiple products
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
          return NextResponse.json({
            error: 'Multiple product sync requires array of product IDs'
          }, { status: 400 })
        }
        const multipleResults = await syncMultipleProductsStock(productIds)
        result = {
          totalProcessed: multipleResults.length,
          successCount: multipleResults.filter(r => r.success).length,
          errorCount: multipleResults.filter(r => !r.success).length,
          results: multipleResults
        }
        break

      default:
        return NextResponse.json({
          error: 'Invalid sync type. Use "all", "single", or "multiple"'
        }, { status: 400 })
    }

    console.log(`Stock sync completed: ${result.successCount} success, ${result.errorCount} errors`)

    return NextResponse.json({
      message: 'Stock synchronization completed',
      summary: {
        totalProcessed: result.totalProcessed,
        successCount: result.successCount,
        errorCount: result.errorCount,
        fixed: result.results.filter(r => r.success && r.previousStock !== r.newStock).length,
        noChangeNeeded: result.results.filter(r => r.success && r.previousStock === r.newStock).length
      },
      details: result.results
    })

  } catch (error) {
    console.error('Error in stock sync API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
)

// GET /api/admin/stock-sync/status - Check stock sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'

    // Get products with potential stock issues
    const products = await db.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        requiresSizes: true,
        status: true,
        productSizes: {
          select: {
            stockQuantity: true,
            isActive: true
          }
        }
      },
      where: {
        requiresSizes: true // Only check sized products
      }
    })

    const analysisResults = products.map(product => {
      const calculatedStock = product.productSizes
        ?.filter(size => size.isActive)
        ?.reduce((total, size) => total + size.stockQuantity, 0) || 0
      
      const needsSync = product.stockQuantity !== calculatedStock
      
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        status: product.status,
        currentStock: product.stockQuantity,
        calculatedStock,
        needsSync,
        hasSizes: product.requiresSizes,
        sizeCount: product.productSizes?.length || 0
      }
    })

    const summary = {
      totalSizedProducts: products.length,
      productsNeedingSync: analysisResults.filter(p => p.needsSync).length,
      productsSynced: analysisResults.filter(p => !p.needsSync).length,
      publishedProductsNeedingSync: analysisResults.filter(p => p.needsSync && p.status === 'PUBLISHED').length
    }

    const response: any = {
      summary,
      lastChecked: new Date().toISOString()
    }

    if (detailed) {
      response.products = analysisResults
      response.problemProducts = analysisResults.filter(p => p.needsSync)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error checking stock sync status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}