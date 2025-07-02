// ✅ FIXED: src/components/customer/ProductSizeSelector.tsx

'use client'

import { useState, useEffect } from 'react'
import { Ruler } from 'lucide-react'

// ✅ ADD: ProductSize interface definition
interface ProductSize {
  id: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

// ✅ UPDATED: Product interface
interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  requiresSizes: boolean
  productSizes?: ProductSize[]
  country: {
    currencySymbol: string
  }
}

interface StockStatus {
  isOutOfStock: boolean
  isLowStock: boolean
  totalStock: number
  availableSizes?: number
  lowStockSizes?: number
  hasMultipleSizes: boolean
  requiresSizeSelection: boolean
}

interface ProductSizeSelectorProps {
  product: Product
  stockStatus: StockStatus
  onSizeSelect?: (size: ProductSize | null) => void
  selectedSize?: ProductSize | null
}

export default function ProductSizeSelector({ 
  product, 
  stockStatus, 
  onSizeSelect,
  selectedSize: externalSelectedSize 
}: ProductSizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(externalSelectedSize || null)

  // Update selected size when external prop changes
  useEffect(() => {
    if (externalSelectedSize !== undefined) {
      setSelectedSize(externalSelectedSize)
    }
  }, [externalSelectedSize])

  // Handle size selection
  const handleSizeSelect = (size: ProductSize) => {
    const newSelectedSize = selectedSize?.id === size.id ? null : size
    setSelectedSize(newSelectedSize)
    onSizeSelect?.(newSelectedSize)
  }

  // Get available sizes (in stock)
  const availableSizes = product.productSizes?.filter(size => size.stockQuantity > 0) || []
  
  // Get out of stock sizes
  const outOfStockSizes = product.productSizes?.filter(size => size.stockQuantity === 0) || []

  if (!product.requiresSizes || !product.productSizes?.length) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Size Selection Header */}
      <div className="flex items-center gap-2">
        <Ruler className="h-5 w-5 text-gray-600" />
        <span className="font-medium text-gray-900">
          Size {selectedSize && <span className="text-purple-600">({selectedSize.size})</span>}
        </span>
      </div>

      {/* Available Sizes */}
      {availableSizes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Available Sizes</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {availableSizes.map((size) => {
              const isSelected = selectedSize?.id === size.id
              const isLowStock = size.stockQuantity <= size.lowStockAlert
              
              return (
                <button
                  key={size.id}
                  onClick={() => handleSizeSelect(size)}
                  className={`
                    relative p-3 border rounded-lg text-center transition-all duration-200
                    ${isSelected 
                      ? 'border-purple-600 bg-purple-50 text-purple-900' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }
                  `}
                >
                  <div className="font-medium">{size.size}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {size.stockQuantity} left
                  </div>
                  
                  {/* Low Stock Warning */}
                  {isLowStock && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Out of Stock Sizes */}
      {outOfStockSizes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">Out of Stock</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {outOfStockSizes.map((size) => (
              <button
                key={size.id}
                disabled
                className="p-3 border border-gray-200 rounded-lg text-center bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <div className="font-medium">{size.size}</div>
                <div className="text-xs mt-1">Out of stock</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection Info */}
      {selectedSize && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-purple-900">
                Selected: {selectedSize.size}
              </span>
              <div className="text-xs text-purple-700">
                SKU: {selectedSize.sku}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-purple-900">
                {selectedSize.stockQuantity} available
              </div>
              {selectedSize.stockQuantity <= selectedSize.lowStockAlert && (
                <div className="text-xs text-orange-600">
                  Low stock
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selection Required Notice */}
      {!selectedSize && availableSizes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            Please select a size to add this item to your cart.
          </div>
        </div>
      )}
    </div>
  )
}