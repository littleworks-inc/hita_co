// File: app/products/page.tsx

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

// ---------- Data Fetching ----------

async function getStoreSettings() {
  return await db.storeSetting.findFirst({ where: { id: 'default' } })
}

async function getCategories() {
  return await db.category.findMany({
    where: {
      products: {
        some: { isActive: true, stockQuantity: { gt: 0 } }
      }
    },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true, stockQuantity: { gt: 0 } }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

async function getCountries() {
  return await db.country.findMany({
    where: {
      products: {
        some: { isActive: true, stockQuantity: { gt: 0 } }
      }
    },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true, stockQuantity: { gt: 0 } }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

async function getProducts(searchParams: ProductsPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const skip = (page - 1) * pageSize

  const where: any = {
    isActive: true,
    stockQuantity: { gt: 0 }
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } },
      { tags: { hasSome: [searchParams.search] } },
      { sku: { contains: searchParams.search, mode: 'insensitive' } }
    ]
  }

  if (searchParams.category) {
    where.category = { slug: searchParams.category }
  }

  if (searchParams.minPrice) {
    where.sellingPriceUSD = { ...where.sellingPriceUSD, gte: parseFloat(searchParams.minPrice) }
  }

  if (searchParams.maxPrice) {
    where.sellingPriceUSD = { ...where.sellingPriceUSD, lte: parseFloat(searchParams.maxPrice) }
  }

  if (searchParams.country) {
    where.country = { code: searchParams.country }
  }

  let orderBy: any = { createdAt: 'desc' }
  switch (searchParams.sort) {
    case 'price-low':
      orderBy = { sellingPriceUSD: 'asc' }
      break
    case 'price-high':
      orderBy = { sellingPriceUSD: 'desc' }
      break
    case 'name':
      orderBy = { name: 'asc' }
      break
    case 'newest':
      orderBy = { createdAt: 'desc' }
      break
    case 'featured':
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
      break
  }

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true, country: true },
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
    currentPage: page
  }
}

// ---------- Metadata ----------

export async function generateMetadata({ searchParams }: { searchParams: ProductsPageProps['searchParams'] }) {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'

  let title = 'Products'
  let description = `Shop our collection of handcrafted products at ${storeName}`

  if (searchParams.search) {
    title = `Search: ${searchParams.search}`
    description = `Search results for "${searchParams.search}" at ${storeName}.`
  } else if (searchParams.category) {
    title = `${searchParams.category} Products`
    description = `Browse ${searchParams.category} items at ${storeName}.`
  }

  const baseMetadata = generateStoreMetadata(storeSettings)

  return {
    ...baseMetadata,
    title,
    description,
    openGraph: { ...baseMetadata.openGraph, title, description, url: '/products' },
    alternates: { canonical: '/products' }
  }
}

// ---------- Grid Component ----------

async function ProductsGrid({ searchParams }: { searchParams: ProductsPageProps['searchParams'] }) {
  const { products, totalCount, totalPages, currentPage } = await getProducts(searchParams)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-24 w-24 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold">No products found</h3>
        <p className="text-gray-500 mb-2">
          {searchParams.search
            ? `No matches for "${searchParams.search}"`
            : 'No products match your current filters'}
        </p>
        <a href="/products" className="text-purple-600 hover:underline flex items-center gap-1">
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
          Showing {((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, totalCount)} of {totalCount} products
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

// ---------- Page Component ----------

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
              <ProductFilters categories={categories} countries={countries} searchParams={searchParams} />
            </Suspense>
          </aside>
          <section className="lg:col-span-3">
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading products..." />}>
              <ProductsGrid searchParams={searchParams} />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  )
}
