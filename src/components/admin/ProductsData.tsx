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
    // Build dynamic where clause for the new draft system
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

    // Enhanced Status filters with draft system support
    if (statusFilter) {
      switch (statusFilter) {
        case 'draft':
          // Products in draft state (new system) or using backward compatibility
          whereClause.OR = [
            { status: 'DRAFT' },
            { 
              AND: [
                { status: null }, // Legacy products without status
                { isActive: true } // But treating as drafts for now
              ]
            }
          ]
          break
        case 'published':
          // Published products (visible to customers)
          whereClause.OR = [
            { status: 'PUBLISHED' },
            { 
              AND: [
                { status: null }, // Legacy products
                { isActive: true }
              ]
            }
          ]
          break
        case 'archived':
          // Archived products (hidden but preserved)
          whereClause.OR = [
            { status: 'ARCHIVED' },
            { 
              AND: [
                { status: null }, // Legacy products
                { isActive: false }
              ]
            }
          ]
          break
        case 'featured':
          // Featured products (must be published)
          whereClause.isFeatured = true
          whereClause.OR = [
            { status: 'PUBLISHED' },
            { 
              AND: [
                { status: null },
                { isActive: true }
              ]
            }
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

    // Stock filters (unchanged but enhanced)
    if (stockFilter) {
      switch (stockFilter) {
        case 'in-stock':
          whereClause.stockQuantity = { gt: 0 }
          // Only show in-stock for published/active products
          if (!statusFilter || statusFilter === 'published') {
            whereClause.OR = [
              { status: 'PUBLISHED' },
              { 
                AND: [
                  { status: null },
                  { isActive: true }
                ]
              }
            ]
          }
          break
        case 'low-stock':
          // This requires a raw query - handle separately below
          break
        case 'out-of-stock':
          whereClause.stockQuantity = { lte: 0 }
          break
      }
    }

    // Handle low stock filter with raw query (enhanced for draft system)
    let products
    if (stockFilter === 'low-stock') {
      // Use raw query to compare stockQuantity with lowStockAlert
      const statusCondition = statusFilter === 'draft' 
        ? `(p.status = 'DRAFT' OR (p.status IS NULL AND p."isActive" = true))`
        : statusFilter === 'published'
        ? `(p.status = 'PUBLISHED' OR (p.status IS NULL AND p."isActive" = true))`
        : statusFilter === 'archived'
        ? `(p.status = 'ARCHIVED' OR (p.status IS NULL AND p."isActive" = false))`
        : `(p.status IS NOT NULL OR p."isActive" = true)` // Default to active products

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
        },
        supplier: {
          id: p.supplierId,
          name: p.supplier_name
        }
      }))
    } else {
      // Standard Prisma query with enhanced draft system support
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
          // Sort by status (Published first, then Draft, then Archived)
          { status: 'asc' },
          // Then prioritize featured products
          { isFeatured: 'desc' },
          // Then by stock status (out of stock last)
          { stockQuantity: 'desc' },
          // Finally by update date (most recent first)
          { updatedAt: 'desc' }
        ]
      })
    }

    // Calculate enhanced statistics for draft system
    const totalResults = products.length
    
    // Count by status (enhanced for draft system)
    const statusCounts = {
      draft: products.filter((p: any) => 
        p.status === 'DRAFT' || (p.status === null && p.isActive === true && !isPublishReady(p))
      ).length,
      published: products.filter((p: any) => 
        p.status === 'PUBLISHED' || (p.status === null && p.isActive === true && isPublishReady(p))
      ).length,
      archived: products.filter((p: any) => 
        p.status === 'ARCHIVED' || (p.status === null && p.isActive === false)
      ).length,
      featured: products.filter((p: any) => p.isFeatured && p.isActive).length
    }

    // Stock-related counts
    const stockCounts = {
      inStock: products.filter((p: any) => p.stockQuantity > p.lowStockAlert).length,
      lowStock: products.filter((p: any) => 
        p.stockQuantity <= p.lowStockAlert && p.stockQuantity > 0
      ).length,
      outOfStock: products.filter((p: any) => p.stockQuantity <= 0).length
    }

    return (
      <div className="space-y-4">
        {/* Enhanced Results Summary with Draft System Info */}
        {(searchQuery || categoryFilter || statusFilter || stockFilter) && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Results
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {totalResults} product{totalResults !== 1 ? 's' : ''}
                    {searchQuery && ` matching "${searchQuery}"`}
                    {categoryFilter && ` in selected category`}
                    {statusFilter && ` with ${statusFilter} status`}
                    {stockFilter && ` with ${stockFilter.replace('-', ' ')} stock`}
                  </p>
                </div>
                
                <div className="text-right text-xs space-y-1">
                  {statusFilter ? (
                    <div className="text-blue-600">
                      <div>Total: {totalResults}</div>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">Draft: {statusCounts.draft}</span>
                        <span className="text-green-600">Published: {statusCounts.published}</span>
                        <span className="text-orange-600">Archived: {statusCounts.archived}</span>
                      </div>
                    </div>
                  )}
                  
                  {stockCounts.lowStock > 0 && (
                    <div className="text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {stockCounts.lowStock} low stock
                    </div>
                  )}
                  {stockCounts.outOfStock > 0 && (
                    <div className="text-red-600 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {stockCounts.outOfStock} out of stock
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results State */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || categoryFilter || statusFilter || stockFilter
                  ? "Try adjusting your search filters or create a new product."
                  : "Get started by adding your first product to the system."
                }
              </p>
              <a 
                href="/admin/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </a>
            </CardContent>
          </Card>
        ) : (
          <ProductsTable 
            products={products}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
          />
        )}
      </div>
    )
  } catch (error) {
    console.error('Error fetching products:', error)
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Products</h3>
          <p className="text-red-600 mb-6">
            There was an error loading the products. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </CardContent>
      </Card>
    )
  }
}

// Helper function to check if a product is ready for publishing (backward compatibility)
function isPublishReady(product: any): boolean {
  return !!(
    product.description && 
    product.description.length >= 10 &&
    product.images && 
    product.images.length > 0 &&
    product.sellingPriceUSD && 
    product.sellingPriceUSD > 0 &&
    product.stockQuantity !== undefined &&
    product.stockQuantity >= 0
  )
}