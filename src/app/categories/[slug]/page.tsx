// src/app/categories/[slug]/page.tsx
// =====================================
// 🔧 FIXED: Category Slug Page - Syntax Error Resolved
// =====================================

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { generateCategoryMetadata, generateBreadcrumbJsonLd } from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ProductCard from '@/components/customer/ProductCard'
import CategorySortFilter from '@/components/customer/CategorySortFilter'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import {
  Tag,
  Grid3X3,
  ArrowLeft,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface CategoryPageProps {
  params: {
    slug: string
  }
  searchParams: {
    sort?: string
    page?: string
  }
}

// Get store settings - Required for catalog mode
async function getStoreSettings() {
  try {
    return await db.storeSettings.findFirst({
      where: { id: 'store_1' }
    })
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return null
  }
}

// Get category by slug
async function getCategory(slug: string) {
  try {
    return await db.category.findFirst({
      where: { 
        slug: slug,
        isActive: true
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: 'PUBLISHED',
                isActive: true
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

// Get products for category
async function getCategoryProducts(
  categoryId: string, 
  searchParams: CategoryPageProps['searchParams']
) {
  try {
    const page = parseInt(searchParams.page || '1')
    const pageSize = 12
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {
      categoryId: categoryId,
      status: 'PUBLISHED',
      isActive: true,
      stockQuantity: { gt: 0 }
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
    console.error('Error fetching category products:', error)
    return {
      products: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    }
  }
}

// Generate metadata for the category page
export async function generateMetadata({ params }: CategoryPageProps) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.'
    }
  }

  return {
    title: `${category.name} - Hita&Co`,
    description: category.description || `Browse our collection of ${category.name} products.`,
    openGraph: {
      title: category.name,
      description: category.description || `Browse our collection of ${category.name} products.`,
      type: 'website'
    }
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  // Fetch data in parallel
  const [storeSettings, category] = await Promise.all([
    getStoreSettings(),
    getCategory(params.slug)
  ])

  // If category not found, show 404
  if (!category) {
    notFound()
  }

  // Get products for this category
  const { products, totalCount, totalPages, currentPage } = await getCategoryProducts(
    category.id,
    searchParams
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Link 
              href="/categories" 
              className="hover:text-purple-600 transition-colors"
            >
              Categories
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </div>
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Tag className="h-8 w-8 text-purple-600" />
                {category.name}
              </h1>
              
              {category.description && (
                <p className="text-lg text-gray-600 mb-4 max-w-3xl">
                  {category.description}
                </p>
              )}
              
              <p className="text-sm text-gray-500">
                {totalCount} product{totalCount !== 1 ? 's' : ''} in this category
              </p>
            </div>
            
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Categories
            </Link>
          </div>
        </div>

        {/* Sort & Filter */}
        <div className="mb-8">
          <CategorySortFilter
            currentSort={searchParams.sort}
            categorySlug={category.slug}
          />
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No products in this category
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              This category doesn't have any products yet. Check back later or explore other categories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Package className="h-4 w-4" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  storeSettings={storeSettings}
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
                      href={`/categories/${category.slug}?${new URLSearchParams({ 
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
                    const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <Link
                        key={pageNum}
                        href={`/categories/${category.slug}?${new URLSearchParams({ 
                          ...searchParams, 
                          page: pageNum.toString() 
                        }).toString()}`}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          pageNum === currentPage
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
                      href={`/categories/${category.slug}?${new URLSearchParams({ 
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
      </main>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Categories', url: '/categories' },
            { name: category.name, url: `/categories/${category.slug}` }
          ]))
        }}
      />
    </div>
  )
}