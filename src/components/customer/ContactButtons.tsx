// src/components/customer/ContactButtons.tsx
// ✅ FINAL PIECE: ContactButtons component for Catalog Mode

'use client'

import { MessageCircle, Instagram, Phone, Mail } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  images: string[]
}

interface CatalogSettings {
  whatsappNumber?: string
  instagramHandle?: string
  contactMessage?: string
  showWhatsApp?: boolean
  showInstagram?: boolean
  customContactText?: string
  showPhone?: boolean
  phoneNumber?: string
  showEmail?: boolean
  emailAddress?: string
}

interface ContactButtonsProps {
  product: Product
  catalogSettings: CatalogSettings
  className?: string
}

export default function ContactButtons({ 
  product, 
  catalogSettings, 
  className = '' 
}: ContactButtonsProps) {
  
  // Generate contact message with product details
  const generateContactMessage = () => {
    const baseMessage = catalogSettings.contactMessage || 
      "Hi! I'm interested in this product. Can you provide more details?"
    
    return `${baseMessage}\n\nProduct: ${product.name}\nSKU: ${product.sku}\nPrice: $${product.sellingPriceUSD}`
  }

  // WhatsApp contact handler
  const handleWhatsAppContact = () => {
    if (!catalogSettings.whatsappNumber) return
    
    const message = encodeURIComponent(generateContactMessage())
    const phoneNumber = catalogSettings.whatsappNumber.replace(/[^\d]/g, '') // Remove non-digits
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    
    window.open(whatsappUrl, '_blank')
  }

  // Instagram contact handler
  const handleInstagramContact = () => {
    if (!catalogSettings.instagramHandle) return
    
    let instagramHandle = catalogSettings.instagramHandle
    // Remove @ if present and clean handle
    instagramHandle = instagramHandle.replace('@', '').replace(/[^a-zA-Z0-9._]/g, '')
    
    const instagramUrl = `https://instagram.com/${instagramHandle}`
    window.open(instagramUrl, '_blank')
  }

  // Phone contact handler
  const handlePhoneContact = () => {
    if (!catalogSettings.phoneNumber) return
    
    const phoneNumber = catalogSettings.phoneNumber.replace(/[^\d]/g, '')
    window.location.href = `tel:+${phoneNumber}`
  }

  // Email contact handler
  const handleEmailContact = () => {
    if (!catalogSettings.emailAddress) return
    
    const subject = encodeURIComponent(`Inquiry about ${product.name}`)
    const body = encodeURIComponent(generateContactMessage())
    
    window.location.href = `mailto:${catalogSettings.emailAddress}?subject=${subject}&body=${body}`
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Custom Contact Text */}
      {catalogSettings.customContactText && (
        <p className="text-xs text-gray-600 text-center mb-3">
          {catalogSettings.customContactText}
        </p>
      )}

      {/* Primary Contact Buttons */}
      <div className="grid gap-2">
        {/* WhatsApp Button */}
        {catalogSettings.showWhatsApp && catalogSettings.whatsappNumber && (
          <button
            onClick={handleWhatsAppContact}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contact on WhatsApp
          </button>
        )}

        {/* Instagram Button */}
        {catalogSettings.showInstagram && catalogSettings.instagramHandle && (
          <button
            onClick={handleInstagramContact}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Instagram className="h-4 w-4" />
            Message on Instagram
          </button>
        )}

        {/* Phone Button */}
        {catalogSettings.showPhone && catalogSettings.phoneNumber && (
          <button
            onClick={handlePhoneContact}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call Us
          </button>
        )}

        {/* Email Button */}
        {catalogSettings.showEmail && catalogSettings.emailAddress && (
          <button
            onClick={handleEmailContact}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </button>
        )}
      </div>

      {/* Fallback: If no contact methods are configured */}
      {!catalogSettings.showWhatsApp && 
       !catalogSettings.showInstagram && 
       !catalogSettings.showPhone && 
       !catalogSettings.showEmail && (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            Contact information not configured.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Please configure contact methods in admin settings.
          </p>
        </div>
      )}
    </div>
  )
}