// =====================================
// src/components/admin/ProductPricing.tsx - FIXED WITH NULL SAFETY
// =====================================
'use client'

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { DollarSign } from 'lucide-react'

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

  const { profit, percentage } = safeProfitCalculation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing & Cost Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Calculated Costs - ✅ WITH NULL SAFETY */}
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

        {/* Profit & Selling Price */}
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

        {/* Final Selling Price - ✅ WITH NULL SAFETY */}
        <div className="bg-blue-50 p-4 rounded-md">
          <Label>Final Selling Price (USD)</Label>
          <div className="text-2xl font-bold text-blue-600">
            ${safeToFixed(formData.sellingPriceUSD)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Profit: ${profit} ({percentage}%)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}