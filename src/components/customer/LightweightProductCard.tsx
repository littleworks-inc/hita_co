// components/customer/LightweightProductCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { ShoppingBag, Eye } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  sellingPriceUSD: number
  images: string[]
  category: { name: string }
  stockInfo?: {
    isOutOfStock: boolean
    isLowStock: boolean
    status: string
  }
  sizeInfo?: {
    sizes: string[]
    hasMultipleSizes: boolean
  }
}

interface LightweightProductCardProps {
  product: Product
  showCartFeatures?: boolean
}

export default function LightweightProductCard({ 
  product, 
  showCartFeatures = true 
}: LightweightProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const { addToCart, isClient } = useCart()
  const { formatPrice } = useCurrency()

  const isOutOfStock = product.stockInfo?.isOutOfStock
  const hasMultipleSizes = product.sizeInfo?.hasMultipleSizes
  const primaryImage = product.images?.[0]

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (hasMultipleSizes) {
      // For items with sizes, redirect to product page
      window.location.href = `/products/${product.slug}`
      return
    }
    
    // Simple add to cart for single-variant products
    addToCart(product.id, 1, 'default')
  }

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Compact Image Container */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {primaryImage && !imageError ? (
            <>
              {/* Loading placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Main product image */}
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </>
          ) : (
            /* Fallback for missing/error images */
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Eye className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs">No Image</p>
              </div>
            </div>
          )}

          {/* Stock Status Badge - Compact */}
          {isOutOfStock && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </div>
          )}

          {/* Quick Actions - Only on Desktop Hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center">
            {showCartFeatures && isClient && !isOutOfStock && (
              <button
                onClick={handleQuickAdd}
                className="bg-white text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <ShoppingBag className="h-4 w-4" />
                {hasMultipleSizes ? 'View Options' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>

        {/* Compact Product Info */}
        <div className="p-3">
          {/* Category - Small text */}
          <p className="text-xs text-gray-500 mb-1 truncate">
            {product.category.name}
          </p>

          {/* Product Name - Single line with ellipsis */}
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">
            {product.name}
          </h3>

          {/* Price and Action Row */}
          <div className="flex items-center justify-between">
            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.sellingPriceUSD)}
              </span>
            </div>

            {/* Mobile Add Button */}
            {showCartFeatures && isClient && !isOutOfStock && (
              <button
                onClick={handleQuickAdd}
                className="sm:hidden bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
                aria-label="Add to cart"
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Size Info - Compact */}
          {hasMultipleSizes && (
            <p className="text-xs text-gray-500 mt-1">
              {product.sizeInfo?.sizes.length} sizes available
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}

// Key Lightweight Improvements:
// 1. Reduced padding (p-4 → p-3)
// 2. Simplified hover effects (removed complex animations)
// 3. Single price display (removed comparison prices)
// 4. Lazy loading images with proper loading states
// 5. Compact badges and indicators
// 6. Line-clamp for text overflow (prevents layout shifts)
// 7. Optimized image sizes with responsive loading
// 8. Reduced shadow effects (shadow-lg → shadow-md)
// 9. Simplified color scheme
// 10. Mobile-first action buttons
// 11. Removed unnecessary gradients and complex backgrounds
// 12. Faster hover transitions (300ms → 200ms)
// 13. Conditional features based on eCommerce mode
// 14. Optimized touch targets for mobile
// 15. Semantic HTML structure for accessibility