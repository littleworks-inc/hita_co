// src/app/page.tsx - Updated with New Arrivals and Enhanced Featured Products

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { isValidCurrency, SupportedCurrency } from '@/lib/currency'
import { generateStoreMetadata, generateOrganizationJsonLd } from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ProductCard from '@/components/customer/ProductCard'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import CurrencyNotification from '@/components/customer/CurrencyNotification'
import DynamicHeroSection from '@/components/customer/DynamicHeroSection'
import NewArrivals from '@/components/customer/NewArrivals'
import EnhancedFeaturedProducts from '@/components/customer/EnhancedFeaturedProducts'
import {
  Star,
  Truck,
  Shield,
  Heart,
  ArrowRight,
  Sparkles,
  Package,
  Eye,
  Users,
  Award,
  CheckCircle
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// ✅ FIXED: Get store settings with proper type conversion for BOTH seo.ts AND components
async function getStoreSettings() {
  const settings = await db.storeSetting.findFirst({
    where: { id: 'default' }
  })

  if (!settings) {
    return null // ✅ Return null for SEO functions
  }

  // ✅ Transform database result to match StoreSettings interface in seo.ts
  // Keep null values as null (don't convert to undefined) for seo.ts compatibility
  return {
    id: settings.id,
    storeName: settings.storeName,
    tagline: settings.tagline, // Keep as string | null
    logo: settings.logo, // Keep as string | null
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
    email: settings.email, // Keep as string | null
    phone: settings.phone, // Keep as string | null
    address: settings.address, // Keep as any
    instagram: settings.instagram, // Keep as string | null
    facebook: settings.facebook, // Keep as string | null
    pinterest: settings.pinterest, // Keep as string | null
    twitter: settings.twitter, // Keep as string | null
    // Only convert boolean fields to undefined for component compatibility
    disableShoppingCart: settings.disableShoppingCart ?? undefined,
    catalogModeSettings: settings.catalogModeSettings ?? undefined,
    currency: settings.currency, // For layout.tsx fix
  }
}

// ✅ NEW: Helper function to convert for ProductCard (only needs specific fields)
function convertForProductCard(storeSettings: Awaited<ReturnType<typeof getStoreSettings>>) {
  if (!storeSettings) return undefined

  return {
    storeName: storeSettings.storeName,
    primaryColor: storeSettings.primaryColor,
    disableShoppingCart: storeSettings.disableShoppingCart
  }
}

// ✅ FIXED: Get initial currency data for layout.tsx
async function getInitialCurrencyData(): Promise<{
  initialCurrency: SupportedCurrency
  initialRates: Record<string, number>
}> {
  try {
    // 🎯 Read from admin settings (database)
    const storeSettings = await getStoreSettings()
    
    // ✅ Use admin currency with validation
    let initialCurrency: SupportedCurrency = 'USD' // temporary fallback
    
    if (storeSettings?.currency && isValidCurrency(storeSettings.currency)) {
      initialCurrency = storeSettings.currency as SupportedCurrency
      console.log(`Using admin-configured currency: ${initialCurrency}`)
    } else {
      console.log('No admin currency found, using USD as fallback')
    }
    
    // Fetch exchange rates
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/currency/rates`, {
      next: { revalidate: 3600 }
    })
    
    const initialRates = response.ok ? await response.json() : {}
    
    return { initialCurrency, initialRates }
  } catch (error) {
    console.warn('Failed to fetch initial currency data:', error)
    return { 
      initialCurrency: 'USD' as SupportedCurrency, 
      initialRates: {} 
    }
  }
}

// Generate metadata for SEO
export async function generateMetadata() {
  const storeSettings = await getStoreSettings() // ✅ Returns null, perfect for generateStoreMetadata
  return generateStoreMetadata(storeSettings)
}

// Get featured products using your existing schema
async function getFeaturedProducts() {
  return await db.product.findMany({
    where: {
      status: 'PUBLISHED',
      isFeatured: true,
      stockQuantity: { gt: 0 }
    },
    include: {
      category: true,
      country: true,
      productSizes: {
        where: { isActive: true },
        select: { size: true }
      }
    },
    take: 8,
    orderBy: [
      { stockQuantity: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

// Get categories with product counts
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

// Dynamic Category Showcase
async function CategoryShowcase() {
  const categories = await getCategories()
  const storeSettings = await getStoreSettings() // ✅ Use raw version directly

  if (categories.length === 0) return null

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our carefully curated collections at {storeSettings?.storeName || 'our store'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="mb-4">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: storeSettings?.primaryColor || '#7c3aed' }}
                >
                  {category.name.charAt(0)}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {category._count.products} products
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition-colors"
          >
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Dynamic Featured Products - ✅ EXISTING: Updated to use helper function
async function FeaturedProducts({ storeSettings }: { storeSettings: Awaited<ReturnType<typeof getStoreSettings>> }) {
  const products = await getFeaturedProducts()
  const storeSettingsForProductCard = convertForProductCard(storeSettings) // ✅ Convert inside component

  if (products.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600 mb-8">
            Our featured collection is being updated. Check back soon for amazing products from {storeSettings?.storeName}!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
          >
            Browse All Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of exceptional products from {storeSettings?.storeName || 'our collection'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={{
                ...product,
                shortDescription: product.shortDescription || undefined  // ✅ Convert null to undefined
              }} 
              storeSettings={storeSettingsForProductCard}  // ✅ Use helper function
            />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
          >
            View All Featured Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Dynamic Trust Indicators
function DynamicTrustIndicators({ storeSettings }: { storeSettings: Awaited<ReturnType<typeof getStoreSettings>> }) {
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose {storeSettings?.storeName || 'Us'}?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {storeSettings?.tagline || 'We are committed to bringing you the best products and service'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: CheckCircle, title: 'Authentic Products', desc: 'Genuine and verified items' },
            { icon: Users, title: 'Customer Focused', desc: 'Your satisfaction is our priority' },
            { icon: Award, title: 'Quality Assured', desc: 'Rigorous quality standards' },
            { icon: Heart, title: 'Trusted Brand', desc: 'Built on trust and reliability' }
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm">
                <Icon
                  className="h-10 w-10 mx-auto mb-4"
                  style={{ color: primaryColor }}
                />
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Store Highlights Section
function StoreHighlights({ storeSettings }: { storeSettings: Awaited<ReturnType<typeof getStoreSettings>> }) {
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Truck,
              title: 'Free Shipping',
              description: 'Free shipping on orders over $100 worldwide',
              color: 'green'
            },
            {
              icon: Shield,
              title: 'Secure Payment',
              description: '100% secure payment processing',
              color: 'blue'
            },
            {
              icon: Heart,
              title: '24/7 Support',
              description: 'Dedicated customer support team',
              color: 'purple'
            }
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ✅ MAIN HOME PAGE COMPONENT - Now with New Arrivals and Enhanced Featured Products
export default async function HomePage() {
  const storeSettingsRaw = await getStoreSettings() // ✅ Returns StoreSettings | null for SEO and most components

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Navigation - Uses raw version since it expects string | null */}
      <CustomerNavigation storeSettings={storeSettingsRaw} />

      {/* Currency Notification */}
      <CurrencyNotification />

      {/* Main Content */}
      <main>
        {/* ✅ UPDATED: Dynamic Hero Section - Now uses database slides */}
        <DynamicHeroSection storeSettings={storeSettingsRaw} />

        {/* Category Showcase - MOVED TO SECOND POSITION */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading categories..." />}>
          <CategoryShowcase />
        </Suspense>

        {/* ✅ NEW: New Arrivals Section - MOVED TO THIRD POSITION */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading new arrivals..." />}>
          <NewArrivals storeSettings={convertForProductCard(storeSettingsRaw)} />
        </Suspense>

        {/* ✅ NEW: Enhanced Featured Products Section - MOVED TO FOURTH POSITION */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading featured products..." />}>
          <EnhancedFeaturedProducts storeSettings={convertForProductCard(storeSettingsRaw)} />
        </Suspense>

        {/* Trust Indicators - Uses raw version */}
        <DynamicTrustIndicators storeSettings={storeSettingsRaw} />

        {/* Store Highlights - Uses raw version */}
        <StoreHighlights storeSettings={storeSettingsRaw} />
      </main>

      {/* Enhanced Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationJsonLd(storeSettingsRaw)) // ✅ Use raw (null) version for SEO
        }}
      />
    </div>
  )
}