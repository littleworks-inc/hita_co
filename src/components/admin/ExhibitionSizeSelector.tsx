// =====================================
// FIXED: Complete Size Selection Component for Exhibition Products
// src/components/admin/ExhibitionSizeSelector.tsx
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Label } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { 
  Plus, 
  Minus, 
  Ruler, 
  Package, 
  AlertTriangle,
  CheckCircle,
  ShoppingBag
} from 'lucide-react'

interface ProductSize {
  id: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  requiresSizes: boolean
  productSizes?: ProductSize[]
  images: string[]
}

interface SizeSelection {
  sizeId: string
  size: string
  sku: string
  stockQuantity: number
  quantityTaken: number
}

interface ExhibitionSizeSelectorProps {
  product: Product
  onSizesSelected: (sizes: SizeSelection[]) => void
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function ExhibitionSizeSelector({
  product,
  onSizesSelected,
  onCancel,
  onConfirm,
  loading = false
}: ExhibitionSizeSelectorProps) {
  const [selectedSizes, setSelectedSizes] = useState<SizeSelection[]>([])

  // Initialize size selections
  useEffect(() => {
    if (product.productSizes) {
      const initialSizes = product.productSizes
        .filter(size => size.isActive && size.stockQuantity > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(size => ({
          sizeId: size.id,
          size: size.size,
          sku: size.sku,
          stockQuantity: size.stockQuantity,
          quantityTaken: 0
        }))
      
      setSelectedSizes(initialSizes)
      onSizesSelected(initialSizes)
    }
  }, [product, onSizesSelected])

  // Update quantity for a specific size
  const updateSizeQuantity = (sizeId: string, quantity: number) => {
    const updatedSizes = selectedSizes.map(size => 
      size.sizeId === sizeId 
        ? { ...size, quantityTaken: Math.max(0, Math.min(quantity, size.stockQuantity)) }
        : size
    )
    
    setSelectedSizes(updatedSizes)
    onSizesSelected(updatedSizes)
  }

  // Quick increment/decrement
  const adjustQuantity = (sizeId: string, delta: number) => {
    const size = selectedSizes.find(s => s.sizeId === sizeId)
    if (size) {
      updateSizeQuantity(sizeId, size.quantityTaken + delta)
    }
  }

  // Get totals
  const totalQuantitySelected = selectedSizes.reduce((sum, size) => sum + size.quantityTaken, 0)
  const sizesWithQuantity = selectedSizes.filter(size => size.quantityTaken > 0)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Select Sizes for "{product.name}"
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose which sizes and quantities to take to the exhibition
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Product Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {product.images.length > 0 && (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-12 h-12 object-cover rounded-md"
            />
          )}
          <div>
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            <p className="text-sm text-green-600 font-medium">
              ${product.sellingPriceUSD.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Size Selection Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-900">Available Sizes</h5>
            <div className="text-sm text-gray-500">
              Total selected: <span className="font-medium">{totalQuantitySelected}</span>
            </div>
          </div>

          {selectedSizes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
              <p>No sizes available or all sizes are out of stock</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {selectedSizes.map((size) => (
                <div 
                  key={size.sizeId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  {/* Size Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-blue-800">{size.size}</span>
                    </div>
                    <div>
                      <div className="font-medium">Size {size.size}</div>
                      <div className="text-sm text-gray-600">SKU: {size.sku}</div>
                      <div className="text-sm">
                        <span className={`font-medium ${
                          size.stockQuantity <= 5 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {size.stockQuantity} available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustQuantity(size.sizeId, -1)}
                      disabled={size.quantityTaken <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      type="number"
                      min="0"
                      max={size.stockQuantity}
                      value={size.quantityTaken}
                      onChange={(e) => updateSizeQuantity(size.sizeId, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustQuantity(size.sizeId, 1)}
                      disabled={size.quantityTaken >= size.stockQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {sizesWithQuantity.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Selected Sizes Summary</span>
            </div>
            <div className="space-y-1">
              {sizesWithQuantity.map((size) => (
                <div key={size.sizeId} className="flex justify-between text-sm">
                  <span className="text-blue-800">Size {size.size}:</span>
                  <span className="font-medium text-blue-900">{size.quantityTaken} units</span>
                </div>
              ))}
              <div className="border-t border-blue-200 pt-1 mt-2">
                <div className="flex justify-between font-medium text-blue-900">
                  <span>Total Quantity:</span>
                  <span>{totalQuantitySelected} units</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={loading || totalQuantitySelected === 0}
            className="flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            Add to Exhibition ({totalQuantitySelected})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}