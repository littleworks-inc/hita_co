// File: app/page.tsx - Enhanced with Draft System Protection

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

// Enhanced: Get only published featured products
async function getFeaturedProducts() {
  return await db.product.findMany({
    where: {
      // CRITICAL: Only show published products to customers
      OR: [
        { status: 'PUBLISHED' },
        { 
          AND: [
            { status: null }, // Legacy products without status
            { isActive: true } // But must be active
          ]
        }
      ],
      isFeatured: true,
      stockQuantity: { gt: 0 }
    },
    include: {
      category: true,
      country: true
    },
    take: 8,
    orderBy: [
      { stockQuantity: 'desc' }, // Prioritize in-stock items
      { createdAt: 'desc' }
    ]
  })
}

// Enhanced: Get categories with published products only
async function getCategories() {
  return await db.category.findMany({
    where: { 
      parentId: null,
      // Only categories that have published products
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
        },
        take: 1,
        orderBy: { createdAt: 'desc' }
      },
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

// Enhanced: Get recent published products only
async function getRecentProducts() {
  return await db.product.findMany({
    where: {
      // Only published products for new arrivals
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
    },
    include: {
      category: true,
      country: true
    },
    take: 12,
    orderBy: [
      { publishedAt: 'desc' }, // Prioritize recently published
      { createdAt: 'desc' }
    ]
  })
}

// Featured Products Component (Published Only)
async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Handpicked favorites from our collection of authentic Indian ethnic wear and lifestyle products
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Eye className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">All products are currently available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
          >
            View All Featured Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Recent Products Component (Published Only)
async function RecentProducts() {
  const products = await getRecentProducts()

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-pink-500" />
            <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
            <Sparkles className="h-5 w-5 text-pink-500" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the latest additions to our curated collection
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length > 8 && (
          <div className="text-center mt-12">
            <Link
              href="/products?sort=newest"
              className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              See All New Arrivals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

// Trust Indicators Component
function TrustIndicators() {
  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over $100'
    },
    {
      icon: Shield,
      title: 'Secure Shopping',
      description: '100% secure payments'
    },
    {
      icon: Heart,
      title: 'Handcrafted Quality',
      description: 'Authentic artisan products'
    },
    {
      icon: Star,
      title: 'Customer Favorite',
      description: 'Trusted by thousands'
    }
  ]

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Newsletter Signup Component
function NewsletterSignup() {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Stay Updated with New Arrivals
        </h2>
        <p className="text-purple-100 text-lg mb-8">
          Be the first to know about our latest published products and exclusive offers
        </p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
          />
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  )
}

// Main Homepage Component
export default async function HomePage() {
  const storeSettings = await getStoreSettings()
  const organizationSchema = generateOrganizationJsonLd(storeSettings)

  return (
    <>
      {/* Organization Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      
      <div className="min-h-screen bg-white">
        <CustomerNavigation storeSettings={storeSettings} />
        
        {/* Currency Notification for First-Time Visitors */}
        <CurrencyNotification />
        
        <main>
          {/* Hero Section */}
          <HeroSection storeSettings={storeSettings} />
          
          {/* Featured Products - Published Only */}
          <Suspense fallback={
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <LoadingSpinner size="lg" text="Loading featured products..." />
              </div>
            </section>
          }>
            <FeaturedProducts />
          </Suspense>
          
          {/* Category Showcase - Categories with Published Products Only */}
          <Suspense fallback={
            <section className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <LoadingSpinner size="lg" text="Loading categories..." />
              </div>
            </section>
          }>
            <CategoryShowcase />
          </Suspense>
          
          {/* New Arrivals - Published Only */}
          <Suspense fallback={
            <section className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <LoadingSpinner size="lg" text="Loading new arrivals..." />
              </div>
            </section>
          }>
            <RecentProducts />
          </Suspense>
          
          {/* Trust Indicators */}
          <TrustIndicators />
          
          {/* Newsletter Signup */}
          <NewsletterSignup />
        </main>
      </div>
    </>
  )
}