// =====================================
// src/components/admin/ProductPricing.tsx - CLEAN VERSION
// No business assumptions, just clean descriptive placeholders
// Admin has complete control over all values
// =====================================
'use client'

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { DollarSign, Eye, EyeOff, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Country {
  id: string
  name: string
  currency: string
  currencySymbol: string
  exchangeRate: number | null
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
  showDiscountToCustomers: boolean
  categoryId: string
  countryId: string
}

interface ProductPricingProps {
  formData: Product
  selectedCountry: Country | undefined
  exchangeRate: number
  errors: Record<string, string>
  onInputChange: (field: keyof Product, value: any) => void
  showCostBreakdown: boolean
  onToggleCostBreakdown: () => void
  pricingMode: 'basic' | 'advanced'
  onPricingModeChange: (mode: 'basic' | 'advanced') => void
  showCustomerPreview: boolean
  onToggleCustomerPreview: () => void
}

export default function ProductPricing({
  formData,
  selectedCountry,
  exchangeRate,
  errors,
  onInputChange,
  showCostBreakdown,
  onToggleCostBreakdown,
  pricingMode,
  onPricingModeChange,
  showCustomerPreview,
  onToggleCustomerPreview
}: ProductPricingProps) {
  
  // ✅ CLEAN: Only descriptive placeholders, no hardcoded business values
  const placeholders = {
    originalPrice: 'Enter the actual price you paid',
    quantity: 'Enter number of pieces purchased',
    gstPercentage: 'Enter applicable tax rate (e.g., 18 for 18%)',
    shippingCost: 'Enter shipping/transport cost',
    conversionCharges: 'Enter currency conversion or payment processing fees',
    additionalExpenses: 'Enter customs, duties, or other costs',
    profitMargin: 'Enter your desired profit percentage'
  }

  // ✅ SAFE NUMBER FORMATTING
  const safeToFixed = (value: number | undefined | null, digits: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00'
    }
    return Number(value).toFixed(digits)
  }

  const safeNumber = (value: number | undefined | null): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0
    }
    return Number(value)
  }

  // ✅ PROFIT CALCULATION
  const safeProfitCalculation = (): { profit: string; percentage: string } => {
    const sellingPrice = safeNumber(formData.sellingPriceUSD)
    const costPrice = safeNumber(formData.piecePriceUSD)
    
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

  // ✅ ORIGINAL PRICE CALCULATION FOR DISPLAY
  const calculateOriginalPriceForDisplay = (): number => {
    const sellingPrice = safeNumber(formData.sellingPriceUSD)
    const discountPercent = safeNumber(formData.discountPercentage)
    
    if (discountPercent === 0) return sellingPrice
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
          Pricing & Cost Management
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* ✅ CURRENCY CONTEXT (factual information only) */}
        {selectedCountry && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">
                Currency: {selectedCountry.currency} ({selectedCountry.currencySymbol}) • 
                Exchange Rate: 1 USD = {exchangeRate || 1} {selectedCountry.currency}
              </span>
            </div>
          </div>
        )}

        {/* ✅ CLEAN: Original Purchase Details */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="originalPrice">
              Original Price * ({selectedCountry?.currencySymbol || '$'})
            </Label>
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.originalPrice || ''}
              onChange={(e) => onInputChange('originalPrice', parseFloat(e.target.value) || 0)}
              placeholder={placeholders.originalPrice}
              className={errors.originalPrice ? 'border-red-500' : ''}
            />
            {errors.originalPrice && <p className="text-sm text-red-500">{errors.originalPrice}</p>}
            <p className="text-xs text-gray-500">The price you paid for this product</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Purchased *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity || ''}
              onChange={(e) => onInputChange('quantity', parseInt(e.target.value) || 1)}
              placeholder={placeholders.quantity}
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            <p className="text-xs text-gray-500">Number of pieces you bought</p>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
              {formData.originalCurrency || selectedCountry?.currency || 'Select country first'}
            </div>
            <p className="text-xs text-gray-500">Auto-set from Country of Origin</p>
          </div>
        </div>

        {/* ✅ CLEAN: Additional Costs - No Assumptions */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="gstPercentage">Tax/GST (%)</Label>
            <Input
              id="gstPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.gstPercentage || ''}
              onChange={(e) => onInputChange('gstPercentage', parseFloat(e.target.value) || 0)}
              placeholder={placeholders.gstPercentage}
            />
            <p className="text-xs text-gray-500">Tax rate applicable (if any)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCost">
              Shipping Cost ({selectedCountry?.currencySymbol || '$'})
            </Label>
            <Input
              id="shippingCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingCost || ''}
              onChange={(e) => onInputChange('shippingCost', parseFloat(e.target.value) || 0)}
              placeholder={placeholders.shippingCost}
            />
            <p className="text-xs text-gray-500">Cost to ship to you</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversionCharges">
              Conversion Charges ({selectedCountry?.currencySymbol || '$'})
            </Label>
            <Input
              id="conversionCharges"
              type="number"
              step="0.01"
              min="0"
              value={formData.conversionCharges || ''}
              onChange={(e) => onInputChange('conversionCharges', parseFloat(e.target.value) || 0)}
              placeholder={placeholders.conversionCharges}
            />
            <p className="text-xs text-gray-500">Currency/payment processing fees</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalExpenses">
              Additional Expenses ({selectedCountry?.currencySymbol || '$'})
            </Label>
            <Input
              id="additionalExpenses"
              type="number"
              step="0.01"
              min="0"
              value={formData.additionalExpenses || ''}
              onChange={(e) => onInputChange('additionalExpenses', parseFloat(e.target.value) || 0)}
              placeholder={placeholders.additionalExpenses}
            />
            <p className="text-xs text-gray-500">Customs, duties, other costs</p>
          </div>
        </div>

        {/* ✅ CALCULATED COSTS */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Calculated Costs</h4>
            <button
              type="button"
              onClick={onToggleCostBreakdown}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showCostBreakdown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showCostBreakdown ? 'Hide' : 'Show'} breakdown
            </button>
          </div>
          
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
                1 USD = {exchangeRate || 1} {selectedCountry?.currency || 'USD'}
              </div>
            </div>
          </div>

          {/* ✅ DETAILED COST BREAKDOWN */}
          {showCostBreakdown && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown Detail</h5>
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Original Price:</span>
                  <span>{selectedCountry?.currencySymbol || '$'}{safeToFixed(formData.originalPrice)}</span>
                </div>
                {formData.gstPercentage > 0 && (
                  <div className="flex justify-between">
                    <span>Tax/GST ({formData.gstPercentage}%):</span>
                    <span>{selectedCountry?.currencySymbol || '$'}{safeToFixed(formData.originalPrice * (formData.gstPercentage / 100))}</span>
                  </div>
                )}
                {formData.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{selectedCountry?.currencySymbol || '$'}{safeToFixed(formData.shippingCost)}</span>
                  </div>
                )}
                {formData.conversionCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Conversion:</span>
                    <span>{selectedCountry?.currencySymbol || '$'}{safeToFixed(formData.conversionCharges)}</span>
                  </div>
                )}
                {formData.additionalExpenses > 0 && (
                  <div className="flex justify-between">
                    <span>Additional:</span>
                    <span>{selectedCountry?.currencySymbol || '$'}{safeToFixed(formData.additionalExpenses)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-medium">
                  <span>Total Local Cost:</span>
                  <span>{selectedCountry?.currencySymbol || '$'}{safeToFixed(
                    formData.originalPrice + 
                    (formData.originalPrice * (formData.gstPercentage / 100)) + 
                    formData.shippingCost + 
                    formData.conversionCharges + 
                    formData.additionalExpenses
                  )}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ CLEAN: Profit & Discount Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profitMargin">Profit Margin (%)</Label>
            <Input
              id="profitMargin"
              type="number"
              step="0.01"
              min="0"
              value={formData.profitMargin || ''}
              onChange={(e) => onInputChange('profitMargin', parseFloat(e.target.value) || 0)}
              placeholder={placeholders.profitMargin}
            />
            <p className="text-xs text-gray-500">Your desired profit margin percentage</p>
            
            {/* Profit calculation display */}
            {formData.piecePriceUSD > 0 && formData.profitMargin > 0 && (
              <div className="text-sm text-gray-600">
                Profit: ${profit} ({percentage}%)
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
            <Input
              id="discountPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.discountPercentage || ''}
              onChange={(e) => onInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
              placeholder="Enter discount percentage (optional)"
            />
            <p className="text-xs text-gray-500">Discount to offer customers</p>
            
            {/* Discount visibility toggle */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="showDiscountToCustomers"
                checked={formData.showDiscountToCustomers}
                onChange={(e) => onInputChange('showDiscountToCustomers', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showDiscountToCustomers" className="text-sm text-gray-700">
                Show discount to customers
              </label>
            </div>
          </div>
        </div>

        {/* ✅ CUSTOMER PRICE PREVIEW */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-purple-900">Customer Price Preview</h4>
            <button
              type="button"
              onClick={onToggleCustomerPreview}
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              {showCustomerPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showCustomerPreview ? 'Hide' : 'Show'} preview
            </button>
          </div>

          {showCustomerPreview && (
            <div className="space-y-2">
              {hasDiscount && formData.showDiscountToCustomers ? (
                <div>
                  <div className="text-sm text-gray-500 line-through">
                    Was: ${safeToFixed(originalPriceForDisplay)}
                  </div>
                  <div className="text-lg font-bold text-purple-800 flex items-center gap-2">
                    Now: ${safeToFixed(formData.sellingPriceUSD)}
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                      Save {formData.discountPercentage}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-lg font-bold text-purple-800">
                  ${safeToFixed(formData.sellingPriceUSD)}
                </div>
              )}
              
              <div className="text-xs text-gray-600">
                This is how customers will see the pricing on your website.
              </div>
            </div>
          )}
        </div>

        {/* ✅ PRICING MODE CONTROLS */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">Pricing Mode:</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPricingModeChange('basic')}
              className={`px-3 py-1 text-xs rounded ${
                pricingMode === 'basic' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Auto Calculate
            </button>
            <button
              type="button"
              onClick={() => onPricingModeChange('advanced')}
              className={`px-3 py-1 text-xs rounded ${
                pricingMode === 'advanced' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ✅ CLEAN FEATURES IMPLEMENTED:
// ✅ No hardcoded placeholder values or business assumptions
// ✅ Currency automatically determined from Country of Origin selection
// ✅ Admin has complete control over all values and decisions
// ✅ Clear, descriptive placeholders that guide without assuming
// ✅ Professional appearance with helpful guidance text
// ✅ Safe number formatting prevents crashes on invalid input
// ✅ Real-time profit calculations and customer price preview
// ✅ Detailed cost breakdown when needed
// ✅ Responsive design for different screen sizes