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
  User
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

// Dynamic Navigation Component
function DynamicNavigation({ storeSettings }: { storeSettings: any }) {
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Authentic Indian Ethnic Wear'
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'
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
          ✨ Free shipping on orders over $100 | Authentic handcrafted products
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
                    className="w-10 h-10 object-contain rounded-full"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {storeName.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
                  <p className="text-xs text-gray-500">{tagline}</p>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Home
              </Link>
              <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Products
              </Link>
              <Link href="/categories" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                Categories
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-purple-600">
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-sm font-medium border-b-2"
                style={{ 
                  color: primaryColor, 
                  borderColor: primaryColor 
                }}
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Search className="h-6 w-6 text-gray-700 hover:text-purple-600 cursor-pointer" />
              <div className="relative">
                <Heart className="h-6 w-6 text-gray-700 hover:text-red-500 cursor-pointer" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </div>
              <div className="relative">
                <Package className="h-6 w-6 text-gray-700 hover:text-purple-600 cursor-pointer" />
                <span 
                  className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
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
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

  return (
    <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
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
          orders, or just to say hello.
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
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'

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
              <div key={index} className="group">
                <a
                  href={method.action}
                  className={`block p-6 rounded-xl border-2 transition-all duration-300 ${colorClasses[method.color as keyof typeof colorClasses]}`}
                >
                  <div 
                    className="flex items-center justify-center w-12 h-12 rounded-lg mb-4 mx-auto"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: primaryColor }} />
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

// Simple Contact Form Component
function ContactFormSection({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'

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
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors"
                  style={{ 
                    '--tw-ring-color': primaryColor,
                    '--tw-ring-opacity': '0.5'
                  } as React.CSSProperties}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors"
                  style={{ 
                    '--tw-ring-color': primaryColor,
                    '--tw-ring-opacity': '0.5'
                  } as React.CSSProperties}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Inquiry Type
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none">
                  <option>General Inquiry</option>
                  <option>Product Question</option>
                  <option>Order Support</option>
                  <option>Shipping Question</option>
                  <option>Return/Exchange</option>
                  <option>Wholesale Inquiry</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Subject *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors"
                placeholder="What is your message about?"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Message *
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-colors resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'

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
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: primaryColor }} />
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

// Dynamic Social Media & Hours Section
function SocialMediaSection({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

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

// Dynamic Call to Action Section
function CallToActionSection({ storeSettings }: { storeSettings: any }) {
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'
  const accentColor = storeSettings?.accentColor || '#f59e0b'

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

      {/* Dynamic Navigation */}
      <DynamicNavigation storeSettings={storeSettings} />

      {/* Page Content */}
      <main>
        <ContactHero storeSettings={storeSettings} />
        <ContactInformation storeSettings={storeSettings} />
        <ContactFormSection storeSettings={storeSettings} />
        <FAQSection storeSettings={storeSettings} />
        <SocialMediaSection storeSettings={storeSettings} />
        <CallToActionSection storeSettings={storeSettings} />
      </main>
    </>
  )
}