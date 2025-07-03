'use client'

import { useState } from 'react'
import { MessageCircle, Instagram, ExternalLink } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: string
  sku: string
  name: string
  shortDescription?: string
  sellingPriceUSD: number
  discountPercentage: number
  showDiscountToCustomers: boolean
  category: {
    id: string
    name: string
    slug: string
  }
  country: {
    id: string
    name: string
    currency: string
    currencySymbol: string
  }
}

interface CatalogModeSettings {
  whatsappNumber: string
  instagramHandle: string
  contactMessage: string
  showWhatsApp: boolean
  showInstagram: boolean
  customContactText?: string
}

interface ContactButtonsProps {
  product: Product
  catalogSettings: CatalogModeSettings
  className?: string
}

export default function ContactButtons({ 
  product, 
  catalogSettings, 
  className = '' 
}: ContactButtonsProps) {
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false)
  const [isInstagramLoading, setIsInstagramLoading] = useState(false)
  const { currentCurrency, convertPrice } = useCurrency()

  // Calculate final price with discount
  const originalPrice = convertPrice(product.sellingPriceUSD, product.country.currency)
  const discountAmount = product.showDiscountToCustomers 
    ? (originalPrice * product.discountPercentage) / 100 
    : 0
  const finalPrice = originalPrice - discountAmount

  // Generate comprehensive product message
  const generateProductMessage = () => {
    const baseMessage = catalogSettings.contactMessage || 
      "Hi! I'm interested in this product. Can you provide more details?"
    
    const productInfo = `

Product Details:
• Name: ${product.name}
• SKU: ${product.sku}
• Category: ${product.category.name}
• Price: ${formatPrice(finalPrice)}${discountAmount > 0 ? ` (${product.discountPercentage}% off)` : ''}
• Origin: ${product.country.name}${product.shortDescription ? `
• Description: ${product.shortDescription}` : ''}`

    return `${baseMessage}${productInfo}`
  }

  // Generate WhatsApp URL with pre-filled message
  const generateWhatsAppUrl = () => {
    const message = encodeURIComponent(generateProductMessage())
    const phoneNumber = catalogSettings.whatsappNumber.replace(/[^\d]/g, '') // Remove non-digits
    return `https://wa.me/${phoneNumber}?text=${message}`
  }

  // Generate Instagram URL
  const generateInstagramUrl = () => {
    const handle = catalogSettings.instagramHandle.replace('@', '') // Remove @ if present
    return `https://instagram.com/${handle}`
  }

  const handleWhatsAppClick = () => {
    setIsWhatsAppLoading(true)
    window.open(generateWhatsAppUrl(), '_blank')
    // Reset loading after a short delay
    setTimeout(() => setIsWhatsAppLoading(false), 1000)
  }

  const handleInstagramClick = () => {
    setIsInstagramLoading(true)
    window.open(generateInstagramUrl(), '_blank')
    // Reset loading after a short delay
    setTimeout(() => setIsInstagramLoading(false), 1000)
  }

  // Don't render if no contact methods are enabled
  if (!catalogSettings.showWhatsApp && !catalogSettings.showInstagram) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Custom contact text */}
      {catalogSettings.customContactText && (
        <p className="text-sm text-gray-600 text-center">
          {catalogSettings.customContactText}
        </p>
      )}

      {/* Contact buttons */}
      <div className="space-y-2">
        {/* WhatsApp Button */}
        {catalogSettings.showWhatsApp && catalogSettings.whatsappNumber && (
          <button
            onClick={handleWhatsAppClick}
            disabled={isWhatsAppLoading}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <MessageCircle className="h-5 w-5" />
            <span>
              {isWhatsAppLoading ? 'Opening WhatsApp...' : 'Contact via WhatsApp'}
            </span>
            <ExternalLink className="h-4 w-4" />
          </button>
        )}

        {/* Instagram Button */}
        {catalogSettings.showInstagram && catalogSettings.instagramHandle && (
          <button
            onClick={handleInstagramClick}
            disabled={isInstagramLoading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
          >
            <Instagram className="h-5 w-5" />
            <span>
              {isInstagramLoading ? 'Opening Instagram...' : 'Contact via Instagram'}
            </span>
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Contact info display */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        {catalogSettings.showWhatsApp && catalogSettings.whatsappNumber && (
          <div>WhatsApp: {catalogSettings.whatsappNumber}</div>
        )}
        {catalogSettings.showInstagram && catalogSettings.instagramHandle && (
          <div>Instagram: @{catalogSettings.instagramHandle.replace('@', '')}</div>
        )}
      </div>
    </div>
  )
}