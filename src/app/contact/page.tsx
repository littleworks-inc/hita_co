import { Suspense } from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import ContactForm from '@/components/customer/ContactForm'
import LoadingSpinner from '@/components/customer/LoadingSpinner'
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
  CreditCard
} from 'lucide-react'

// Get store settings for contact information
async function getStoreSettings() {
  return await db.storeSetting.findFirst({
    where: { id: 'default' }
  })
}

// Generate metadata for SEO
export async function generateMetadata() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  
  return {
    title: `Contact Us - ${storeName}`,
    description: `Get in touch with ${storeName}. We're here to help with your questions about our authentic Indian products, orders, and customer service.`,
    openGraph: {
      title: `Contact ${storeName}`,
      description: `Get in touch with us. We're here to help with your questions and provide excellent customer service.`,
      type: 'website'
    }
  }
}

// Hero Section Component
function ContactHero({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'

  return (
    <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Contact{' '}
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {storeName}
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          We'd love to hear from you! Reach out with any questions about our products, 
          orders, or just to say hello.
        </p>
        <div className="flex items-center justify-center gap-2 text-purple-600">
          <Heart className="h-5 w-5" />
          <span className="text-sm font-medium">We typically respond within 24 hours</span>
          <Heart className="h-5 w-5" />
        </div>
      </div>
    </section>
  )
}

// Contact Information Component
function ContactInformation({ storeSettings }: { storeSettings: any }) {
  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email and we\'ll respond within 24 hours',
      value: storeSettings?.email || 'contact@hitaandco.com',
      action: `mailto:${storeSettings?.email || 'contact@hitaandco.com'}`,
      color: 'blue'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak directly with our customer service team',
      value: storeSettings?.phone || '+1 (555) 123-4567',
      action: `tel:${storeSettings?.phone || '+15551234567'}`,
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
      title: 'Visit Us',
      description: 'Our business address for correspondence',
      value: storeSettings?.address || 'New York, NY, USA',
      action: '#',
      color: 'red'
    }
  ]

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
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-50',
              green: 'bg-green-100 text-green-600 border-green-200 hover:bg-green-50',
              purple: 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-50',
              red: 'bg-red-100 text-red-600 border-red-200 hover:bg-red-50'
            }

            return (
              <div key={index} className="group">
                <a
                  href={method.action}
                  className={`block p-6 rounded-xl border-2 transition-all duration-300 ${colorClasses[method.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg mb-4 mx-auto">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    {method.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    {method.description}
                  </p>
                  <p className="text-sm font-medium text-center group-hover:underline">
                    {method.value}
                  </p>
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Contact Form Section
function ContactFormSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Send Us a Message
          </h2>
          <p className="text-xl text-gray-600">
            Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      icon: Package,
      question: 'What is your shipping policy?',
      answer: 'We offer free shipping on orders over $100. Standard shipping takes 5-7 business days, and we ship internationally to most countries.'
    },
    {
      icon: CreditCard,
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and other secure payment methods. All transactions are encrypted and secure.'
    },
    {
      icon: Star,
      question: 'Are your products authentic?',
      answer: 'Yes! All our products are sourced directly from skilled artisans and verified for authenticity. We work closely with craftspeople across India.'
    },
    {
      icon: Headphones,
      question: 'How can I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email. You can use this to track your package until it arrives.'
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Quick answers to common questions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq, index) => {
            const Icon = faq.icon
            return (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
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

// Social Media & Hours Section
function SocialMediaSection({ storeSettings }: { storeSettings: any }) {
  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      url: storeSettings?.instagram,
      color: 'from-purple-400 to-pink-400'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: storeSettings?.facebook,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: storeSettings?.twitter,
      color: 'from-blue-400 to-blue-500'
    }
  ].filter(link => link.url) // Only show social links that exist

  const businessHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM EST' },
    { day: 'Sunday', hours: 'Closed' }
  ]

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Social Media */}
          {socialLinks.length > 0 && (
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Follow Us
              </h3>
              <p className="text-gray-600 mb-8">
                Stay updated with our latest products and behind-the-scenes content
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-transform hover:scale-105 bg-gradient-to-r ${social.color}`}
                    >
                      <Icon className="h-5 w-5" />
                      {social.name}
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Business Hours */}
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              <Clock className="inline h-6 w-6 mr-2" />
              Business Hours
            </h3>
            <p className="text-gray-600 mb-8">
              Our customer service team is available during these hours for phone and live chat support
            </p>
            <div className="space-y-3">
              {businessHours.map((schedule, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="font-medium text-gray-900">{schedule.day}</span>
                  <span className="text-gray-600">{schedule.hours}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                <CheckCircle className="inline h-4 w-4 text-green-500 mr-2" />
                Email support available 24/7 - we respond within 24 hours
              </p>
            </div>
          </div>
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
          Ready to Shop Authentic Indian Products?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Explore our curated collection of handcrafted items while we're here to help with any questions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
          >
            <Heart className="h-5 w-5" />
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            <Star className="h-5 w-5" />
            Learn About Us
          </Link>
        </div>
      </div>
    </section>
  )
}

// Main Contact Page Component
export default async function ContactPage() {
  const storeSettings = await getStoreSettings()

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${storeSettings?.storeName || 'Hita&Co'}`,
    description: `Get in touch with ${storeSettings?.storeName || 'Hita&Co'} for questions about our authentic Indian products and customer service.`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: storeSettings?.storeName || 'Hita&Co',
      email: storeSettings?.email,
      telephone: storeSettings?.phone,
      address: storeSettings?.address,
      contactPoint: {
        '@type': 'ContactPoint',
        email: storeSettings?.email,
        telephone: storeSettings?.phone,
        contactType: 'customer service',
        availableLanguage: ['English'],
        hoursAvailable: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '18:00'
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Saturday',
            opens: '10:00',
            closes: '16:00'
          }
        ]
      },
      sameAs: [
        storeSettings?.instagram,
        storeSettings?.facebook,
        storeSettings?.twitter
      ].filter(Boolean)
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

      {/* Navigation */}
      <CustomerNavigation storeSettings={storeSettings} />

      {/* Page Content */}
      <main>
        <ContactHero storeSettings={storeSettings} />
        <ContactInformation storeSettings={storeSettings} />
        <ContactFormSection />
        <FAQSection />
        <SocialMediaSection storeSettings={storeSettings} />
        <CallToActionSection />
      </main>
    </>
  )
}