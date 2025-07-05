// src/app/contact/page.tsx
import Link from 'next/link'
import { db } from '@/lib/db'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Heart,
  Star,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  ArrowRight,
  CheckCircle,
  Headphones,
  Package,
  CreditCard,
  Search,
  User,
  ShoppingBag
} from 'lucide-react'

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
  const storeName = storeSettings?.storeName || 'LittleWorks Inc' // Updated default

  return {
    title: `Contact Us - ${storeName}`,
    description: `Get in touch with ${storeName}. We're here to help with your questions and provide excellent customer service.`,
    openGraph: {
      title: `Contact ${storeName}`,
      description: `Get in touch with us. We're here to help with your questions and provide excellent customer service.`,
      type: 'website'
    }
  }
}

// Dynamic Navigation Component
function DynamicNavigation({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'LittleWorks Inc' // Updated default
  const tagline = storeSettings?.tagline || 'Building Digital Solutions' // Updated default
  const primaryColor = storeSettings?.primaryColor || '#1f2937' // Updated default
  const logo = storeSettings?.logo

  return (
    <>
      {/* Dynamic Top Banner */}
      <div
        className="text-white text-center py-2 px-4"
        style={{
          background: `linear-gradient(to right, ${primaryColor}, ${storeSettings?.accentColor || '#f59e0b'})`
        }}
      >
        <p className="text-sm font-medium">
          ✨ Free shipping on orders over $100 | Quality products delivered worldwide
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
              <Link href="/about" className="text-gray-700 hover:text-purple-600">About</Link>
              <Link href="/contact" className="text-purple-600 font-medium">Contact</Link>
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

// Dynamic Hero Section
function ContactHero({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'LittleWorks Inc'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Contact{' '}
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
          We'd love to hear from you! Reach out with any questions about our products,
          orders, shipping, or just to say hello.
        </p>
        <div
          className="flex items-center justify-center gap-2"
          style={{ color: primaryColor }}
        >
          <Heart className="h-5 w-5" />
          <span className="text-sm font-medium">We typically respond within 24 hours</span>
          <Heart className="h-5 w-5" />
        </div>
      </div>
    </section>
  )
}

// Dynamic Contact Information Component
function ContactInformation({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const storeName = storeSettings?.storeName || 'LittleWorks Inc'

  // Dynamic contact information with proper fallbacks
  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email and we\'ll respond within 24 hours',
      value: storeSettings?.email || 'contact@littleworks.inc', // Updated fallback
      action: `mailto:${storeSettings?.email || 'contact@littleworks.inc'}`,
      color: 'blue'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak directly with our customer service team',
      value: storeSettings?.phone || '+1 (555) 123-4567', // Keep generic fallback
      action: `tel:${storeSettings?.phone?.replace(/\s/g, '') || '+15551234567'}`,
      color: 'green'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with us in real-time for instant support',
      value: 'Available Mon-Fri, 9 AM - 6 PM EST',
      action: '#',
      color: 'purple'
    },
    {
      icon: MapPin,
      title: 'Our Location',
      description: 'Business address and office location',
      value: storeSettings?.address || 'Shipping Worldwide - Online Store', // Updated fallback
      action: storeSettings?.address ? `https://maps.google.com/?q=${encodeURIComponent(storeSettings.address)}` : '#',
      color: 'red'
    }
  ]

  const colorClasses = {
    blue: 'border-blue-200 hover:bg-blue-50',
    green: 'border-green-200 hover:bg-green-50',
    purple: 'border-purple-200 hover:bg-purple-50',
    red: 'border-red-200 hover:bg-red-50'
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600">
            Choose the best way to reach us - we're here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactMethods.map((method, index) => {
            const Icon = method.icon
            return (
              <div
                key={index}
                className={`p-6 bg-white border-2 rounded-xl transition-all duration-300 hover:shadow-lg ${colorClasses[method.color as keyof typeof colorClasses]}`}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {method.description}
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    {method.value}
                  </p>
                  {method.action !== '#' && (
                    <a
                      href={method.action}
                      className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                      style={{ color: primaryColor }}
                    >
                      {method.icon === Mail && 'Send Email'}
                      {method.icon === Phone && 'Call Now'}
                      {method.icon === MapPin && storeSettings?.address && 'View on Map'}
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Contact Form Section
function ContactForm({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const storeName = storeSettings?.storeName || 'LittleWorks Inc'

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Send us a Message
          </h2>
          <p className="text-xl text-gray-600">
            Have a question about our products, need help with an order, or want to know more about shipping? Let us know!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
                  style={{
                    '--tw-ring-color': primaryColor
                  } as React.CSSProperties}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
                placeholder="What can we help you with? (e.g., Product inquiry, Order status, Shipping question)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none resize-none"
                placeholder="Tell us more about your inquiry... (e.g., product details you're looking for, order number, delivery address, etc.)"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:transform hover:scale-105 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="inline h-5 w-5 mr-2" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

// Business Hours and Additional Info
function BusinessInfo({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
  const storeName = storeSettings?.storeName || 'LittleWorks Inc'

  const businessHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM EST' },
    { day: 'Sunday', hours: 'Closed' }
  ]

  const socialMedia = [
    { name: 'Instagram', url: storeSettings?.instagram, icon: Instagram },
    { name: 'Facebook', url: storeSettings?.facebook, icon: Facebook },
    { name: 'Twitter', url: storeSettings?.twitter, icon: Twitter }
  ].filter(social => social.url) // Only show configured social media

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Business Hours */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              <Clock className="inline h-6 w-6 mr-2" />
              Business Hours
            </h3>
            <p className="text-gray-600 mb-8">
              Our customer service team is available during these hours for phone and live chat support
            </p>
            <div className="space-y-3">
              {businessHours.map((schedule, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                  <span className="font-medium text-gray-900">{schedule.day}</span>
                  <span className="text-gray-600">{schedule.hours}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <CheckCircle className="inline h-4 w-4 text-green-500 mr-2" />
                Email support available 24/7 - we respond within 24 hours
              </p>
            </div>
          </div>

          {/* Social Media & Additional Info */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              <Globe className="inline h-6 w-6 mr-2" />
              Connect With Us
            </h3>
            <p className="text-gray-600 mb-8">
              Follow us for product updates, special offers, and customer stories
            </p>

            {socialMedia.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Social Media</h4>
                <div className="flex space-x-4">
                  {socialMedia.map((social, index) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Customer Service Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">Customer Support</h4>
              <p className="text-sm text-blue-700">
                {storeName} is committed to providing exceptional customer service.
                Whether you need help with product selection, order tracking, or returns, we're here to help!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Main Contact Page Component
export default async function ContactPage() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'LittleWorks Inc'

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${storeName}`,
    description: `Get in touch with ${storeName} for questions about products, orders, and customer support.`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: storeName,
      email: storeSettings?.email || 'contact@littleworks.inc',
      telephone: storeSettings?.phone,
      address: storeSettings?.address,
      contactPoint: {
        '@type': 'ContactPoint',
        email: storeSettings?.email || 'contact@littleworks.inc',
        telephone: storeSettings?.phone,
        contactType: 'customer service',
        availableLanguage: ['English'],
        hoursAvailable: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '18:00'
          }
        ]
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
        <ContactHero storeSettings={storeSettings} />
        <ContactInformation storeSettings={storeSettings} />
        <ContactForm storeSettings={storeSettings} />
        <BusinessInfo storeSettings={storeSettings} />
      </main>
    </>
  )
}