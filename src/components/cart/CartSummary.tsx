'use client'

import { useCartWithCurrency } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  Calculator,
  Truck,
  Shield,
  Info
} from 'lucide-react'

export default function CartSummary() {
  const { totalPriceUSD, totalItems, totalPriceFormatted, totalPriceConverted } = useCartWithCurrency()
  const { currency, currencyInfo } = useCurrency()

  // Calculate shipping (free over $100)
  const shippingThreshold = 100
  const isEligibleForFreeShipping = totalPriceUSD >= shippingThreshold
  const remainingForFreeShipping = shippingThreshold - totalPriceUSD
  const shippingCost = isEligibleForFreeShipping ? 0 : 10 // $10 shipping under $100

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
    const convertedAmount = totalPriceConverted * (amountUSD / totalPriceUSD)
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(convertedAmount)
    } catch {
      return `${currencyInfo.symbol}${convertedAmount.toFixed(2)}`
    }
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Free Shipping Progress */}
      {!isEligibleForFreeShipping && remainingForFreeShipping > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
            <Truck className="h-4 w-4" />
            <span>Free Shipping Progress</span>
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
      {isEligibleForFreeShipping && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span>🎉 You qualify for free shipping!</span>
          </div>
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
          <span className="text-gray-600">Shipping</span>
          <span className={`font-medium ${isEligibleForFreeShipping ? 'text-green-600' : ''}`}>
            {isEligibleForFreeShipping ? 'Free' : formatAmount(shippingCost)}
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
            {formatAmount(totalWithTaxUSD)}
          </span>
        </div>

        {/* Currency Note */}
        {currency !== 'USD' && (
          <div className="text-xs text-gray-500 text-center pt-2">
            Prices converted from USD • Final amount may vary at checkout
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
        <p>• Tax calculated at checkout based on shipping address</p>
        <p>• Secure checkout with SSL encryption</p>
        <p>• 30-day return policy on all items</p>
      </div>
    </div>
  )
}