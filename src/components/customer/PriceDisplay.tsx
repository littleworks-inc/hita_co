'use client'

import { useCurrency } from '@/contexts/CurrencyContext'
import { Loader2 } from 'lucide-react'

interface PriceDisplayProps {
  priceUSD: number
  className?: string
  showOriginal?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  comparePrice?: number // For showing discounts
}

export default function PriceDisplay({ 
  priceUSD, 
  className = '',
  showOriginal = false,
  size = 'md',
  comparePrice
}: PriceDisplayProps) {
  const { formatPrice, currency, isLoading } = useCurrency()

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className={`text-gray-400 ${sizeClasses[size]}`}>Loading price...</span>
      </div>
    )
  }

  const formattedPrice = formatPrice(priceUSD)
  const formattedComparePrice = comparePrice ? formatPrice(comparePrice) : null

  return (
    <div className={`${className}`}>
      {/* Main Price */}
      <div className="flex items-center gap-2">
        {/* Compare Price (Original/Higher Price) */}
        {formattedComparePrice && comparePrice! > priceUSD && (
          <span className={`text-gray-400 line-through ${sizeClasses[size]}`}>
            {formattedComparePrice}
          </span>
        )}
        
        {/* Current Price */}
        <span className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
          {formattedPrice}
        </span>

        {/* Discount Badge */}
        {formattedComparePrice && comparePrice! > priceUSD && (
          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
            {Math.round(((comparePrice! - priceUSD) / comparePrice!) * 100)}% OFF
          </span>
        )}
      </div>

      {/* Show Original USD Price */}
      {showOriginal && currency !== 'USD' && (
        <div className="text-xs text-gray-500 mt-1">
          Originally ${priceUSD.toFixed(2)} USD
        </div>
      )}
    </div>
  )
}

// Specialized components for different use cases
export function ProductPrice({ priceUSD, comparePrice, className = '' }: {
  priceUSD: number
  comparePrice?: number
  className?: string
}) {
  return (
    <PriceDisplay 
      priceUSD={priceUSD}
      comparePrice={comparePrice}
      size="lg"
      className={className}
    />
  )
}

export function CartPrice({ priceUSD, className = '' }: {
  priceUSD: number
  className?: string
}) {
  return (
    <PriceDisplay 
      priceUSD={priceUSD}
      size="md"
      className={className}
    />
  )
}

export function CardPrice({ priceUSD, className = '' }: {
  priceUSD: number
  className?: string
}) {
  return (
    <PriceDisplay 
      priceUSD={priceUSD}
      size="md"
      className={className}
    />
  )
}