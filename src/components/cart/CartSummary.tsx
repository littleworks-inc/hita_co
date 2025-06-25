// Updated src/components/cart/CartSummary.tsx
// =====================================
// Dynamic shipping calculation integrated cart summary
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { useCartWithCurrency } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  Calculator,
  Truck,
  Shield,
  Info,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

// =================
// INTERFACES
// =================

interface ShippingCalculationResult {
  success: boolean
  shippingCostUSD: number
  shippingCostFormatted: string
  isEligibleForFreeShipping: boolean
  freeShippingThreshold?: number
  remainingForFreeShipping?: number
  shippingZoneName: string
  estimatedDays?: string
  error?: string
  convertedAmounts?: {
    shippingCost: number
    freeShippingThreshold?: number
    remainingForFreeShipping?: number
  }
}

export default function CartSummary() {
  const { totalPriceUSD, totalItems, totalPriceFormatted, totalPriceConverted } = useCartWithCurrency()
  const { currency, currencyInfo } = useCurrency()

  // Shipping calculation state
  const [shippingData, setShippingData] = useState<ShippingCalculationResult | null>(null)
  const [isLoadingShipping, setIsLoadingShipping] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)

  // Calculate shipping costs
  const calculateShipping = async (countryCode: string = 'US') => {
    if (totalPriceUSD <= 0) {
      setShippingData(null)
      return
    }

    setIsLoadingShipping(true)
    setShippingError(null)

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          countryCode,
          subtotalUSD: totalPriceUSD,
          currency
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result: ShippingCalculationResult = await response.json()
      setShippingData(result)

      if (!result.success) {
        setShippingError(result.error || 'Failed to calculate shipping')
      }

    } catch (error) {
      console.error('Shipping calculation error:', error)
      setShippingError('Unable to calculate shipping costs')
      
      // Fallback to basic shipping logic
      setShippingData({
        success: false,
        shippingCostUSD: totalPriceUSD >= 100 ? 0 : 10,
        shippingCostFormatted: totalPriceUSD >= 100 ? 'Free' : '$10.00',
        isEligibleForFreeShipping: totalPriceUSD >= 100,
        freeShippingThreshold: 100,
        remainingForFreeShipping: totalPriceUSD >= 100 ? 0 : 100 - totalPriceUSD,
        shippingZoneName: 'Standard',
        error: 'Using fallback shipping rates'
      })
    } finally {
      setIsLoadingShipping(false)
    }
  }

  // Auto-calculate shipping when cart total changes
  useEffect(() => {
    if (totalPriceUSD > 0) {
      calculateShipping()
    } else {
      setShippingData(null)
    }
  }, [totalPriceUSD, currency])

  // Get shipping values with fallbacks
  const getShippingValues = () => {
    if (!shippingData) {
      return {
        shippingCost: 0,
        isEligibleForFreeShipping: false,
        remainingForFreeShipping: 0,
        shippingThreshold: 100,
        shippingZoneName: 'Unknown'
      }
    }

    return {
      shippingCost: shippingData.shippingCostUSD,
      isEligibleForFreeShipping: shippingData.isEligibleForFreeShipping,
      remainingForFreeShipping: shippingData.remainingForFreeShipping || 0,
      shippingThreshold: shippingData.freeShippingThreshold || 100,
      shippingZoneName: shippingData.shippingZoneName
    }
  }

  const { 
    shippingCost, 
    isEligibleForFreeShipping, 
    remainingForFreeShipping, 
    shippingThreshold,
    shippingZoneName 
  } = getShippingValues()

  // Calculate tax (approximate - would be calculated properly at checkout)
  const taxRate = 0.08 // 8% approximate tax
  const taxAmount = totalPriceUSD * taxRate

  // Calculate totals (in USD first, then convert)
  const totalWithShippingUSD = totalPriceUSD + shippingCost
  const totalWithTaxUSD = totalWithShippingUSD + taxAmount

  // Helper function to format amounts in current currency
  const formatAmount = (amountUSD: number) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amountUSD)
    }
    
    // Convert to selected currency
    const conversionRate = totalPriceUSD > 0 ? totalPriceConverted / totalPriceUSD : 1
    const convertedAmount = amountUSD * conversionRate
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(convertedAmount)
    } catch {
      return `${currencyInfo.symbol}${convertedAmount.toFixed(2)}`
    }
  }

  // Handle shipping recalculation
  const handleRecalculateShipping = () => {
    calculateShipping()
  }

  // Don't show anything if cart is empty
  if (totalItems === 0) {
    return null
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Shipping Error */}
      {shippingError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{shippingError}</span>
            </div>
            <button
              onClick={handleRecalculateShipping}
              disabled={isLoadingShipping}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingShipping ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Shipping Loading */}
      {isLoadingShipping && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Calculating shipping costs...</span>
          </div>
        </div>
      )}

      {/* Free Shipping Progress */}
      {!isEligibleForFreeShipping && remainingForFreeShipping > 0 && !isLoadingShipping && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
            <Truck className="h-4 w-4" />
            <span>Free Shipping Progress</span>
            {shippingZoneName && (
              <span className="text-xs text-blue-600">({shippingZoneName})</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalPriceUSD / shippingThreshold) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-blue-600">
              Add {formatAmount(remainingForFreeShipping)} more for free shipping!
            </p>
          </div>
        </div>
      )}

      {/* Free Shipping Achievement */}
      {isEligibleForFreeShipping && !isLoadingShipping && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span>🎉 You qualify for free shipping!</span>
            {shippingZoneName && (
              <span className="text-xs text-green-600">({shippingZoneName})</span>
            )}
          </div>
          {shippingData?.estimatedDays && (
            <p className="text-xs text-green-600 mt-1">
              Estimated delivery: {shippingData.estimatedDays}
            </p>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Order Summary
        </h3>

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})
          </span>
          <span className="font-medium">{totalPriceFormatted}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Shipping</span>
            {isLoadingShipping && <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />}
            {shippingData?.estimatedDays && !isLoadingShipping && (
              <span className="text-xs text-gray-500">({shippingData.estimatedDays})</span>
            )}
          </div>
          <span className={`font-medium ${isEligibleForFreeShipping ? 'text-green-600' : ''}`}>
            {isLoadingShipping ? '...' : (
              isEligibleForFreeShipping ? 'Free' : formatAmount(shippingCost)
            )}
          </span>
        </div>

        {/* Tax Estimate */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            Tax (estimated)
            <Info className="h-3 w-3 text-gray-400" />
          </span>
          <span className="font-medium">{formatAmount(taxAmount)}</span>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-3" />

        {/* Total */}
        <div className="flex justify-between">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-base font-bold text-purple-600">
            {isLoadingShipping ? '...' : formatAmount(totalWithTaxUSD)}
          </span>
        </div>

        {/* Currency Note */}
        {currency !== 'USD' && (
          <div className="text-xs text-gray-500 text-center pt-2">
            Prices converted from USD • Final amount may vary at checkout
          </div>
        )}
      </div>

      {/* Shipping Zone Info */}
      {shippingData && !isLoadingShipping && (
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          <p className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            Shipping zone: {shippingZoneName}
          </p>
        </div>
      )}

      {/* Additional Info */}
      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
        <p>• Tax calculated at checkout based on shipping address</p>
        <p>• Secure checkout with SSL encryption</p>
        <p>• 30-day return policy on all items</p>
        {!isLoadingShipping && shippingData?.estimatedDays && (
          <p>• Estimated delivery: {shippingData.estimatedDays}</p>
        )}
      </div>
    </div>
  )
}