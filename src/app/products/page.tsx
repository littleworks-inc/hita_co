// src/app/products/page.tsx
// =====================================
// 🔧 FIXED: Products Page - Proper Container Layout
// =====================================

import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ProductCard from '@/components/customer/ProductCard'
import ProductFilters from '@/components/customer/ProductFilters'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import { 
  Package, 
  ArrowLeft, 
  Grid3X3, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Page props interface
interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    country?: string
    page?: string
  }
}

// Get store settings for branding
async function getStoreSettings() {
  try {
    const settings = await db.storeSetting.findFirst({ // ✅ Fixed table name (singular)
      where: { id: 'default' }
    })

    if (!settings) {
      return null
    }

    // ✅ Transform Prisma result to match component interface
    return {
      id: settings.id,
      storeName: settings.storeName,
      tagline: settings.tagline,
      logo: settings.logo,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      // Convert null to undefined for TypeScript compatibility
      disableShoppingCart: settings.disableShoppingCart ?? undefined,
      catalogModeSettings: settings.catalogModeSettings ?? undefined,
    }
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return null
  }
}

// ✅ Helper function to convert for ProductCard (only needs specific fields)
function convertForProductCard(storeSettings: Awaited<ReturnType<typeof getStoreSettings>>) {
  if (!storeSettings) return undefined
  
  return {
    disableShoppingCart: storeSettings.disableShoppingCart,
    catalogModeSettings: storeSettings.catalogModeSettings
  }
}

// Get products with proper filtering and pagination
async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: any = {
    status: 'PUBLISHED',
    stockQuantity: { gt: 0 }
  }

  // Search functionality
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } },
      { shortDescription: { contains: searchParams.search, mode: 'insensitive' } },
      { tags: { has: searchParams.search } }
    ]
  }

  // Category filter
  if (searchParams.category) {
    where.categoryId = searchParams.category
  }

  // Country filter
  if (searchParams.country) {
    where.countryId = searchParams.country
  }

  // Price filters
  if (searchParams.minPrice) {
    where.sellingPriceUSD = { ...where.sellingPriceUSD, gte: parseFloat(searchParams.minPrice) }
  }
  if (searchParams.maxPrice) {
    where.sellingPriceUSD = { ...where.sellingPriceUSD, lte: parseFloat(searchParams.maxPrice) }
  }

  // Sort options
  let orderBy: any = []
  switch (searchParams.sort) {
    case 'price-low':
      orderBy = [{ sellingPriceUSD: 'asc' }]
      break
    case 'price-high':
      orderBy = [{ sellingPriceUSD: 'desc' }]
      break
    case 'name':
      orderBy = [{ name: 'asc' }]
      break
    case 'newest':
      orderBy = [{ createdAt: 'desc' }]
      break
    case 'featured':
      orderBy = [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
      break
    default:
      orderBy = [
        { isFeatured: 'desc' },
        { stockQuantity: 'desc' },
        { createdAt: 'desc' }
      ]
  }

  try {
    // Fetch products and total count
    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          country: true,
          productSizes: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy,
        take: pageSize,
        skip
      }),
      db.product.count({ where })
    ])

    return {
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      products: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    }
  }
}

// Get categories for filters
async function getCategories() {
  try {
    return await db.category.findMany({
      where: {
        products: {
          some: {
            status: 'PUBLISHED',
            stockQuantity: { gt: 0 }
          }
        }
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: 'PUBLISHED',
                stockQuantity: { gt: 0 }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Get countries for filters
async function getCountries() {
  try {
    return await db.country.findMany({
      where: {
        products: {
          some: {
            status: 'PUBLISHED',
            stockQuantity: { gt: 0 }
          }
        }
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: 'PUBLISHED',
                stockQuantity: { gt: 0 }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching countries:', error)
    return []
  }
}

// Products Data Component
async function ProductsData({ searchParams }: { searchParams: ProductsPageProps['searchParams'] }) {
  const [storeSettings, { products, totalCount, totalPages, currentPage }, categories, countries] = await Promise.all([
    getStoreSettings(),
    getProducts(searchParams),
    getCategories(),
    getCountries()
  ])

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link 
            href="/" 
            className="hover:text-purple-600 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">All Products</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-600" />
              All Products
            </h1>
            
            <p className="text-sm text-gray-500">
              {totalCount} product{totalCount !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Products Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters - Fixed Width */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
            <ProductFilters
              categories={categories}
              countries={countries}
              searchParams={searchParams}
            />
          </div>
        </div>

        {/* Products Grid - Responsive */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No products found
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                No products are currently available. Please check back later!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  View All Products
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <Grid3X3 className="h-4 w-4" />
                  Browse Categories
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      ...product,
                      shortDescription: product.shortDescription || undefined  // ✅ Convert null to undefined
                    }} 
                    storeSettings={convertForProductCard(storeSettings)}  // ✅ Use helper function
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <div className="flex items-center space-x-2">
                    {/* Previous Page */}
                    {currentPage > 1 && (
                      <Link
                        href={`/products?${new URLSearchParams({ 
                          ...searchParams, 
                          page: (currentPage - 1).toString() 
                        }).toString()}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-purple-50 border border-gray-300 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Link>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      if (pageNum < 1 || pageNum > totalPages) return null
                      
                      const isActive = pageNum === currentPage
                      
                      return (
                        <Link
                          key={pageNum}
                          href={`/products?${new URLSearchParams({ 
                            ...searchParams, 
                            page: pageNum.toString() 
                          }).toString()}`}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            isActive
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      )
                    })}

                    {/* Next Page */}
                    {currentPage < totalPages && (
                      <Link
                        href={`/products?${new URLSearchParams({ 
                          ...searchParams, 
                          page: (currentPage + 1).toString() 
                        }).toString()}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-purple-50 border border-gray-300 transition-colors"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// Main Products Page Component
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const storeSettings = await getStoreSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} />
      
      {/* 🔧 FIXED: Proper container with max-width and padding */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading products..." />}>
          <ProductsData searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}