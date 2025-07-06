// src/components/admin/ProductsData.tsx
// ✅ FINAL FIX: Correct status field handling (no null checks)

import { db } from '@/lib/db'
import ProductsTable from '@/components/admin/ProductsTable'
import { Card, CardContent } from '@/components/ui'
import { Search, AlertTriangle, Package, Plus } from 'lucide-react'

interface ProductsDataProps {
  searchQuery?: string
  categoryFilter?: string
  statusFilter?: string
  stockFilter?: string
}

export default async function ProductsData({ 
  searchQuery, 
  categoryFilter,
  statusFilter,
  stockFilter
}: ProductsDataProps) {
  try {
    // ✅ FIXED: Build dynamic where clause correctly (no null status checks)
    const whereClause: any = {}
    
    // Search across multiple fields
    if (searchQuery && searchQuery.trim() !== '') {
      whereClause.OR = [
        { name: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { sku: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { description: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { shortDescription: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { tags: { has: searchQuery.trim().toLowerCase() } }
      ]
    }
    
    // Category filter
    if (categoryFilter && categoryFilter.trim() !== '') {
      whereClause.categoryId = categoryFilter
    }

    // ✅ FIXED: Status filters using proper enum values (no null checks)
    if (statusFilter) {
      switch (statusFilter) {
        case 'draft':
          whereClause.status = 'DRAFT'
          break
        case 'published':
          whereClause.status = 'PUBLISHED'
          break
        case 'archived':
          whereClause.status = 'ARCHIVED'
          break
        case 'featured':
          // Featured products must be published
          whereClause.AND = [
            { isFeatured: true },
            { status: 'PUBLISHED' }
          ]
          break
        // Backward compatibility filters
        case 'active':
          whereClause.isActive = true
          break
        case 'inactive':
          whereClause.isActive = false
          break
      }
    }

    // Stock filters
    if (stockFilter) {
      switch (stockFilter) {
        case 'in-stock':
          whereClause.stockQuantity = { gt: 0 }
          break
        case 'low-stock':
          // Handle separately with raw query
          break
        case 'out-of-stock':
          whereClause.stockQuantity = { lte: 0 }
          break
      }
    }

    // ✅ FIXED: Handle low stock filter with proper status handling
    let products
    if (stockFilter === 'low-stock') {
      // Build status condition for raw query
      let statusCondition = 'TRUE' // Default to all products
      
      if (statusFilter === 'draft') {
        statusCondition = `p.status = 'DRAFT'`
      } else if (statusFilter === 'published') {
        statusCondition = `p.status = 'PUBLISHED'`
      } else if (statusFilter === 'archived') {
        statusCondition = `p.status = 'ARCHIVED'`
      } else if (statusFilter === 'featured') {
        statusCondition = `p.status = 'PUBLISHED' AND p."isFeatured" = true`
      }

      const searchCondition = searchQuery 
        ? `AND (
          p.name ILIKE '%${searchQuery}%' OR 
          p.sku ILIKE '%${searchQuery}%' OR 
          p.description ILIKE '%${searchQuery}%'
        )`
        : ''

      const categoryCondition = categoryFilter 
        ? `AND p."categoryId" = '${categoryFilter}'`
        : ''

      products = await db.$queryRaw`
        SELECT p.*, 
               c.name as category_name,
               c.slug as category_slug,
               country.name as country_name,
               country.currency as country_currency,
               country."currencySymbol" as country_currency_symbol,
               s.name as supplier_name
        FROM products p
        INNER JOIN categories c ON p."categoryId" = c.id
        INNER JOIN countries country ON p."countryId" = country.id
        INNER JOIN suppliers s ON p."supplierId" = s.id
        WHERE ${statusCondition}
        AND p."stockQuantity" <= p."lowStockAlert"
        AND p."stockQuantity" > 0
        ${searchCondition}
        ${categoryCondition}
        ORDER BY p."stockQuantity" ASC, p."updatedAt" DESC
      `

      // Transform raw query results
      products = (products as any[]).map(product => ({
        ...product,
        category: {
          id: product.categoryId,
          name: product.category_name,
          slug: product.category_slug
        },
        country: {
          id: product.countryId,
          name: product.country_name,
          currency: product.country_currency,
          currencySymbol: product.country_currency_symbol
        },
        supplier: {
          id: product.supplierId,
          name: product.supplier_name
        }
      }))
    } else {
      // ✅ FIXED: Normal Prisma query with proper status handling
      products = await db.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          country: {
            select: {
              id: true,
              name: true,
              currency: true,
              currencySymbol: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { isFeatured: 'desc' },
          { stockQuantity: 'desc' },
          { updatedAt: 'desc' }
        ]
      })
    }

    console.log(`✅ Found ${products.length} products with filters:`, {
      searchQuery,
      categoryFilter,
      statusFilter,
      stockFilter,
      whereClause: JSON.stringify(whereClause, null, 2)
    })

    return <ProductsTable products={products} statusFilter={statusFilter} />

  } catch (error) {
    console.error('❌ Error fetching products:', error)
    
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Products
          </h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Unable to fetch products at this time.'}
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg text-left">
            <p><strong>Error Details:</strong></p>
            <p className="font-mono text-xs bg-red-50 p-2 rounded mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <p className="mt-2"><strong>Debug Info:</strong></p>
            <p>Search: {searchQuery || 'None'}</p>
            <p>Category: {categoryFilter || 'All'}</p>
            <p>Status: {statusFilter || 'All'}</p>
            <p>Stock: {stockFilter || 'All'}</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Note:</strong> Check if your database has products. If empty, add some products to test the filtering.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
}