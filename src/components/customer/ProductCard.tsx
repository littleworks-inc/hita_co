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

// ✅ FIXED: ProductCard component with correct currency context usage

export default function ProductCard({ 
  product, 
  storeSettings,
  className = '' 
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // ✅ FIXED: Use 'currency' instead of 'currentCurrency'
  const { currency, convertPrice } = useCurrency()

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

  // ✅ FIXED: Calculate pricing with correct currency conversion
  const basePrice = convertPrice(product.sellingPriceUSD)
  const hasDiscount = product.discountPercentage > 0 && product.showDiscountToCustomers
  const discountedPrice = hasDiscount 
    ? basePrice * (1 - product.discountPercentage / 100)
    : basePrice

  // Stock status
  const isOutOfStock = product.stockQuantity <= 0
  const isLowStock = product.stockQuantity <= 5 && product.stockQuantity > 0

  // Product slug for URL
  const productSlug = `${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`

  return (
    <div className={`group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/products/${productSlug}`} className="block w-full h-full">
          {primaryImage && !imageError ? (
            <>
              {/* Loading state */}
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              {/* Primary image */}
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className={`object-cover transition-all duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                } group-hover:scale-105`}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageError(true)}
              />
              
              {/* Secondary image overlay on hover */}
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} - view 2`}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* Discount badge */}
          {hasDiscount && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <Percent className="h-3 w-3 mr-1" />
              {product.discountPercentage}% OFF
            </span>
          )}
          
          {/* Featured badge */}
          {product.isFeatured && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </span>
          )}
        </div>

        {/* Stock status overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-medium bg-black/70 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-3">
          <Link href={`/products/${productSlug}`}>
            <h3 className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 mb-1">
              {product.name}
            </h3>
          </Link>
          
          <p className="text-sm text-gray-500 mb-2">
            {product.category.name} • {product.country.name}
          </p>

          {/* Product description */}
          {product.shortDescription && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(discountedPrice)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(basePrice)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(discountedPrice)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {!isOutOfStock && (
            <div className="flex items-center gap-1 mt-1">
              {isLowStock ? (
                <>
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-xs text-orange-600">Only {product.stockQuantity} left</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-600">In stock</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {isECommerceMode ? (
          /* eCommerce Mode: Show Add to Cart Button */
          <AddToCartButton 
            product={{
              id: product.id,
              sku: product.sku || product.id, // Use actual SKU or fallback to ID
              name: product.name,
              sellingPriceUSD: product.sellingPriceUSD, // Use original USD price for cart
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