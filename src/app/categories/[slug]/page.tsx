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
  Package
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

// Get store settings
async function getStoreSettings() {
  return await db.storeSetting.findFirst({
    where: { id: 'default' }
  })
}

// Get category by slug
async function getCategory(slug: string) {
  return await db.category.findFirst({
    where: { slug },
    include: {
      parent: true,
      children: {
        where: {
          products: {
            some: {
              isActive: true,
              stockQuantity: { gt: 0 }
            }
          }
        },
        include: {
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                  stockQuantity: { gt: 0 }
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
              stockQuantity: { gt: 0 }
            }
          }
        }
      }
    }
  })
}

// Get products in category
async function getCategoryProducts(categoryId: string, searchParams: CategoryPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Build order by
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
    case 'featured':
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
      break
  }

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where: {
        categoryId,
        isActive: true,
        stockQuantity: { gt: 0 }
      },
      include: {
        category: true,
        country: true
      },
      orderBy,
      skip,
      take: pageSize
    }),
    db.product.count({
      where: {
        categoryId,
        isActive: true,
        stockQuantity: { gt: 0 }
      }
    })
  ])

  return {
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page
  }
}

// Category Products Component
async function CategoryProducts({ category, searchParams }: { 
  category: any, 
  searchParams: CategoryPageProps['searchParams'] 
}) {
  const { products, totalCount, totalPages, currentPage } = await getCategoryProducts(category.id, searchParams)

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products available</h3>
        <p className="text-gray-500">
          We're currently updating our {category.name.toLowerCase()} collection. Check back soon!
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 mt-6 text-purple-600 hover:text-purple-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse All Products
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Category Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {category.name} Collection
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {totalCount} {totalCount === 1 ? 'product' : 'products'}
            </span>
            
            {/* Sort Filter Component */}
            <CategorySortFilter 
              currentSort={searchParams.sort || 'newest'}
              categorySlug={category.slug}
              searchParams={searchParams}
            />
          </div>
        </div>

        {category.description && (
          <p className="text-gray-600 max-w-3xl">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop by Subcategory</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {category.children.map((subcategory: any) => (
              <Link
                key={subcategory.id}
                href={`/categories/${subcategory.slug}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <h4 className="font-medium text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                  {subcategory.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {subcategory._count.products} {subcategory._count.products === 1 ? 'item' : 'items'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
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
                className="px-3 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-purple-50 border border-gray-300 transition-colors"
              >
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
                  href={`/categories/${category.slug}?${new URLSearchParams({ 
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
                href={`/categories/${category.slug}?${new URLSearchParams({ 
                  ...searchParams, 
                  page: (currentPage + 1).toString() 
                }).toString()}`}
                className="px-3 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-purple-50 border border-gray-300 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [storeSettings, category] = await Promise.all([
    getStoreSettings(),
    getCategory(params.slug)
  ])

  if (!category) {
    notFound()
  }

  // Generate breadcrumb schema
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/categories' }
  ]
  
  if (category.parent) {
    breadcrumbs.push({ name: category.parent.name, url: `/categories/${category.parent.slug}` })
  }
  
  breadcrumbs.push({ name: category.name, url: `/categories/${category.slug}` })
  
  const breadcrumbSchema = generateBreadcrumbJsonLd(breadcrumbs)

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <CustomerNavigation storeSettings={storeSettings} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/categories" className="hover:text-purple-600 transition-colors">Categories</Link>
            {category.parent && (
              <>
                <span className="mx-2">/</span>
                <Link 
                  href={`/categories/${category.parent.slug}`} 
                  className="hover:text-purple-600 transition-colors"
                >
                  {category.parent.name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>

          {/* Page Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-6 w-6 text-purple-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{category.name}</h1>
            </div>
            {category.description && (
              <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">{category.description}</p>
            )}
          </header>

          {/* Category Products */}
          <Suspense fallback={<LoadingSpinner size="lg" text="Loading products..." />}>
            <CategoryProducts category={category} searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const [category, storeSettings] = await Promise.all([
    getCategory(params.slug),
    getStoreSettings()
  ])

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    }
  }

  return generateCategoryMetadata(category, storeSettings)
}