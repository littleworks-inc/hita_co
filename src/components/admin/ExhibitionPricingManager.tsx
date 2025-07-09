// src/components/admin/ExhibitionPricingManager.tsx
// =====================================
// 🚀 NEW: Exhibition-Specific Pricing Management
// Allows setting custom pricing, clearance, and discounts for exhibition products
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import {
  DollarSign,
  Tag,
  Percent,
  Save,
  X,
  AlertTriangle,
  TrendingDown,
  Zap,
  History,
  Calculator,
  Info
} from 'lucide-react'

interface ExhibitionProduct {
  id: string
  productId: string
  quantityTaken: number
  quantitySold: number
  exhibitionPrice: number | null
  originalPrice: number | null
  discountPercentage: number | null
  isClearance: boolean | null
  salesNotes: string | null
  priceChangedAt: Date | null
  product: {
    id: string
    name: string
    sku: string
    sellingPriceUSD: number
    discountPercentage: number
    images: string[]
  }
}

interface ExhibitionPricingManagerProps {
  exhibitionProduct: ExhibitionProduct
  exhibitionId: string
  onUpdate: () => void
  onCancel: () => void
}

interface PricingBreakdown {
  storeOriginalPrice: number
  storeDiscountedPrice: number
  exhibitionBasePrice: number
  exhibitionDiscountedPrice: number
  finalPrice: number
  totalSavings: number
  savingsPercentage: number
  hasStoreDiscount: boolean
  hasExhibitionPrice: boolean
  hasExhibitionDiscount: boolean
  hasClearance: boolean
}

