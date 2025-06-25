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

export default function PriceDisplay({ 
  product, 
  size = 'md', 
  showSavings = true,
  className = '' 
}: PriceDisplayProps) {
  const { currentCurrency, convertPrice } = useCurrency()

  // Calculate discount information
  const discountInfo = calculateDiscountInfo({
    sellingPriceUSD: product.sellingPriceUSD,
    discountPercentage: product.discountPercentage,
    showDiscountToCustomers: product.showDiscountToCustomers
  })

  // Convert prices to current currency
  const finalPrice = convertPrice(product.sellingPriceUSD, currentCurrency)
  const originalPrice = discountInfo.shouldShowDiscount 
    ? convertPrice(discountInfo.originalPrice, currentCurrency)
    : finalPrice
  const savings = convertPrice(discountInfo.savings, currentCurrency)

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
            {/* Original Price (Crossed Out) */}
            <span className={`line-through text-gray-400 ${classes.originalPrice}`}>
              {formatPrice(originalPrice, currentCurrency)}
            </span>
            
            {/* Sale Price */}
            <span className={`font-bold text-red-600 ${classes.price}`}>
              {formatPrice(finalPrice, currentCurrency)}
            </span>
            
            {/* Discount Badge */}
            <span className={`bg-red-100 text-red-600 font-bold rounded-full flex items-center gap-1 ${classes.badge}`}>
              <Percent className="h-3 w-3" />
              {discountInfo.discountPercent}% OFF
            </span>
          </>
        ) : (
          /* Regular Price */
          <span className={`font-bold text-gray-900 ${classes.price}`}>
            {formatPrice(finalPrice, currentCurrency)}
          </span>
        )}
      </div>

      {/* Savings Information */}
      {discountInfo.shouldShowDiscount && showSavings && (
        <div className={`text-green-600 font-medium ${classes.savings}`}>
          🎉 You save {formatPrice(savings, currentCurrency)}
        </div>
      )}

      {/* Discount Badge (Alternative Layout) */}
      {discountInfo.shouldShowDiscount && size === 'xl' && (
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
          <Tag className="h-4 w-4" />
          <span className="font-medium">
            Limited Time: {discountInfo.discountPercent}% Off
          </span>
        </div>
      )}
    </div>
  )
}

// ✅ USAGE EXAMPLES:
/*
// Basic usage
<PriceDisplay product={product} />

// Large size with savings
<PriceDisplay 
  product={product} 
  size="xl" 
  showSavings={true} 
/>

// Small card version
<PriceDisplay 
  product={product} 
  size="sm" 
  showSavings={false} 
  className="text-center"
/>
*/