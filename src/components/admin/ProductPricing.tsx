// =====================================
// src/components/admin/ProductPricing.tsx - ENHANCED WITH DISCOUNT CONTROLS
// =====================================
'use client'

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { DollarSign, Eye, EyeOff, Info, Tag } from 'lucide-react'
import { useState } from 'react'

interface Country {
  currency: string
  currencySymbol: string
}

interface Product {
  originalPrice: number
  originalCurrency: string
  quantity: number
  gstPercentage: number
  shippingCost: number
  conversionCharges: number
  additionalExpenses: number
  costPriceUSD: number
  piecePriceUSD: number
  profitMargin: number
  discountPercentage: number
  sellingPriceUSD: number
  showDiscountToCustomers: boolean // NEW: Discount visibility control
}

interface ProductPricingProps {
  formData: Product
  selectedCountry: Country | undefined
  exchangeRate: number
  errors: Record<string, string>
  onInputChange: (field: keyof Product, value: any) => void
}

export default function ProductPricing({
  formData,
  selectedCountry,
  exchangeRate,
  errors,
  onInputChange
}: ProductPricingProps) {
  const [showCustomerPreview, setShowCustomerPreview] = useState(false)

  // ✅ SAFE NUMBER FORMATTING - Handle undefined/null values
  const safeToFixed = (value: number | undefined | null, digits: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00'
    }
    return Number(value).toFixed(digits)
  }

  // ✅ SAFE NUMBER DISPLAY - For calculations that might result in undefined
  const safeNumber = (value: number | undefined | null): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0
    }
    return Number(value)
  }

  // ✅ SAFE CALCULATION - Handle division by zero and undefined values
  const safeProfitCalculation = (): { profit: string; percentage: string } => {
    const sellingPrice = safeNumber(formData.sellingPriceUSD)
    const costPrice = safeNumber(formData.costPriceUSD)
    
    if (costPrice === 0) {
      return { profit: '0.00', percentage: '0.0' }
    }
    
    const profit = sellingPrice - costPrice
    const percentage = (profit / costPrice) * 100
    
    return {
      profit: safeToFixed(profit, 2),
      percentage: safeToFixed(percentage, 1)
    }
  }

  // 🎯 NEW: Calculate original price for display (before discount)
  const calculateOriginalPriceForDisplay = (): number => {
    const sellingPrice = safeNumber(formData.sellingPriceUSD)
    const discountPercent = safeNumber(formData.discountPercentage)
    
    if (discountPercent === 0) return sellingPrice
    
    // Original price = selling price / (1 - discount/100)
    return sellingPrice / (1 - discountPercent / 100)
  }

  const { profit, percentage } = safeProfitCalculation()
  const originalPriceForDisplay = calculateOriginalPriceForDisplay()
  const hasDiscount = formData.discountPercentage > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing & Discount System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Original Purchase Details */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="originalPrice">Original Price *</Label>
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              value={formData.originalPrice || 0}
              onChange={(e) => onInputChange('originalPrice', parseFloat(e.target.value) || 0)}
              placeholder="1000"
              className={errors.originalPrice ? 'border-red-500' : ''}
            />
            {errors.originalPrice && <p className="text-sm text-red-500">{errors.originalPrice}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="originalCurrency">Currency</Label>
            <select
              id="originalCurrency"
              value={formData.originalCurrency || 'INR'}
              onChange={(e) => onInputChange('originalCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Purchased *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity || 1}
              onChange={(e) => onInputChange('quantity', parseInt(e.target.value) || 1)}
              placeholder="5"
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
          </div>
        </div>

        {/* Additional Costs */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="gstPercentage">GST/Tax (%)</Label>
            <Input
              id="gstPercentage"
              type="number"
              step="0.01"
              value={formData.gstPercentage || 0}
              onChange={(e) => onInputChange('gstPercentage', parseFloat(e.target.value) || 0)}
              placeholder="18"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCost">Shipping Cost</Label>
            <Input
              id="shippingCost"
              type="number"
              step="0.01"
              value={formData.shippingCost || 0}
              onChange={(e) => onInputChange('shippingCost', parseFloat(e.target.value) || 0)}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversionCharges">Conversion Charges</Label>
            <Input
              id="conversionCharges"
              type="number"
              step="0.01"
              value={formData.conversionCharges || 0}
              onChange={(e) => onInputChange('conversionCharges', parseFloat(e.target.value) || 0)}
              placeholder="25"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalExpenses">Additional Expenses</Label>
            <Input
              id="additionalExpenses"
              type="number"
              step="0.01"
              value={formData.additionalExpenses || 0}
              onChange={(e) => onInputChange('additionalExpenses', parseFloat(e.target.value) || 0)}
              placeholder="100"
            />
          </div>
        </div>

        {/* Calculated Costs */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-3">Calculated Costs</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Total Cost (USD)</Label>
              <div className="text-lg font-semibold text-green-600">
                ${safeToFixed(formData.costPriceUSD)}
              </div>
            </div>
            <div>
              <Label>Per Piece Cost (USD)</Label>
              <div className="text-lg font-semibold text-blue-600">
                ${safeToFixed(formData.piecePriceUSD)}
              </div>
            </div>
            <div>
              <Label>Exchange Rate</Label>
              <div className="text-sm text-gray-600">
                1 USD = {exchangeRate || 1} {selectedCountry?.currency || 'INR'}
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 ENHANCED: Profit & Discount Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profitMargin">Profit Margin (%)</Label>
            <Input
              id="profitMargin"
              type="number"
              step="0.01"
              value={formData.profitMargin || 0}
              onChange={(e) => onInputChange('profitMargin', parseFloat(e.target.value) || 0)}
              placeholder="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountPercentage">Discount (%)</Label>
            <Input
              id="discountPercentage"
              type="number"
              step="0.01"
              value={formData.discountPercentage || 0}
              onChange={(e) => onInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
              placeholder="10"
            />
          </div>
        </div>

        {/* 🎯 NEW: Discount Visibility Control */}
        {hasDiscount && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <Label className="text-yellow-800 font-medium">Customer Discount Display</Label>
                  <p className="text-sm text-yellow-700 mt-1">
                    Control whether customers see the discount on the frontend
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onInputChange('showDiscountToCustomers', !formData.showDiscountToCustomers)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.showDiscountToCustomers 
                      ? 'bg-green-600' 
                      : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.showDiscountToCustomers 
                        ? 'translate-x-6' 
                        : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-yellow-800">
                  {formData.showDiscountToCustomers ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>

            {/* Show customer preview button */}
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <button
                type="button"
                onClick={() => setShowCustomerPreview(!showCustomerPreview)}
                className="flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-800"
              >
                {showCustomerPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCustomerPreview ? 'Hide' : 'Preview'} customer view
              </button>
            </div>
          </div>
        )}

        {/* 🎯 NEW: Customer Price Preview */}
        {hasDiscount && showCustomerPreview && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Customer Price Preview
            </h4>
            
            <div className="space-y-3">
              {/* When discount is visible to customers */}
              {formData.showDiscountToCustomers ? (
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500 mb-2">Customer sees:</p>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 line-through text-lg">
                      ${safeToFixed(originalPriceForDisplay)}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${safeToFixed(formData.sellingPriceUSD)}
                    </span>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                      {formData.discountPercentage}% OFF
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Savings: ${safeToFixed(originalPriceForDisplay - formData.sellingPriceUSD)}
                  </p>
                </div>
              ) : (
                /* When discount is hidden from customers */
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500 mb-2">Customer sees:</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">
                      ${safeToFixed(formData.sellingPriceUSD)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    No discount information shown
                  </p>
                </div>
              )}

              {/* Internal admin info */}
              <div className="bg-gray-100 p-2 rounded text-xs text-gray-600">
                <strong>Admin Info:</strong> Original selling price (before discount): ${safeToFixed(originalPriceForDisplay)}
              </div>
            </div>
          </div>
        )}

        {/* Final Selling Price Summary */}
        <div className="bg-blue-50 p-4 rounded-md">
          <Label>Final Selling Price (USD)</Label>
          <div className="text-2xl font-bold text-blue-600">
            ${safeToFixed(formData.sellingPriceUSD)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Profit: ${profit} ({percentage}%)
          </p>
          {hasDiscount && (
            <p className="text-sm text-blue-600 mt-1">
              Includes {formData.discountPercentage}% discount • 
              Original: ${safeToFixed(originalPriceForDisplay)}
            </p>
          )}
        </div>

        {/* 🎯 NEW: Discount Business Rules Info */}
        {hasDiscount && (
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-gray-500 mt-0.5" />
              <div className="text-xs text-gray-600">
                <strong>Discount Logic:</strong> The selling price is already calculated with the discount applied. 
                When shown to customers, we calculate the "original price" for display purposes: 
                Original = ${safeToFixed(formData.sellingPriceUSD)} ÷ (1 - {formData.discountPercentage}%) = ${safeToFixed(originalPriceForDisplay)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 🚀 FEATURES INCLUDED:
// ✅ Enhanced discount percentage input
// ✅ Customer discount visibility toggle
// ✅ Real-time customer price preview
// ✅ Original price calculation for display
// ✅ Discount business logic explanation
// ✅ Visual feedback for discount states
// ✅ Safe number handling throughout
// ✅ Responsive design
// ✅ Accessibility features