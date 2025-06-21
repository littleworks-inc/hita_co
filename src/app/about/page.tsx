import Link from 'next/link'
import { db } from '@/lib/db'
import {
  Heart,
  Star,
  Globe,
  Users,
  Award,
  Handshake,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  Search,
  Menu,
  X,
  User,
  Package
} from 'lucide-react'

// Get store settings for branding and content
async function getStoreSettings() {
  return await db.storeSetting.findFirst({
    where: { id: 'default' }
  })
}

// Generate metadata for SEO
export async function generateMetadata() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle'
  
  return {
    title: `About Us - ${storeName}`,
    description: `Learn about ${storeName} - ${tagline}. Discover our story, mission, and commitment to bringing you authentic handcrafted Indian products.`,
    openGraph: {
      title: `About ${storeName}`,
      description: `Learn about our story, mission, and commitment to authentic Indian craftsmanship.`,
      type: 'website'
    }
  }
}

// Simple Navigation Component (Server-side)
function SimpleNavigation({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4">
        <p className="text-sm font-medium">
          ✨ Free shipping on orders over $100 | Authentic handcrafted products
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {storeName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
                  {storeSettings?.tagline && (
                    <p className="text-xs text-gray-500">{storeSettings.tagline}</p>
                  )}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Home
              </Link>
              <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                All Products
              </Link>
              <Link href="/categories" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Categories
              </Link>
              <Link href="/about" className="text-sm font-medium text-purple-600 border-b-2 border-purple-600">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Contact
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-purple-600">
                <Search className="h-6 w-6" />
              </button>
              <button className="text-gray-700 hover:text-red-500 relative">
                <Heart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>
              <button className="text-gray-700 hover:text-purple-600 relative">
                <Package className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>
              <button className="text-gray-700 hover:text-purple-600">
                <User className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

// Hero Section Component
function AboutHero({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle'

  return (
    <section className="relative bg-gradient-to-br from-purple-50 to-pink-50 py-20">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            About{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {storeName}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {tagline}
          </p>
          <div className="flex items-center justify-center gap-2 text-purple-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Celebrating Indian Heritage Since 2020</span>
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  )
}

// Our Story Section
function OurStorySection() {
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
                Founded with a deep passion for Indian heritage and craftsmanship, Hita&Co began as a 
                vision to bridge the gap between traditional artisans and modern consumers who appreciate 
                authentic, handcrafted products.
              </p>
              <p>
                Our journey started when our founder discovered the incredible talent of local artisans 
                across India – from the skilled weavers of Rajasthan to the jewelry makers of Gujarat. 
                These craftspeople carry forward centuries-old traditions, creating pieces that tell 
                stories of culture, heritage, and timeless beauty.
              </p>
              <p>
                Today, we proudly serve customers worldwide, bringing them not just products, but pieces 
                of India's rich cultural tapestry. Every item in our collection is carefully curated to 
                ensure authenticity, quality, and the preservation of traditional craftsmanship.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center h-96">
                <div className="text-center">
                  <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Crafted with Love</p>
                  <p className="text-sm text-gray-500">Traditional Heritage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Mission & Values Section
function MissionValuesSection() {
  const values = [
    {
      icon: Handshake,
      title: 'Authentic Craftsmanship',
      description: 'We partner directly with skilled artisans to bring you genuine, handcrafted products that preserve traditional techniques.'
    },
    {
      icon: Globe,
      title: 'Global Accessibility',
      description: 'Making authentic Indian products accessible to customers worldwide with seamless shopping and international shipping.'
    },
    {
      icon: Heart,
      title: 'Cultural Preservation',
      description: 'Supporting traditional craftspeople and helping preserve centuries-old techniques for future generations.'
    },
    {
      icon: Award,
      title: 'Quality Excellence',
      description: 'Every product is carefully inspected and curated to meet our high standards of quality and authenticity.'
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
            We're committed to celebrating Indian heritage while supporting artisan communities 
            and bringing authentic products to customers around the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
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

// Product Categories Showcase
function CategoriesShowcase() {
  const categories = [
    {
      name: 'Ethnic Clothing',
      description: 'Traditional sarees, lehengas, and kurtis',
      icon: '👗'
    },
    {
      name: 'Handcrafted Jewelry',
      description: 'Authentic silver and traditional designs',
      icon: '💎'
    },
    {
      name: 'Natural Cosmetics',
      description: 'Ayurvedic and herbal beauty products',
      icon: '🌿'
    },
    {
      name: 'Artisan Soaps',
      description: 'Handmade natural and organic soaps',
      icon: '🧼'
    },
    {
      name: 'Home Decor',
      description: 'Traditional decorative items and crafts',
      icon: '🏺'
    },
    {
      name: 'Accessories',
      description: 'Bags, scarves, and ethnic accessories',
      icon: '👜'
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What We Offer
          </h2>
          <p className="text-xl text-gray-600">
            Discover our curated collection of authentic Indian products
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div key={index} className="group bg-gray-50 rounded-xl p-6 hover:bg-purple-50 transition-colors">
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-700">
                {category.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {category.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            Explore Our Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Why Choose Us Section
function WhyChooseUsSection() {
  const reasons = [
    {
      icon: CheckCircle,
      title: 'Authentic Products',
      description: 'Every item is sourced directly from skilled artisans and verified for authenticity.'
    },
    {
      icon: Globe,
      title: 'Worldwide Shipping',
      description: 'We ship internationally with secure packaging and tracking for all orders.'
    },
    {
      icon: Users,
      title: 'Supporting Artisans',
      description: 'Your purchase directly supports traditional craftspeople and their communities.'
    },
    {
      icon: Star,
      title: 'Customer Satisfaction',
      description: 'Thousands of happy customers worldwide trust us for quality and service.'
    }
  ]

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Hita&Co?
          </h2>
          <p className="text-xl text-gray-600">
            Experience the difference of authentic craftsmanship and exceptional service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                  <Icon className="h-8 w-8 text-purple-600" />
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
function CallToActionSection() {
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Explore Authentic Indian Craftsmanship?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of customers worldwide who trust us for authentic, handcrafted Indian products.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            Shop Now
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            <Heart className="h-5 w-5" />
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  )
}

// Main About Page Component
export default async function AboutPage() {
  const storeSettings = await getStoreSettings()

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${storeSettings?.storeName || 'Hita&Co'}`,
    description: `Learn about ${storeSettings?.storeName || 'Hita&Co'} - ${storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle'}`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: storeSettings?.storeName || 'Hita&Co',
      description: storeSettings?.tagline || 'Authentic Indian Ethnic Wear & Lifestyle',
      url: process.env.NEXT_PUBLIC_APP_URL,
      logo: storeSettings?.logo,
      contactPoint: {
        '@type': 'ContactPoint',
        email: storeSettings?.email,
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

      {/* Navigation - Server Component */}
      <SimpleNavigation storeSettings={storeSettings} />

      {/* Page Content */}
      <main>
        <AboutHero storeSettings={storeSettings} />
        <OurStorySection />
        <MissionValuesSection />
        <CategoriesShowcase />
        <WhyChooseUsSection />
        <CallToActionSection />
      </main>
    </>
  )
}