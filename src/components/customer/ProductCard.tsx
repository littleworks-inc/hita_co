// ✅ UPDATED: src/components/customer/ProductCard.tsx - CATALOG/ECOMMERCE TOGGLE SUPPORT

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatPrice } from '@/lib/utils'
import AddToCartButton from '@/components/cart/AddToCartButton'
import ContactButtons from '@/components/customer/ContactButtons'
import {
  Heart,
  Package,
  Eye,
  Tag,
  Star,
  Percent,
  ShoppingCart
} from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  shortDescription?: string | null
  images: string[]
  sellingPriceUSD: number
  discountPercentage: number
  showDiscountToCustomers: boolean
  stockQuantity: number
  isFeatured: boolean
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

interface StoreSettings {
  disableShoppingCart?: boolean
  catalogModeSettings?: string
}

interface ProductCardProps {
  product: Product
  storeSettings?: StoreSettings
  className?: string
}

export default function ProductCard({ 
  product, 
  storeSettings,
  className = '' 
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { currentCurrency, convertPrice } = useCurrency()

  // Parse catalog mode settings
  const isECommerceMode = !storeSettings?.disableShoppingCart
  const catalogSettings = storeSettings?.catalogModeSettings 
    ? (() => {
        try {
          return JSON.parse(storeSettings.catalogModeSettings)
        } catch {
          return {
            whatsappNumber: '',
            instagramHandle: '',
            contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
            showWhatsApp: true,
            showInstagram: true,
            customContactText: 'Contact us for pricing and availability'
          }
        }
      })()
    : null

  // Get primary and secondary images
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null
  const secondaryImage = product.images && product.images.length > 1 ? product.images[1] : null

  // Generate product slug for URL
  const productSlug = `${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`

  // ✅ FIXED: Calculate discount information - MATCHING ADMIN PREVIEW LOGIC
  const hasDiscount = product.discountPercentage > 0
  const shouldShowDiscount = hasDiscount && product.showDiscountToCustomers

  // ✅ CRITICAL FIX: Use the SAME logic as admin preview
  const originalPrice = product.sellingPriceUSD  // $107.11 (crossed out)
  const discountedPrice = originalPrice * (1 - product.discountPercentage / 100)  // $85.69 (what customer pays)
  const savings = originalPrice - discountedPrice  // $21.42

  // Stock status
  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity <= 5 && product.stockQuantity > 0

  return (
    <div className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
      {/* Product Image Container */}
      <Link href={`/products/${productSlug}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          {/* Discount Badge */}
          {shouldShowDiscount && (
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {product.discountPercentage}% OFF
            </div>
          )}

          {/* Stock Status Badge */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Only {product.stockQuantity} left
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute top-3 right-3 z-10 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Out of Stock
            </div>
          )}

          {/* Product Images */}
          {primaryImage && !imageError ? (
            <>
              {/* Primary Image */}
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className={`object-cover transition-all duration-500 ${
                  imageLoading ? 'scale-110 blur-sm' : 'scale-100 blur-0'
                } ${secondaryImage ? 'group-hover:opacity-0' : ''}`}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageError(true)}
                priority={product.isFeatured}
              />

              {/* Secondary Image (hover effect) */}
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} - View 2`}
                  fill
                  className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  onError={() => {}}
                />
              )}
            </>
          ) : (
            /* Fallback when no image */
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
              <div className="flex items-center gap-2">
                {/* Quick View */}
                <button className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Eye className="h-4 w-4 text-gray-700" />
                </button>
                
                {/* Wishlist */}
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    setIsWishlisted(!isWishlisted)
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Product Information */}
      <div className="p-4 space-y-3">
        {/* Category & Stock Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category.name}
          </span>
          {product.isFeatured && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-medium">Featured</span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/products/${productSlug}`}>
          <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {shouldShowDiscount ? (
              <>
                {/* Original price (crossed out) - This is the sellingPriceUSD */}
                <span className="text-base line-through text-gray-400">
                  {formatPrice(convertPrice(originalPrice, currentCurrency), currentCurrency)}
                </span>
                {/* Final discounted price - What customer actually pays */}
                <span className="text-xl font-bold text-red-600">
                  {formatPrice(convertPrice(discountedPrice, currentCurrency), currentCurrency)}
                </span>
                {/* Discount badge */}
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                  {product.discountPercentage}% OFF
                </span>
              </>
            ) : (
              // Regular price when no discount
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(convertPrice(product.sellingPriceUSD, currentCurrency), currentCurrency)}
              </span>
            )}
          </div>

          {/* Savings information on separate line */}
          {shouldShowDiscount && (
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                You save {formatPrice(convertPrice(savings, currentCurrency), currentCurrency)}
              </span>
            </div>
          )}
        </div>

        {/* ✅ NEW: CONDITIONAL RENDERING - eCommerce vs Catalog Mode */}
        {isECommerceMode ? (
          /* eCommerce Mode: Show Add to Cart Button */
          <AddToCartButton 
            product={{
              id: product.id,
              sku: product.sku || product.id, // Use actual SKU or fallback to ID
              name: product.name,
              sellingPriceUSD: discountedPrice, // Use the actual price customer pays
              stockQuantity: product.stockQuantity,
              images: product.images,
              category: product.category,
              country: product.country
            }}
            variant="default"
            className="w-full"
            disabled={isOutOfStock}
          />
        ) : (
          /* Catalog Mode: Show Contact Buttons */
          catalogSettings && (
            <ContactButtons 
              product={product}
              catalogSettings={catalogSettings}
              className="w-full"
            />
          )
        )}
      </div>
    </div>
  )
}