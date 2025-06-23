// src/app/api/admin/products/migrate-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Starting Product Status Migration...')

    // Get all products that don't have the new status field set
    const productsToMigrate = await db.product.findMany({
      where: {
        OR: [
          { status: null },
          { status: { equals: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log(`📊 Found ${productsToMigrate.length} products to migrate`)

    if (productsToMigrate.length === 0) {
      return NextResponse.json({
        message: 'No products need migration',
        migrated: 0,
        alreadyMigrated: await db.product.count()
      })
    }

    let publishedCount = 0
    let archivedCount = 0
    const errors: string[] = []

    // Update products in batches for better performance
    const batchSize = 50
    for (let i = 0; i < productsToMigrate.length; i += batchSize) {
      const batch = productsToMigrate.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (product) => {
        try {
          if (product.isActive) {
            // Active products → PUBLISHED
            await db.product.update({
              where: { id: product.id },
              data: {
                status: 'PUBLISHED',
                publishedAt: product.createdAt // Use creation date as published date
              }
            })
            publishedCount++
            console.log(`✅ ${product.name} → PUBLISHED`)
          } else {
            // Inactive products → ARCHIVED
            await db.product.update({
              where: { id: product.id },
              data: {
                status: 'ARCHIVED',
                archivedAt: new Date()
              }
            })
            archivedCount++
            console.log(`📦 ${product.name} → ARCHIVED`)
          }
        } catch (error) {
          const errorMsg = `Failed to migrate ${product.name}: ${error}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }))
    }

    console.log('\n🎉 Migration completed!')
    console.log(`📈 ${publishedCount} products set to PUBLISHED`)
    console.log(`📦 ${archivedCount} products set to ARCHIVED`)

    // Verify the migration
    const finalStatusCounts = await db.product.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    console.log('\n📊 Final Status Distribution:')
    const statusSummary: Record<string, number> = {}
    finalStatusCounts.forEach(({ status, _count }) => {
      statusSummary[status || 'NULL'] = _count.status
      console.log(`   ${status}: ${_count.status}`)
    })

    return NextResponse.json({
      message: 'Migration completed successfully',
      migrated: publishedCount + archivedCount,
      published: publishedCount,
      archived: archivedCount,
      errors: errors.length > 0 ? errors : undefined,
      statusDistribution: statusSummary
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check migration status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check how many products need migration
    const [totalProducts, migratedProducts, statusCounts] = await Promise.all([
      db.product.count(),
      db.product.count({
        where: {
          status: {
            not: null
          }
        }
      }),
      db.product.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ])

    const needsMigration = totalProducts - migratedProducts

    const statusDistribution: Record<string, number> = {}
    statusCounts.forEach(({ status, _count }) => {
      statusDistribution[status || 'NULL'] = _count.status
    })

    return NextResponse.json({
      totalProducts,
      migratedProducts,
      needsMigration,
      migrationComplete: needsMigration === 0,
      statusDistribution
    })

  } catch (error) {
    console.error('Migration status check error:', error)
    return NextResponse.json({
      error: 'Failed to check migration status'
    }, { status: 500 })
  }
}