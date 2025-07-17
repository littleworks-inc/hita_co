import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { isValidCurrency, SupportedCurrency } from '@/lib/currency'  // ✅ ADD: For layout fix
import { generateStoreMetadata, generateOrganizationJsonLd } from '@/lib/seo'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ProductCard from '@/components/customer/ProductCard'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
import CurrencyNotification from '@/components/customer/CurrencyNotification'
import DynamicHeroSection from '@/components/customer/DynamicHeroSection' // ✅ Import the updated clean component
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
    disableShoppingCart: storeSettings.disableShoppingCart,
    catalogModeSettings: storeSettings.catalogModeSettings
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

// Dynamic Featured Products - ✅ FIXED: Updated to use helper function
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
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-6 w-6 text-purple-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured Products</h2>
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection from {storeSettings?.storeName}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                shortDescription: product.shortDescription || undefined  // ✅ Convert null to undefined
              }}
              storeSettings={storeSettingsForProductCard} // ✅ Now properly typed for ProductCard interface
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products?isFeatured=true"
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

// Dynamic Trust Indicators - Uses existing store settings
function DynamicTrustIndicators({ storeSettings }: { storeSettings: Awaited<ReturnType<typeof getStoreSettings>> }) {
  const storeName = storeSettings?.storeName || 'our store'
  const isECommerceMode = !storeSettings?.disableShoppingCart

  // Create dynamic trust badges based on your existing fields
  const trustBadges = [
    {
      icon: Shield,
      title: 'Secure Shopping',
      description: `Safe and secure transactions at ${storeName}`,
      color: 'text-green-600'
    },
    {
      icon: isECommerceMode ? Truck : Users,
      title: isECommerceMode ? 'Fast Delivery' : 'Expert Service',
      description: isECommerceMode ? 'Quick and reliable shipping' : 'Personalized customer service',
      color: 'text-blue-600'
    },
    {
      icon: Award,
      title: 'Quality Guarantee',
      description: `Premium quality products from ${storeName}`,
      color: 'text-purple-600'
    }
  ]

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div key={index} className="text-center">
                <div className="mb-4">
                  <Icon className={`h-12 w-12 mx-auto ${badge.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{badge.title}</h3>
                <p className="text-sm text-gray-600">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Dynamic Store Highlights
function StoreHighlights({ storeSettings }: { storeSettings: Awaited<ReturnType<typeof getStoreSettings>> }) {
  const storeName = storeSettings?.storeName || 'Our Store'
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose {storeName}?
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

// ✅ MAIN HOME PAGE COMPONENT - Uses the clean DynamicHeroSection
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
        {/* ✅ CLEAN: Dynamic Hero Section - Now uses the updated clean component */}
        <DynamicHeroSection storeSettings={storeSettingsRaw} />

        {/* Category Showcase */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading categories..." />}>
          <CategoryShowcase />
        </Suspense>

        {/* Featured Products */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading featured products..." />}>
          <FeaturedProducts storeSettings={storeSettingsRaw} />
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