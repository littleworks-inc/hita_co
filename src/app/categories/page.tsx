// ✅ FIXED: /src/app/categories/page.tsx
// Fixed getStoreSettings transformation and table name

import { Suspense } from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import { generateStoreMetadata } from '@/lib/seo'
import { getNavCategories } from '@/lib/store-settings'
import {
  Tag,
  ArrowRight,
  Package
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// ✅ FIXED: Get store settings with proper transformation
async function getStoreSettings() {
  try {
    const settings = await db.storeSetting.findFirst({ // ✅ Fixed table name
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

// Generate metadata for SEO - fully dynamic
export async function generateMetadata() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Store'
  const storeTagline = storeSettings?.tagline || 'Quality products'
  
  return {
    title: `Shop by Category - ${storeName}`,
    description: `Explore our collections at ${storeName}. ${storeTagline}`,
    openGraph: {
      title: `Shop by Category - ${storeName}`,
      description: `Explore our collections at ${storeName}. ${storeTagline}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Shop by Category - ${storeName}`,
      description: `Explore our collections at ${storeName}. ${storeTagline}`,
    },
  }
}

// Get categories with product counts
async function getCategories() {
  try {
    return await db.category.findMany({
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: 'PUBLISHED',
                isActive: true,
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

// Categories Grid Component
async function CategoriesGrid() {
  const categories = await getCategories()

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Package className="h-16 w-16 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          No Categories Found
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Categories will appear here once they are created and have products.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Package className="h-4 w-4" />
          View All Products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {categories.map((category) => {
        const productCount = category._count.products
        
        return (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-8 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                  <Tag className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">
                    {productCount}
                  </div>
                  <div className="text-sm opacity-90">
                    Product{productCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 group-hover:text-yellow-200 transition-colors duration-300">
                {category.name}
              </h3>

              {/* Category Description */}
              {category.description && (
                <p className="text-white/80 text-sm mb-4 line-clamp-2 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                  {category.description}
                </p>
              )}

              {/* Shop Collection Button */}
              <div className="flex items-center gap-2 text-white/90 group-hover:text-white font-medium transition-colors duration-300 mt-4">
                <span>Shop Collection</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// Dynamic store content from settings
async function DynamicContent() {
  const storeSettings = await getStoreSettings()
  
  return (
    <>
      {/* Header Section - Dynamic from store settings */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Tag className="h-4 w-4" />
          Shop by Category
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          {storeSettings?.storeName ? `Discover ${storeSettings.storeName} Collections` : 'Discover Our Collections'}
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {storeSettings?.tagline || 'Explore our carefully curated collections of quality products.'}
        </p>
      </div>

      {/* Categories Grid */}
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading categories..." />}>
        <CategoriesGrid />
      </Suspense>

      {/* Call to Action - Dynamic */}
      <div className="text-center mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">
          Can't Find What You're Looking For?
        </h2>
        <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
          Browse all our products or use our search to find exactly what you need.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
          >
            <Package className="h-5 w-5" />
            View All Products
          </Link>
          <Link
            href="/products?search="
            className="inline-flex items-center gap-2 bg-purple-700 text-white px-8 py-4 rounded-lg hover:bg-purple-800 transition-colors font-medium text-lg border-2 border-purple-400"
          >
            Search Products
          </Link>
        </div>
      </div>
    </>
  )
}

// Main Categories Page Component - Completely Dynamic
export default async function CategoriesPage() {
  const [storeSettings, navCategories] = await Promise.all([
    getStoreSettings(),
    getNavCategories()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} initialCategories={navCategories} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DynamicContent />
      </main>
    </div>
  )
}