export default function ExhibitionPricingManager({
  exhibitionProduct,
  exhibitionId,
  onUpdate,
  onCancel
}: ExhibitionPricingManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [exhibitionPrice, setExhibitionPrice] = useState<number>(
    exhibitionProduct.exhibitionPrice || exhibitionProduct.product.sellingPriceUSD
  )
  const [discountPercentage, setDiscountPercentage] = useState<number>(
    exhibitionProduct.discountPercentage || 0
  )
  const [isClearance, setIsClearance] = useState<boolean>(
    exhibitionProduct.isClearance || false
  )
  const [salesNotes, setSalesNotes] = useState<string>(
    exhibitionProduct.salesNotes || ''
  )

  // Calculate pricing breakdown
  const calculatePricing = (): PricingBreakdown => {
    const product = exhibitionProduct.product
    
    // Store pricing
    const storeOriginalPrice = product.sellingPriceUSD
    const storeDiscountedPrice = storeOriginalPrice * (1 - (product.discountPercentage || 0) / 100)
    
    // Exhibition pricing
    const exhibitionBasePrice = exhibitionPrice || storeDiscountedPrice
    const exhibitionDiscountedPrice = exhibitionBasePrice * (1 - (discountPercentage || 0) / 100)
    
    // Final price (clearance is just a visual badge, no additional discount)
    const finalPrice = exhibitionDiscountedPrice
    
    const totalSavings = storeOriginalPrice - finalPrice
    const savingsPercentage = storeOriginalPrice > 0 ? (totalSavings / storeOriginalPrice) * 100 : 0

    return {
      storeOriginalPrice,
      storeDiscountedPrice,
      exhibitionBasePrice,
      exhibitionDiscountedPrice,
      finalPrice,
      totalSavings,
      savingsPercentage,
      hasStoreDiscount: (product.discountPercentage || 0) > 0,
      hasExhibitionPrice: exhibitionPrice !== product.sellingPriceUSD,
      hasExhibitionDiscount: (discountPercentage || 0) > 0,
      hasClearance: isClearance
    }
  }

  const pricing = calculatePricing()

  // Quick discount buttons
  const quickDiscounts = [
    { label: '10% Off', value: 10 },
    { label: '20% Off', value: 20 },
    { label: '30% Off', value: 30 },
    { label: '50% Off', value: 50 }
  ]

  // Handle save pricing
  const handleSave = async () => {
    if (pricing.finalPrice < 0) {
      alert('Final price cannot be negative')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/products/${exhibitionProduct.id}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibitionPrice: exhibitionPrice,
          discountPercentage: discountPercentage,
          isClearance: isClearance,
          salesNotes: salesNotes
        })
      })

      if (response.ok) {
        onUpdate()
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update pricing')
      }
    } catch (error) {
      console.error('Error updating pricing:', error)
      alert('Failed to update pricing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Exhibition Pricing</h3>
              <p className="text-sm text-gray-600">{exhibitionProduct.product.name}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Pricing Controls */}
            <div className="space-y-6">
              
              {/* Current Store Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Store Pricing (Reference)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Original Price:</span>
                    <span className="font-medium">{formatPrice(pricing.storeOriginalPrice)}</span>
                  </div>
                  {pricing.hasStoreDiscount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Store Discount ({exhibitionProduct.product.discountPercentage}%):</span>
                      <span className="font-medium text-green-600">{formatPrice(pricing.storeDiscountedPrice)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exhibition Base Price */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Exhibition Base Price
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Custom Exhibition Price (Optional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={exhibitionPrice}
                      onChange={(e) => setExhibitionPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Leave empty to use store price"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If not set, uses store price: {formatPrice(exhibitionProduct.product.sellingPriceUSD)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExhibitionPrice(exhibitionProduct.product.sellingPriceUSD)}
                    className="w-full"
                  >
                    Reset to Store Price
                  </Button>
                </CardContent>
              </Card>

              {/* Exhibition Discount */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Exhibition Discount
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Discount Percentage</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>

                  {/* Quick Discount Buttons */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quick Discounts</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {quickDiscounts.map((discount) => (
                        <Button
                          key={discount.value}
                          variant="outline"
                          size="sm"
                          onClick={() => setDiscountPercentage(discount.value)}
                          className="text-xs"
                        >
                          {discount.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clearance Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Clearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="clearance"
                      checked={isClearance}
                      onChange={(e) => setIsClearance(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="clearance" className="text-sm">
                      Mark as Clearance Item
                    </Label>
                  </div>
                  
                  {isClearance && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-800 mb-1">
                        <Tag className="h-4 w-4" />
                        <span className="text-sm font-medium">Clearance Item</span>
                      </div>
                      <p className="text-xs text-orange-700">
                        This item will display a clearance badge to customers
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sales Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sales Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={salesNotes}
                    onChange={(e) => setSalesNotes(e.target.value)}
                    placeholder="Add notes about pricing strategy, reasons for discount, etc."
                    className="w-full h-20 p-3 border border-gray-300 rounded-md text-sm resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pricing Preview */}
            <div className="space-y-6">
              
              {/* Price Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Pricing Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Store Price */}
                  <div className="pb-3 border-b">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Store Original Price:</span>
                      <span className="font-medium">{formatPrice(pricing.storeOriginalPrice)}</span>
                    </div>
                    {pricing.hasStoreDiscount && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">After Store Discount:</span>
                        <span className="text-sm text-green-600">{formatPrice(pricing.storeDiscountedPrice)}</span>
                      </div>
                    )}
                  </div>

                  {/* Exhibition Price */}
                  <div className="pb-3 border-b">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Exhibition Base Price:</span>
                      <span className={`font-medium ${pricing.hasExhibitionPrice ? 'text-purple-600' : ''}`}>
                        {formatPrice(pricing.exhibitionBasePrice)}
                        {pricing.hasExhibitionPrice && (
                          <span className="text-xs text-purple-500 ml-1">(Custom)</span>
                        )}
                      </span>
                    </div>
                    {pricing.hasExhibitionDiscount && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">After Exhibition Discount ({discountPercentage}%):</span>
                        <span className="text-sm text-blue-600">{formatPrice(pricing.exhibitionDiscountedPrice)}</span>
                      </div>
                    )}
                  </div>

                  {/* Clearance - No additional discount calculation needed */}
                  {pricing.hasClearance && (
                    <div className="pb-3 border-b">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-orange-600">Clearance Badge:</span>
                        <span className="text-sm text-orange-600">
                          <Tag className="h-4 w-4 inline" /> Visual Only
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Final Price */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">Final Customer Price:</span>
                      <span className="text-xl font-bold text-green-800">
                        {formatPrice(pricing.finalPrice)}
                      </span>
                    </div>
                    
                    {pricing.totalSavings > 0 && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Total Customer Savings:</span>
                          <span className="font-semibold text-green-700">
                            {formatPrice(pricing.totalSavings)} ({Math.round(pricing.savingsPercentage)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {pricing.finalPrice <= 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Invalid Price</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Final price cannot be zero or negative
                      </p>
                    </div>
                  )}

                  {pricing.savingsPercentage > 70 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">High Discount Warning</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Discount is over 70%. Please verify this is intentional.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Customer View Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {pricing.hasStoreDiscount && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Store Sale
                      </span>
                    )}
                    {pricing.hasExhibitionPrice && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Exhibition Special
                      </span>
                    )}
                    {pricing.hasExhibitionDiscount && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {discountPercentage}% Off
                      </span>
                    )}
                    {pricing.hasClearance && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Clearance
                      </span>
                    )}
                    {pricing.totalSavings > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        Save {formatPrice(pricing.totalSavings)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || pricing.finalPrice <= 0}
            >
              {loading ? 'Saving...' : 'Save Pricing'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}