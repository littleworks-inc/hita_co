// File: app/products/page.tsx - Enhanced with Draft System Protection

import { Suspense } from 'react'
import { db } from '@/lib/db'
import { generateStoreMetadata } from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ProductCard from '@/components/customer/ProductCard'
import ProductFilters from '@/components/customer/ProductFilters'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import {
  Grid3X3,
  Package,
  ArrowLeft
} from 'lucide-react'

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

// ---------- Enhanced Data Fetching with Draft System Protection ----------

async function getStoreSettings() {
  return await db.storeSetting.findFirst({ where: { id: 'default' } })
}

// Get only categories that have published products
async function getCategories() {
  return await db.category.findMany({
    where: {
      products: {
        some: { 
          // Only published products with stock
          OR: [
            { status: 'PUBLISHED' },
            { 
              AND: [
                { status: null }, // Legacy products
                { isActive: true }
              ]
            }
          ],
          stockQuantity: { gt: 0 }
        }
      }
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              OR: [
                { status: 'PUBLISHED' },
                { 
                  AND: [
                    { status: null },
                    { isActive: true }
                  ]
                }
              ],
              stockQuantity: { gt: 0 }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

// Get only countries that have published products
async function getCountries() {
  return await db.country.findMany({
    where: {
      products: {
        some: { 
          OR: [
            { status: 'PUBLISHED' },
            { 
              AND: [
                { status: null },
                { isActive: true }
              ]
            }
          ],
          stockQuantity: { gt: 0 }
        }
      }
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              OR: [
                { status: 'PUBLISHED' },
                { 
                  AND: [
                    { status: null },
                    { isActive: true }
                  ]
                }
              ],
              stockQuantity: { gt: 0 }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

// Enhanced product fetching with draft system protection
async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Base where clause - ONLY PUBLISHED PRODUCTS
  const where: any = {
    // Draft System Protection: Only show published products to customers
    OR: [
      { status: 'PUBLISHED' },
      { 
        AND: [
          { status: null }, // Legacy products without status field
          { isActive: true } // But must be active
        ]
      }
    ],
    stockQuantity: { gt: 0 } // Must have stock
  }

  // Search functionality (enhanced)
  if (searchParams.search) {
    const searchTerms = searchParams.search.toLowerCase().split(' ').filter(term => term.length > 0)
    where.AND = [
      {
        OR: [
          { name: { contains: searchParams.search, mode: 'insensitive' } },
          { description: { contains: searchParams.search, mode: 'insensitive' } },
          { shortDescription: { contains: searchParams.search, mode: 'insensitive' } },
          { tags: { hasSome: searchTerms } }
        ]
      }
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
  if (searchParams.minPrice || searchParams.maxPrice) {
    where.sellingPriceUSD = {}
    if (searchParams.minPrice) {
      where.sellingPriceUSD.gte = parseFloat(searchParams.minPrice)
    }
    if (searchParams.maxPrice) {
      where.sellingPriceUSD.lte = parseFloat(searchParams.maxPrice)
    }
  }

  // Sorting logic
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

  // Fetch products and total count
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
}

// ---------- Components ----------

interface ProductsGridProps {
  searchParams: ProductsPageProps['searchParams']
}

async function ProductsGrid({ searchParams }: ProductsGridProps) {
  const { products, totalCount, currentPage } = await getProducts(searchParams)

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
        <a href="/products" className="text-purple-600 hover:underline flex items-center gap-1 justify-center">
          <ArrowLeft className="h-4 w-4" /> Clear Filters
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {searchParams.search ? `Search Results for "${searchParams.search}"` : 'All Products'}
        </h2>
        <p className="text-gray-500">
          Showing {((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, totalCount)} of {totalCount} published products
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Enhanced Pagination with SEO considerations */}
      {totalCount > 12 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-2">
            {/* Pagination controls would go here */}
            <span className="text-sm text-gray-500">
              Page {currentPage} of {Math.ceil(totalCount / 12)}
            </span>
          </nav>
        </div>
      )}
    </>
  )
}

// ---------- Metadata Generation with Draft System ----------

export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const storeSettings = await getStoreSettings()
  const { totalCount } = await getProducts(searchParams)
  
  const title = searchParams.search 
    ? `Search Results for "${searchParams.search}" - ${storeSettings?.storeName || 'Store'}`
    : `Products - ${storeSettings?.storeName || 'Store'}`
    
  const description = searchParams.search
    ? `Found ${totalCount} products matching "${searchParams.search}". Shop our curated collection of authentic products.`
    : `Browse our collection of ${totalCount} authentic products. Find unique, handcrafted items with worldwide shipping.`

  return generateStoreMetadata({
    title,
    description,
    keywords: searchParams.search 
      ? `${searchParams.search}, products, shop, buy`
      : 'products, shop, authentic, handcrafted, unique',
    canonical: `/products${searchParams.search ? `?search=${encodeURIComponent(searchParams.search)}` : ''}`,
    openGraph: {
      type: 'website',
      title,
      description
    }
  })
}

// ---------- Main Page Component ----------

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [storeSettings, categories, countries] = await Promise.all([
    getStoreSettings(),
    getCategories(),
    getCountries()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="h-6 w-6 text-purple-600" />
            <h1 className="text-3xl font-bold">
              {searchParams.search ? 'Search Products' : 'Products'}
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            {searchParams.search
              ? 'Find your perfect piece from our search results'
              : 'Discover our collection of handcrafted products'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg" />}>
              <ProductFilters 
                categories={categories} 
                countries={countries} 
                searchParams={searchParams} 
              />
            </Suspense>
          </aside>
          <section className="lg:col-span-3">
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading products..." />}>
              <ProductsGrid searchParams={searchParams} />
            </Suspense>
          </section>
        </div>
      </main>
      
      {/* Enhanced Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": searchParams.search ? `Search Results: ${searchParams.search}` : "Products",
            "description": "Browse our collection of authentic, handcrafted products",
            "url": `${process.env.NEXT_PUBLIC_APP_URL}/products`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": "Published products only"
            }
          })
        }}
      />
    </div>
  )
}