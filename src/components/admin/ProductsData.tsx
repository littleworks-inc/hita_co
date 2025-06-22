import { db } from '@/lib/db'
import ProductsTable from '@/components/admin/ProductsTable'
import ProductsNoResults from '@/components/admin/ProductsNoResults'
import ProductsError from '@/components/admin/ProductsError'
import { Search, AlertTriangle } from 'lucide-react'

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
    // Build dynamic where clause
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

    // Status filters
    if (statusFilter) {
      switch (statusFilter) {
        case 'active':
          whereClause.isActive = true
          break
        case 'inactive':
          whereClause.isActive = false
          break
        case 'featured':
          whereClause.isFeatured = true
          whereClause.isActive = true // Featured items should also be active
          break
      }
    }

    // Stock filters
    if (stockFilter) {
      switch (stockFilter) {
        case 'in-stock':
          whereClause.stockQuantity = { gt: 0 }
          whereClause.isActive = true
          break
        case 'low-stock':
          // Products where stock is at or below their low stock alert
          whereClause.isActive = true
          // We'll use a raw query for this complex condition
          break
        case 'out-of-stock':
          whereClause.stockQuantity = { lte: 0 }
          break
      }
    }

    // Handle low stock filter separately due to complexity
    let products
    if (stockFilter === 'low-stock') {
      // Use raw query to compare stockQuantity with lowStockAlert
      products = await db.$queryRaw`
        SELECT p.*, 
               c.name as category_name,
               c.slug as category_slug,
               country.name as country_name,
               country.currency as country_currency,
               country."currencySymbol" as country_currency_symbol
        FROM products p
        INNER JOIN categories c ON p."categoryId" = c.id
        INNER JOIN countries country ON p."countryId" = country.id
        WHERE p."isActive" = true 
        AND p."stockQuantity" <= p."lowStockAlert"
        AND p."stockQuantity" > 0
        ${searchQuery ? `AND (
          p.name ILIKE ${'%' + searchQuery + '%'} OR 
          p.sku ILIKE ${'%' + searchQuery + '%'} OR 
          p.description ILIKE ${'%' + searchQuery + '%'}
        )` : ''}
        ${categoryFilter ? `AND p."categoryId" = '${categoryFilter}'` : ''}
        ORDER BY p."stockQuantity" ASC, p."createdAt" DESC
      ` as any[]

      // Transform raw query results to match Prisma format
      products = products.map((p: any) => ({
        ...p,
        category: {
          id: p.categoryId,
          name: p.category_name,
          slug: p.category_slug
        },
        country: {
          id: p.countryId,
          name: p.country_name,
          currency: p.country_currency,
          currencySymbol: p.country_currency_symbol
        }
      }))
    } else {
      // Standard Prisma query
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
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        orderBy: [
          // Prioritize featured products
          { isFeatured: 'desc' },
          // Then by stock status (out of stock last)
          { stockQuantity: 'desc' },
          // Finally by creation date
          { createdAt: 'desc' }
        ]
      })
    }

    // Calculate some additional stats for the results
    const totalResults = products.length
    const activeCount = products.filter((p: any) => p.isActive).length
    const lowStockCount = products.filter((p: any) => 
      p.isActive && p.stockQuantity <= p.lowStockAlert && p.stockQuantity > 0
    ).length
    const outOfStockCount = products.filter((p: any) => p.stockQuantity <= 0).length

    return (
      <div className="space-y-4">
        {/* Results Summary */}
        {(searchQuery || categoryFilter || statusFilter || stockFilter) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Search Results
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Found {totalResults} product{totalResults !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {categoryFilter && ` in selected category`}
                </p>
              </div>
              <div className="text-right text-xs text-blue-600">
                <div>Active: {activeCount}</div>
                {lowStockCount > 0 && <div className="text-orange-600">Low Stock: {lowStockCount}</div>}
                {outOfStockCount > 0 && <div className="text-red-600">Out of Stock: {outOfStockCount}</div>}
              </div>
            </div>
          </div>
        )}

        {/* No Results State */}
        {products.length === 0 ? (
          <ProductsNoResults 
            hasFilters={!!(searchQuery || categoryFilter || statusFilter || stockFilter)}
            searchQuery={searchQuery}
          />
        ) : (
          <ProductsTable 
            products={products}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            showResultsCount={true}
          />
        )}
      </div>
    )
  } catch (error) {
    console.error('Error fetching products:', error)
    return <ProductsError error={error} />
  }
}