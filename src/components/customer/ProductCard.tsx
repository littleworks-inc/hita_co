// ✅ FIXED: src/components/customer/ProductCard.tsx - WITH PROPER DISCOUNT DISPLAY

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatPrice } from '@/lib/utils'
import { calculateDiscountInfo, hasActiveCustomerDiscount } from '@/lib/discount-utils'
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
  name: string
  shortDescription?: string
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

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { currentCurrency, convertPrice } = useCurrency()

  // Get primary and secondary images
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null
  const secondaryImage = product.images && product.images.length > 1 ? product.images[1] : null

  // Generate product slug for URL
  const productSlug = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product.id.slice(-8)}`

  // Calculate discount information
  const discountInfo = calculateDiscountInfo({
    sellingPriceUSD: product.sellingPriceUSD,
    discountPercentage: product.discountPercentage,
    showDiscountToCustomers: product.showDiscountToCustomers
  })

  // Stock status
  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity <= 5 && product.stockQuantity > 0

  return (
    <div className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
      {/* Product Image Container */}
      <Link href={`/products/${productSlug}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          {/* Discount Badge */}
          {discountInfo.shouldShowDiscount && (
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {discountInfo.discountPercent}% OFF
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
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Secondary Image (Hover Effect) */}
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} - View 2`}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              )}
            </>
          ) : (
            // Fallback placeholder
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex gap-2">
              <div className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                <Eye className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Category & Country */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {product.category.name}
          </span>
          <span>{product.country.name}</span>
        </div>

        {/* Product Name */}
        <Link href={`/products/${productSlug}`} className="block">
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* FIXED: Price Display Section - Proper spacing and layout */}
        <div className="space-y-2">
          {/* Price Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {discountInfo.shouldShowDiscount ? (
              <>
                {/* Original price (crossed out) */}
                <span className="text-base line-through text-gray-400">
                  {formatPrice(convertPrice(discountInfo.originalPrice, currentCurrency), currentCurrency)}
                </span>
                {/* Final discounted price */}
                <span className="text-xl font-bold text-red-600">
                  {formatPrice(convertPrice(discountInfo.discountedPrice, currentCurrency), currentCurrency)}
                </span>
                {/* Discount badge */}
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                  {discountInfo.discountPercent}% OFF
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
          {discountInfo.shouldShowDiscount && (
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                You save {formatPrice(convertPrice(discountInfo.savings, currentCurrency), currentCurrency)}
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            // TODO: Add to cart functionality
            console.log('Add to cart:', product.id)
          }}
          disabled={isOutOfStock}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}