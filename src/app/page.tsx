// ✅ UPDATED: src/app/page.tsx - CATALOG/ECOMMERCE TOGGLE SUPPORT

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { generateStoreMetadata, generateOrganizationJsonLd } from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ProductCard from '@/components/customer/ProductCard'
import HeroSection from '@/components/customer/HeroSection'
import CategoryShowcase from '@/components/customer/CategoryShowcase'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import CurrencyNotification from '@/components/customer/CurrencyNotification'
import TrustIndicators from '@/components/customer/TrustIndicators'
import {
  Star,
  Truck,
  Shield,
  Heart,
  ArrowRight,
  Sparkles,
  Eye
} from 'lucide-react'

// Get store settings for branding and SEO
async function getStoreSettings() {
  return await db.storeSetting.findFirst({
    where: { id: 'default' }
  })
}

// Generate metadata for SEO
export async function generateMetadata() {
  const storeSettings = await getStoreSettings()
  return generateStoreMetadata(storeSettings)
}

// FIXED: Simplified query that works with current schema
async function getFeaturedProducts() {
  return await db.product.findMany({
    where: {
      // Simple approach: only get published products
      status: 'PUBLISHED',
      isFeatured: true,
      stockQuantity: { gt: 0 }
    },
    include: {
      category: true,
      country: true
    },
    take: 8,
    orderBy: [
      { stockQuantity: 'desc' }, // Prioritize in-stock products
      { createdAt: 'desc' } // Then by newest
    ]
  })
}

// Simple category fetch for homepage
async function getCategories() {
  return await db.category.findMany({
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
    orderBy: { name: 'asc' },
    take: 6
  })
}

// ✅ UPDATED: Featured Products Component with storeSettings
async function FeaturedProducts() {
  const products = await getFeaturedProducts()
  const storeSettings = await getStoreSettings() // ✅ GET STORE SETTINGS

  if (products.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600">No featured products available at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-5 w-5 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Heart className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              storeSettings={storeSettings}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/products?featured=true"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            View All Featured
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ✅ UPDATED: New Arrivals Component with storeSettings
async function NewArrivals() {
  const products = await getFeaturedProducts() // Reuse for demo
  const storeSettings = await getStoreSettings() // ✅ GET STORE SETTINGS

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
            <Eye className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fresh additions to our collection - discover the latest trending styles
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.slice(0, 8).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              storeSettings={storeSettings}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/products?sort=newest"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View All New Arrivals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Main Home Page Component
export default async function HomePage() {
  const storeSettings = await getStoreSettings()
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer Navigation */}
      <CustomerNavigation storeSettings={storeSettings} />
      
      {/* Currency Notification */}
      <CurrencyNotification />
      
      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection storeSettings={storeSettings} />
        
        {/* Category Showcase */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading categories..." />}>
          <CategoryShowcase categories={categories} />
        </Suspense>
        
        {/* Featured Products */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading featured products..." />}>
          <FeaturedProducts />
        </Suspense>
        
        {/* Dynamic Trust Indicators */}
        <Suspense fallback={<LoadingSpinner size="md" text="Loading shipping info..." />}>
          <TrustIndicators />
        </Suspense>
        
        {/* New Arrivals */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading new arrivals..." />}>
          <NewArrivals />
        </Suspense>
      </main>
      
      {/* Enhanced Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationJsonLd(storeSettings))
        }}
      />
    </div>
  )
}