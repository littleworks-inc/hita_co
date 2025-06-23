'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { CardPrice } from '@/components/customer/PriceDisplay'
import AddToCartButton from '@/components/cart/AddToCartButton'
import {
  Heart,
  ShoppingCart,
  Star,
  Eye,
  Tag,
  Sparkles,
  Package,
  AlertCircle
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
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)

  const productSlug = `${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.sku}`
  const primaryImage = product.images[0]
  const secondaryImage = product.images[1]

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    // TODO: Implement wishlist functionality
  }

  const isLowStock = product.stockQuantity <= 5
  const isOutOfStock = product.stockQuantity === 0

  return (
    <div className={`group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${className}`}>
      {/* Product Link Wrapper */}
      <Link href={`/products/${productSlug}`} className="block">
        {/* Badge Container */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
              <AlertCircle className="h-3 w-3" />
              Low Stock
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              <Package className="h-3 w-3" />
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </button>

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

        {/* Price */}
        <div className="flex items-center justify-between">
          <CardPrice priceUSD={product.sellingPriceUSD} />
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <span className="text-xs text-amber-600 font-medium">
              {product.stockQuantity} left
            </span>
          )}
        </div>

        {/* Add to Cart Section */}
        <div className="pt-3 border-t border-gray-100">
          <AddToCartButton 
            product={{
              id: product.id,
              sku: product.sku,
              name: product.name,
              sellingPriceUSD: product.sellingPriceUSD,
              stockQuantity: product.stockQuantity,
              images: product.images,
              category: product.category,
              country: product.country
            }}
            variant="default"
            className="w-full"
          />
        </div>

        {/* Stock Status */}
        {isOutOfStock && (
          <div className="text-center text-sm text-red-600 font-medium">
            Currently Unavailable
          </div>
        )}
      </div>
    </div>
  )
}