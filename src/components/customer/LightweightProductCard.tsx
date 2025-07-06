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

// ✅ FIXED: LightweightProductCard with correct cart integration

export default function LightweightProductCard({ 
  product, 
  showCartFeatures = true 
}: LightweightProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // ✅ FIXED: Use correct function name 'addItem' instead of 'addToCart'
  const { addItem, isClient } = useCart()
  const { formatPrice } = useCurrency()

  const isOutOfStock = product.stockInfo?.isOutOfStock
  const hasMultipleSizes = product.sizeInfo?.hasMultipleSizes
  const primaryImage = product.images?.[0]

  // ✅ FIXED: Handle quick add with proper product structure and async function
  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (hasMultipleSizes) {
      // For items with sizes, redirect to product page
      window.location.href = `/products/${product.slug}`
      return
    }
    
    // ✅ FIXED: Create proper ProductForCart object structure
    const productForCart = {
      id: product.id,
      sku: product.id, // Use ID as SKU if not available
      name: product.name,
      sellingPriceUSD: product.sellingPriceUSD,
      stockQuantity: product.stockInfo?.isOutOfStock ? 0 : 100, // Default stock if not provided
      images: product.images,
      category: {
        id: product.category.name, // Use name as ID if structure is different
        name: product.category.name,
        slug: product.category.name.toLowerCase().replace(/\s+/g, '-')
      },
      // Add required country field with defaults
      country: {
        id: 'US',
        name: 'United States',
        currency: 'USD',
        currencySymbol: '$'
      }
    }
    
    // ✅ FIXED: Use addItem with proper async handling
    try {
      const success = await addItem(productForCart, 1)
      if (success) {
        // Optionally show success feedback
        console.log('Product added to cart successfully')
      }
    } catch (error) {
      console.error('Failed to add product to cart:', error)
    }
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
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
          )}

          {/* Stock status overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-sm font-medium">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
            {product.name}
          </h3>
          
          <p className="text-xs text-gray-500 mb-2">
            {product.category.name}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(product.sellingPriceUSD)}
            </span>

            {/* Quick add button */}
            {showCartFeatures && isClient && !isOutOfStock && (
              <button
                onClick={handleQuickAdd}
                className="p-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                title={hasMultipleSizes ? "View options" : "Add to cart"}
              >
                {hasMultipleSizes ? <Eye className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}