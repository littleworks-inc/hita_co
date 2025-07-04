// src/app/categories/page.tsx
// =====================================
// 🚫 ZERO HARDCODE: Fully Dynamic Categories Page
// =====================================

import { Suspense } from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import { generateStoreMetadata } from '@/lib/seo'
import {
  Tag,
  ArrowRight,
  Package
} from 'lucide-react'

// Get store settings for branding
async function getStoreSettings() {
  try {
    return await db.storeSettings.findFirst({
      where: { id: 'default' }
    })
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
      type: 'website'
    }
  }
}

// 🚫 ZERO HARDCODE: Get all categories from database only
async function getCategories() {
  try {
    return await db.category.findMany({
      where: {
        parentId: null, // Only get main categories
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

// 🚫 ZERO HARDCODE: Dynamic gradient generator based on category ID
function getCategoryGradient(categoryId: string): string {
  // Use category ID to generate consistent but varied gradients
  const hash = categoryId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  const gradientIndex = hash % 12 // 12 different gradient combinations
  
  const gradients = [
    'from-purple-500 via-pink-500 to-red-500',
    'from-blue-500 via-purple-500 to-indigo-600',
    'from-green-500 via-teal-500 to-blue-500',
    'from-amber-500 via-orange-500 to-red-500',
    'from-rose-500 via-pink-500 to-purple-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-cyan-500 via-blue-500 to-purple-500',
    'from-emerald-500 via-green-500 to-teal-500',
    'from-yellow-500 via-orange-500 to-red-500',
    'from-violet-500 via-purple-500 to-blue-500',
    'from-pink-500 via-rose-500 to-red-500',
    'from-teal-500 via-cyan-500 to-blue-500'
  ]
  
  return gradients[gradientIndex]
}

// No emojis or icons - clean text-only approach

// 🚫 ZERO HARDCODE: Fully Dynamic Categories Grid
async function CategoriesGrid() {
  const categories = await getCategories()

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Package className="h-16 w-16 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          No categories available
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Categories will appear here once they are created and have products assigned.
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
        const gradient = getCategoryGradient(category.id)
        const productCount = category._count.products
        
        return (
          <Link 
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group block"
          >
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-black/5"></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header with Product Count */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-white/90 transition-colors">
                      {category.name}
                    </h3>
                    <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {productCount} item{productCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

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
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// 🚫 ZERO HARDCODE: Dynamic store content from settings
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
  const storeSettings = await getStoreSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DynamicContent />
      </main>
    </div>
  )
}