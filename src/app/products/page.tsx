// ✅ FIXED: src/app/products/page.tsx

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

// ✅ FIXED: Simplified and corrected getProducts function
async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // ✅ FIXED: Build where clause correctly
  const where: any = {
    // Only show published products to customers
    status: 'PUBLISHED',
    stockQuantity: { gt: 0 } // Only show products in stock
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
      orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
      break
    case 'featured':
      orderBy = [{ isFeatured: 'desc' }, { updatedAt: 'desc' }]
      break
    default:
      // Default: Featured first, then by update date
      orderBy = [
        { isFeatured: 'desc' },
        { stockQuantity: 'desc' }, // In-stock products first
        { updatedAt: 'desc' }
      ]
  }

  try {
    // ✅ FIXED: Separate queries to avoid complex count issues
    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
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
          }
        },
        orderBy,
        skip,
        take: pageSize
      }),
      // ✅ FIXED: Simple count query
      db.product.count({ where })
    ])

    return {
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalCount / pageSize),
      hasPrevPage: page > 1
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    // Return empty results instead of throwing
    return {
      products: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  }
}

// Get categories for filters
async function getCategories() {
  try {
    return await db.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
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
      select: {
        id: true,
        name: true,
        code: true,
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

// ---------- Components ----------

interface ProductsGridProps {
  searchParams: ProductsPageProps['searchParams']
}

async function ProductsGrid({ searchParams }: ProductsGridProps) {
  const { products, totalCount, currentPage, totalPages, hasNextPage, hasPrevPage } = await getProducts(searchParams)

  if (totalCount === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 mb-6">
          {searchParams.search 
            ? `No matches for "${searchParams.search}"`
            : 'No products match your current filters'}
        </p>
        <Link href="/products" className="text-purple-600 hover:underline flex items-center gap-1 justify-center">
          <ArrowLeft className="h-4 w-4" /> Clear Filters
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {searchParams.search 
            ? `Search results for "${searchParams.search}"` 
            : 'All Products'}
        </h2>
        <p className="text-gray-600 mt-1">
          Showing {products.length} of {totalCount} products
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={{
              pathname: '/products',
              query: { ...searchParams, page: (currentPage - 1).toString() }
            }}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg ${
              hasPrevPage 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>

          <span className="px-4 py-2 text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Link
            href={{
              pathname: '/products',
              query: { ...searchParams, page: (currentPage + 1).toString() }
            }}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg ${
              hasNextPage 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </>
  )
}

// Page metadata
export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const title = searchParams.search 
    ? `Search: ${searchParams.search} - Products` 
    : 'All Products - Shop Indian Ethnic Wear'
  
  return {
    title,
    description: 'Browse our complete collection of authentic Indian ethnic wear, jewelry, and lifestyle products.',
  }
}

// Main page component
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Fetch data in parallel
  const [categories, countries] = await Promise.all([
    getCategories(),
    getCountries()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="h-6 w-6 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Products
            </h1>
          </div>
          <p className="text-gray-600">
            Discover our authentic collection of Indian ethnic wear and lifestyle products
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div className="h-96 bg-gray-200 rounded-lg animate-pulse" />}>
              <ProductFilters
                categories={categories}
                countries={countries}
                searchParams={searchParams}
              />
            </Suspense>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3 mt-8 lg:mt-0">
            <Suspense fallback={<LoadingSpinner />}>
              <ProductsGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}