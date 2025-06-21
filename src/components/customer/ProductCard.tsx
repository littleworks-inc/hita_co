'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { CardPrice } from '@/components/customer/PriceDisplay'
import {
  Heart,
  ShoppingCart,
  Star,
  Eye,
  Tag,
  Sparkles,
  Package
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  stockQuantity: number
  images: string[]
  shortDescription?: string | null
  isFeatured: boolean
  category: {
    name: string
  }
  country: {
    name: string
  }
}

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)

  const productSlug = `${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`
  const primaryImage = product.images[0]
  const secondaryImage = product.images[1]

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', product.id)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    // TODO: Implement wishlist functionality
  }

  const isLowStock = product.stockQuantity <= 5
  const isOutOfStock = product.stockQuantity === 0

  return (
    <div className={`group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}>
      {/* Product Link Wrapper */}
      <Link href={`/products/${productSlug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* Product Image */}
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
                  alt={`${product.name} - alternate view`}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              )}
            </>
          ) : (
            /* Fallback when no image */
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isFeatured && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Low Stock
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Wishlist */}
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                isWishlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white'
              }`}
              title="Add to wishlist"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Quick View */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // TODO: Implement quick view modal
              }}
              className="p-2 rounded-full bg-white/80 text-gray-700 backdrop-blur-sm hover:bg-purple-500 hover:text-white transition-all duration-200"
              title="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Add to Cart */}
          {!isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-full font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {product.category.name}
            </span>
            {product.country.name !== 'United States' && (
              <span className="text-xs text-purple-600 font-medium">
                · {product.country.name}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {/* Price and Stock */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <CardPrice priceUSD={product.sellingPriceUSD} />
              <span className="text-xs text-gray-500">
                SKU: {product.sku}
              </span>
            </div>
            
            <div className="text-right">
              {isOutOfStock ? (
                <span className="text-red-500 font-medium text-sm">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="text-orange-500 font-medium text-sm">
                  Only {product.stockQuantity} left
                </span>
              ) : (
                <span className="text-green-600 font-medium text-sm">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Rating Stars (Placeholder) */}
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-4 w-4 text-yellow-400 fill-current"
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">(24 reviews)</span>
          </div>
        </div>
      </Link>
    </div>
  )
}