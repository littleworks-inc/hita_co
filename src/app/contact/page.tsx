// src/app/contact/page.tsx
import Link from 'next/link'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import Breadcrumb from '@/components/customer/Breadcrumb'
import ContactFormClient from '@/components/customer/ContactFormClient'
import { getCustomerStoreSettings, getNavCategories, DEFAULT_PRIMARY_COLOR, DEFAULT_ACCENT_COLOR } from '@/lib/store-settings'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
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
  CreditCard
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Get store settings for dynamic content - shared helper so Contact matches
// every other customer page (colors, catalog mode, contact info)
async function getStoreSettings() {
  return getCustomerStoreSettings()
}

// Generate dynamic metadata
export async function generateMetadata() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'

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

// Dynamic Hero Section
function ContactHero({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR
  const accentColor = storeSettings?.accentColor || DEFAULT_ACCENT_COLOR

  return (
    <section className="bg-gray-50 py-16">
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
  const primaryColor = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR
  const storeName = storeSettings?.storeName || 'Hita&Co'

  // Dynamic contact information - each method only appears when the admin
  // has actually configured it (no fake placeholder phone numbers etc).
  const contactMethods = [
    storeSettings?.email && {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email and we\'ll respond within 24 hours',
      value: storeSettings.email,
      action: `mailto:${storeSettings.email}`
    },
    storeSettings?.phone && {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak directly with our customer service team',
      value: storeSettings.phone,
      action: `tel:${storeSettings.phone.replace(/\s/g, '')}`
    },
    {
      icon: MapPin,
      title: 'Our Location',
      description: 'Business address and office location',
      value: storeSettings?.address || 'Shipping Worldwide - Online Store',
      action: storeSettings?.address ? `https://maps.google.com/?q=${encodeURIComponent(storeSettings.address)}` : '#'
    }
  ].filter((method): method is NonNullable<typeof method> => Boolean(method))

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
                className="p-6 bg-white border-2 border-purple-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-purple-50"
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
  const primaryColor = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR

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
          <ContactFormClient primaryColor={primaryColor} />
        </div>
      </div>
    </section>
  )
}

// Business Hours and Additional Info
function BusinessInfo({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR
  const storeName = storeSettings?.storeName || 'Hita&Co'

  // Admin-editable free text (one line per schedule), set in Store Settings > Contact Info
  const businessHoursLines: string[] = (storeSettings?.businessHours || '')
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean)

  const socialMedia = [
    { name: 'Instagram', url: storeSettings?.instagram, icon: Instagram },
    { name: 'Facebook', url: storeSettings?.facebook, icon: Facebook },
    { name: 'Twitter', url: storeSettings?.twitter, icon: Twitter }
  ].filter(social => social.url) // Only show configured social media

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Business Hours - admin-editable via Store Settings > Contact Info */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              <Clock className="inline h-6 w-6 mr-2" />
              Business Hours
            </h3>
            {businessHoursLines.length > 0 ? (
              <>
                <p className="text-gray-600 mb-8">
                  Our customer service team is available during these hours for phone support
                </p>
                <div className="space-y-3">
                  {businessHoursLines.map((line, index) => {
                    const [day, ...rest] = line.split(':')
                    const hours = rest.join(':').trim()
                    return (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                        <span className="font-medium text-gray-900">{day.trim()}</span>
                        {hours && <span className="text-gray-600">{hours}</span>}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="text-gray-600 mb-8">
                Reach us by email anytime - we respond within 24 hours.
              </p>
            )}
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-purple-900 mb-2">Customer Support</h4>
              <p className="text-sm text-purple-700">
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
  const [storeSettings, navCategories] = await Promise.all([
    getStoreSettings(),
    getNavCategories()
  ])
  const storeName = storeSettings?.storeName || 'Hita&Co'

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
      email: storeSettings?.email || undefined,
      telephone: storeSettings?.phone,
      address: storeSettings?.address,
      contactPoint: {
        '@type': 'ContactPoint',
        email: storeSettings?.email || undefined,
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

      {/* Shared site navigation - same component every other customer page uses */}
      <CustomerNavigation storeSettings={storeSettings} initialCategories={navCategories} />

      {/* Page Content */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumb items={[{ label: 'Contact' }]} className="mb-0" />
        </div>
        <ContactHero storeSettings={storeSettings} />
        <ContactInformation storeSettings={storeSettings} />
        <ContactForm storeSettings={storeSettings} />
        <BusinessInfo storeSettings={storeSettings} />
      </main>
    </>
  )
}