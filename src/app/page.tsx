// src/app/page.tsx - Updated with New Arrivals and Enhanced Featured Products

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { isValidCurrency, SupportedCurrency, initializeExchangeRates } from '@/lib/currency'
import { generateStoreMetadata, generateOrganizationJsonLd } from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ProductCard from '@/components/customer/ProductCard'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import CurrencyNotification from '@/components/customer/CurrencyNotification'
import DynamicHeroSection from '@/components/customer/DynamicHeroSection'
import NewArrivals from '@/components/customer/NewArrivals'
import EnhancedFeaturedProducts from '@/components/customer/EnhancedFeaturedProducts'
import { getCustomerStoreSettings, getNavCategories, DEFAULT_PRIMARY_COLOR, DEFAULT_ACCENT_COLOR } from '@/lib/store-settings'
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
  CheckCircle,
  Ruler,
  MessageCircle
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Shared helper - same store settings query every customer page uses
async function getStoreSettings() {
  return getCustomerStoreSettings()
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
    
    // Get exchange rates directly (no HTTP call needed in server component)
    const initialRates = await initializeExchangeRates()
    
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

// Get active hero slides server-side so the hero renders with real content on
// first paint instead of a client-fetched skeleton.
async function getHeroSlides() {
  try {
    const slides = await db.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    // Convert Prisma's null to undefined to match the HeroSlide prop type
    return slides.map(slide => ({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle ?? undefined,
      description: slide.description ?? undefined,
      ctaText: slide.ctaText ?? undefined,
      ctaLink: slide.ctaLink ?? undefined,
      image: slide.image ?? undefined,
      gradient: slide.gradient ?? undefined,
      order: slide.order,
      isActive: slide.isActive,
    }))
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    return []
  }
}

// Get categories with product counts and a sample product image for the tile
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
      },
      products: {
        where: {
          status: 'PUBLISHED',
          stockQuantity: { gt: 0 },
          images: { isEmpty: false }
        },
        select: { images: true },
        orderBy: { createdAt: 'desc' },
        take: 1
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
            From everyday kurtas to festive sets — explore the collections at {storeSettings?.storeName || 'our store'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const tileImage = category.products[0]?.images[0]
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group border border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-center"
              >
                {tileImage ? (
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                    <Image
                      src={tileImage}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 17vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] w-full flex items-center justify-center bg-gray-50">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR }}
                    >
                      {category.name.charAt(0)}
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {category._count.products} products
                  </p>
                </div>
              </Link>
            )
          })}
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
            Our featured collection is being updated. Check back soon for new arrivals from {storeSettings?.storeName}!
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
            Handpicked kurtas, sets and ethnic wear from the latest {storeSettings?.storeName || 'store'} collection
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
  const primaryColor = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR

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
            { icon: Sparkles, title: 'Authentic Indian Wear', desc: 'Kurtas, sets and ethnic wear sourced directly from India' },
            { icon: CheckCircle, title: 'Handpicked Pieces', desc: 'Every style is personally selected for fabric, finish and fit' },
            { icon: Package, title: 'Small-Batch Collections', desc: 'Limited quantities — when a piece is gone, it\'s gone' },
            { icon: Heart, title: 'Personal Service', desc: 'Questions about fit or fabric? We\'re happy to help' }
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
  const primaryColor = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Truck,
              title: 'Ships Across the USA',
              description: 'Carefully packed and delivered to your door — see our shipping policy',
              href: '/shipping-policy'
            },
            {
              icon: Ruler,
              title: 'US-Friendly Sizing',
              description: 'Clear size charts with US conversions for every piece',
              href: '/size-guide'
            },
            {
              icon: MessageCircle,
              title: 'DM to Order',
              description: 'See something you love? Message us on Instagram or send a note to order',
              href: '/contact'
            }
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ✅ MAIN HOME PAGE COMPONENT - Now with New Arrivals and Enhanced Featured Products
export default async function HomePage() {
  const [storeSettingsRaw, heroSlides, navCategories] = await Promise.all([
    getStoreSettings(), // ✅ Returns StoreSettings | null for SEO and most components
    getHeroSlides(),
    getNavCategories()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Navigation - Uses raw version since it expects string | null */}
      <CustomerNavigation storeSettings={storeSettingsRaw} initialCategories={navCategories} />

      {/* Currency Notification */}
      <CurrencyNotification />

      {/* Main Content */}
      <main>
        {/* ✅ UPDATED: Dynamic Hero Section - slides fetched server-side, no loading flash */}
        <DynamicHeroSection storeSettings={storeSettingsRaw} initialSlides={heroSlides} />

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