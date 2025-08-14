// ✅ NEW: src/components/customer/PriceDisplay.tsx

'use client'

import { useCurrency } from '@/contexts/CurrencyContext'
import { formatPrice } from '@/lib/utils'
import { calculateDiscountInfo } from '@/lib/discount-utils'
import { Percent, Tag } from 'lucide-react'

interface Product {
  sellingPriceUSD: number
  discountPercentage: number
  showDiscountToCustomers: boolean
}

interface PriceDisplayProps {
  product: Product
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSavings?: boolean
  className?: string
}

// ✅ FIXED: PriceDisplay component with correct currency context usage

export default function PriceDisplay({ 
  product, 
  size = 'md', 
  showSavings = true,
  className = '' 
}: PriceDisplayProps) {
  // ✅ FIXED: Use 'currency' instead of 'currentCurrency'
  const { currency, convertPrice } = useCurrency()

  // Calculate discount information
  const discountInfo = calculateDiscountInfo({
    sellingPriceUSD: product.sellingPriceUSD,
    discountPercentage: product.discountPercentage,
    showDiscountToCustomers: product.showDiscountToCustomers
  })

  // ✅ FIXED: Convert prices to current currency (without second parameter)
  const finalPrice = convertPrice(product.sellingPriceUSD)
  const originalPrice = discountInfo.shouldShowDiscount 
    ? convertPrice(discountInfo.originalPrice)
    : finalPrice
  const savings = convertPrice(discountInfo.savings)

  // Size configurations
  const sizeClasses = {
    sm: {
      price: 'text-sm',
      originalPrice: 'text-xs',
      badge: 'text-xs px-1.5 py-0.5',
      savings: 'text-xs'
    },
    md: {
      price: 'text-lg',
      originalPrice: 'text-sm',
      badge: 'text-xs px-2 py-1',
      savings: 'text-sm'
    },
    lg: {
      price: 'text-xl',
      originalPrice: 'text-base',
      badge: 'text-sm px-2.5 py-1',
      savings: 'text-sm'
    },
    xl: {
      price: 'text-2xl',
      originalPrice: 'text-lg',
      badge: 'text-sm px-3 py-1.5',
      savings: 'text-base'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Price Display */}
      <div className="flex items-center gap-3 flex-wrap">
        {discountInfo.shouldShowDiscount ? (
          <>
            {/* Final Price (Discounted) */}
            <span className={`font-bold text-green-600 ${classes.price}`}>
              {formatPrice(finalPrice)}
            </span>
            
            {/* Original Price (Crossed Out) */}
            <span className={`text-gray-500 line-through ${classes.originalPrice}`}>
              {formatPrice(originalPrice)}
            </span>
            
            {/* Discount Badge */}
            <span className={`bg-red-100 text-red-800 font-medium rounded-full ${classes.badge}`}>
              <Percent className="inline h-3 w-3 mr-1" />
              {discountInfo.discountPercent}% OFF
            </span>
          </>
        ) : (
          /* Regular Price */
          <span className={`font-bold text-gray-900 ${classes.price}`}>
            {formatPrice(finalPrice)}
          </span>
        )}
      </div>

      {/* Savings Information */}
      {showSavings && discountInfo.shouldShowDiscount && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <span className={`text-green-600 font-medium ${classes.savings}`}>
            You save {formatPrice(savings)}
          </span>
        </div>
      )}
    </div>
  )
}