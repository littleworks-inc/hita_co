'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import ProductImage from '@/components/admin/ProductImage'
import {
  Zap,
  Plus,
  Minus,
  Save,
  TrendingUp,
  Package
} from 'lucide-react'

interface ExhibitionProduct {
  id: string
  productId: string
  quantityTaken: number
  quantitySold: number
  product: {
    id: string
    name: string
    sku: string
    sellingPriceUSD: number
    images: string[]
  }
}

interface QuickSalesUpdateProps {
  exhibitionId: string
  exhibitionProducts: ExhibitionProduct[]
}

export default function QuickSalesUpdate({ exhibitionId, exhibitionProducts }: QuickSalesUpdateProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [updates, setUpdates] = useState<Record<string, number>>({})

  // Initialize updates with current sold quantities
  const initializeUpdates = () => {
    const initialUpdates: Record<string, number> = {}
    exhibitionProducts.forEach(ep => {
      initialUpdates[ep.id] = ep.quantitySold
    })
    setUpdates(initialUpdates)
  }

  // Initialize on first render
  useState(() => {
    initializeUpdates()
  })

  const handleQuantityChange = (exhibitionProductId: string, newQuantity: number, maxQuantity: number) => {
    const clampedQuantity = Math.max(0, Math.min(newQuantity, maxQuantity))
    setUpdates(prev => ({
      ...prev,
      [exhibitionProductId]: clampedQuantity
    }))
  }

  const handleQuickIncrement = (exhibitionProductId: string, maxQuantity: number) => {
    const currentQuantity = updates[exhibitionProductId] || 0
    if (currentQuantity < maxQuantity) {
      handleQuantityChange(exhibitionProductId, currentQuantity + 1, maxQuantity)
    }
  }

  const handleQuickDecrement = (exhibitionProductId: string) => {
    const currentQuantity = updates[exhibitionProductId] || 0
    if (currentQuantity > 0) {
      handleQuantityChange(exhibitionProductId, currentQuantity - 1, 999999)
    }
  }

  const handleSaveAll = async () => {
    setLoading(true)

    try {
      // Update all products that have changes
      const updatePromises = exhibitionProducts
        .filter(ep => updates[ep.id] !== ep.quantitySold)
        .map(ep => 
          fetch(`/api/admin/exhibitions/${exhibitionId}/products/${ep.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantityTaken: ep.quantityTaken,
              quantitySold: updates[ep.id]
            })
          })
        )

      await Promise.all(updatePromises)
      router.refresh()
    } catch (error) {
      alert('Failed to update sales. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = exhibitionProducts.some(ep => updates[ep.id] !== ep.quantitySold)
  const totalRevenue = exhibitionProducts.reduce((sum, ep) => 
    sum + ((updates[ep.id] || 0) * ep.product.sellingPriceUSD), 0
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Sales Update
          </CardTitle>
          {hasChanges && (
            <Button onClick={handleSaveAll} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save All Changes'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {exhibitionProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm">No products to update</p>
            <p className="text-xs">Add products to the exhibition first</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Revenue Summary */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Current Revenue</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(totalRevenue)}
                </span>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {exhibitionProducts.map((exhibitionProduct) => {
                const currentSold = updates[exhibitionProduct.id] || 0
                const hasChange = currentSold !== exhibitionProduct.quantitySold
                const revenue = currentSold * exhibitionProduct.product.sellingPriceUSD

                return (
                  <div 
                    key={exhibitionProduct.id} 
                    className={`p-4 border rounded-lg ${hasChange ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <ProductImage 
                        images={exhibitionProduct.product.images}
                        name={exhibitionProduct.product.name}
                        className="h-12 w-12"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {exhibitionProduct.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatPrice(exhibitionProduct.product.sellingPriceUSD)} • Taken: {exhibitionProduct.quantityTaken}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickDecrement(exhibitionProduct.id)}
                        disabled={currentSold <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Input
                        type="number"
                        min="0"
                        max={exhibitionProduct.quantityTaken}
                        value={currentSold}
                        onChange={(e) => handleQuantityChange(
                          exhibitionProduct.id, 
                          parseInt(e.target.value) || 0,
                          exhibitionProduct.quantityTaken
                        )}
                        className="w-20 text-center"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickIncrement(exhibitionProduct.id, exhibitionProduct.quantityTaken)}
                        disabled={currentSold >= exhibitionProduct.quantityTaken}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      <div className="ml-auto text-right">
                        <div className="font-medium text-gray-900">
                          {formatPrice(revenue)}
                        </div>
                        {hasChange && (
                          <div className="text-xs text-blue-600">
                            Changed +{currentSold - exhibitionProduct.quantitySold}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save Button (bottom) */}
            {hasChanges && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleSaveAll} disabled={loading} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving Changes...' : `Save ${exhibitionProducts.filter(ep => updates[ep.id] !== ep.quantitySold).length} Updates`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}