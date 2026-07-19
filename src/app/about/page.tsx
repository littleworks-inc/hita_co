// src/app/about/page.tsx
import Link from 'next/link'
import { db } from '@/lib/db'
import {
  Heart,
  Star,
  Globe,
  Users,
  Award,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  Search,
  Menu,
  User,
  Package,
  Target,
  Shield,
  Zap
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Get store settings for dynamic content
async function getStoreSettings() {
  try {
    return await db.storeSetting.findFirst({
      where: { id: 'default' }
    })
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return null
  }
}

// Generate dynamic metadata
export async function generateMetadata() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear'
  
  return {
    title: `About Us - ${storeName}`,
    description: `Learn about ${storeName} - ${tagline}. Authentic Indian ethnic wear for women, curated from India and shipped within the USA.`,
    openGraph: {
      title: `About ${storeName}`,
      description: `Learn about our story, mission, and commitment to excellence.`,
      type: 'website'
    }
  }
}

// Dynamic Navigation Component
function DynamicNavigation({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const accentColor = storeSettings?.accentColor || '#f59e0b'
  const logo = storeSettings?.logo

  return (
    <>
      {/* Dynamic Top Banner */}
      <div 
        className="text-white text-center py-2 px-4"
        style={{ 
          background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` 
        }}
      >
        <p className="text-sm font-medium">
          ✨ Authentic Indian ethnic wear for women | Shipped across the USA
        </p>
      </div>

      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                {logo ? (
                  <img
                    src={logo}
                    alt={storeName}
                    className="h-8 w-auto"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {storeName.split(' ').map((word: string) => word.charAt(0)).join('').substring(0, 2)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
                  <p className="text-xs text-gray-600">{tagline}</p>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-purple-600">Home</Link>
              <Link href="/products" className="text-gray-700 hover:text-purple-600">Products</Link>
              <Link href="/about" className="text-purple-600 font-medium">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-purple-600">Contact</Link>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-4">
              <Search className="h-5 w-5 text-gray-600 hover:text-purple-600 cursor-pointer" />
              <div className="relative">
                <ShoppingBag className="h-6 w-6 text-gray-700 hover:text-purple-600 cursor-pointer" />
                <span 
                  className="absolute -top-2 -right-2 h-4 w-4 rounded-full text-xs font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  0
                </span>
              </div>
              <User className="h-6 w-6 text-gray-700 hover:text-purple-600 cursor-pointer" />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

// About Hero Section
function AboutHero({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About{' '}
            <span 
              className="bg-clip-text text-transparent"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {storeName}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {tagline} — bringing the colors, fabrics and craftsmanship of India to women across the USA.
          </p>
          <div
            className="flex items-center justify-center gap-2"
            style={{ color: primaryColor }}
          >
            <Star className="h-5 w-5" />
            <span className="text-sm font-medium">From India&apos;s artisans to your closet</span>
            <Star className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  )
}

// Our Story Section
function OurStorySection({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                {storeName} began with a simple idea: the kurtas, sets and drapes we grew up
                loving in India shouldn&apos;t be hard to find — or hard to fit — for women
                living in the United States.
              </p>
              <p>
                We work directly with suppliers and artisans in India to handpick every piece
                in our collection, from everyday cotton kurtas to festive wear for weddings,
                Diwali and celebrations. Each item is chosen for its fabric, finish and fit
                before it ever reaches our store.
              </p>
              <p>
                You&apos;ll also find us in person at exhibitions and pop-up events, where we
                love helping customers find the right piece and the right size. Online or in
                person, our goal is the same — authentic Indian wear, honestly described and
                sized for you.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100">
              <div 
                className="w-full h-full flex items-center justify-center text-white text-6xl font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {storeName.split(' ').map((word: string) => word.charAt(0)).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Mission & Values Section
function MissionValuesSection({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#1f2937'

  const values = [
    {
      icon: Target,
      title: 'Quality First',
      description: 'We carefully select each product to ensure it meets our high standards for quality, authenticity, and value.'
    },
    {
      icon: Users,
      title: 'Customer Focus',
      description: 'Our customers are at the heart of everything we do. We listen, we care, and we deliver exceptional service.'
    },
    {
      icon: Shield,
      title: 'Honest & Transparent',
      description: 'Real measurements, honest descriptions, and clear policies — so you know exactly what you\'re ordering.'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Quick processing and reliable delivery across the USA, so your outfit arrives in time for the occasion.'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Mission & Values
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to providing an exceptional online shopping experience built on trust, quality, and customer satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div key={index} className="text-center">
                <div 
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white mb-4"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {value.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Services Overview Section
function ServicesOverview({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#1f2937'

  const features = [
    {
      icon: Globe,
      title: 'US Shipping',
      description: 'We ship across the United States with tracking on every order.'
    },
    {
      icon: Package,
      title: 'Curated Selection',
      description: 'Every piece is hand-picked from Indian suppliers and artisans for quality and authenticity.'
    },
    {
      icon: Sparkles,
      title: 'Small-Batch Styles',
      description: 'Limited quantities of each design — pieces you won\'t see everywhere.'
    },
    {
      icon: Award,
      title: 'Customer Support',
      description: 'Our dedicated support team is here to help with questions, orders, and returns.'
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Shop With Us
          </h2>
          <p className="text-xl text-gray-600">
            We're committed to making your shopping experience exceptional from browsing to delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Why Choose Us Section
function WhyChooseUsSection({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#1f2937'

  const reasons = [
    {
      icon: CheckCircle,
      title: 'Rooted in India',
      description: 'Our pieces come directly from Indian suppliers and artisans — authentic fabrics, prints and craftsmanship.'
    },
    {
      icon: Users,
      title: 'We Know the Fit',
      description: 'Indian sizing explained in US terms, with a detailed size guide and personal sizing help when you need it.'
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Your satisfaction is our priority. We go above and beyond to ensure you love your purchase.'
    },
    {
      icon: Star,
      title: 'Meet Us in Person',
      description: 'Find us at exhibitions and pop-up events, where you can see and feel the collection yourself.'
    }
  ]

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-xl text-gray-600">
            Experience the difference of shopping with a store that truly cares about your satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                  <Icon className="h-8 w-8" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {reason.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {reason.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Call to Action Section
function CallToActionSection({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Start Shopping?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          From everyday kurtas to festive favorites — discover the {storeName} collection today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            style={{ 
              background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` 
            }}
          >
            <Heart className="h-5 w-5" />
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            <Package className="h-5 w-5" />
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  )
}

// Main About Page Component
export default async function AboutPage() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear'

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${storeName}`,
    description: `Learn about ${storeName} - ${tagline}`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: storeName,
      description: tagline,
      url: process.env.NEXT_PUBLIC_APP_URL,
      logo: storeSettings?.logo,
      contactPoint: {
        '@type': 'ContactPoint',
        email: storeSettings?.email || undefined,
        telephone: storeSettings?.phone,
        contactType: 'customer service'
      }
    }
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      {/* Dynamic Navigation */}
      <DynamicNavigation storeSettings={storeSettings} />

      {/* Page Content */}
      <main>
        <AboutHero storeSettings={storeSettings} />
        <OurStorySection storeSettings={storeSettings} />
        <MissionValuesSection storeSettings={storeSettings} />
        <ServicesOverview storeSettings={storeSettings} />
        <WhyChooseUsSection storeSettings={storeSettings} />
        <CallToActionSection storeSettings={storeSettings} />
      </main>
    </>
  )
}