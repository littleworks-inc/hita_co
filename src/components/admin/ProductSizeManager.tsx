// =====================================
// src/components/admin/ProductSizeManager.tsx
// ✅ FIXED: Enable Traditional Inventory inputs for non-sized products
// =====================================

'use client'

import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import {
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  Ruler,
  Info
} from 'lucide-react'

// Interfaces
interface ProductSize {
  id?: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

interface ProductSizeManagerProps {
  requiresSizes: boolean
  productSizes: ProductSize[]
  baseSku: string
  errors: Record<string, string>
  onRequiresSizesChange: (requiresSizes: boolean) => void
  onSizesChange: (sizes: ProductSize[]) => void
  onError: (field: string, error: string) => void
  onClearError: (field: string) => void
  // ✅ ADDED: Props for traditional inventory management
  stockQuantity?: number
  lowStockAlert?: number
  onStockQuantityChange?: (value: number) => void
  onLowStockAlertChange?: (value: number) => void
}

export default function ProductSizeManager({
  requiresSizes,
  productSizes,
  baseSku,
  errors,
  onRequiresSizesChange,
  onSizesChange,
  onError,
  onClearError,
  // ✅ ADDED: Traditional inventory props with defaults
  stockQuantity = 0,
  lowStockAlert = 0,
  onStockQuantityChange,
  onLowStockAlertChange
}: ProductSizeManagerProps) {

  // =====================================
  // SIZE MANAGEMENT FUNCTIONS
  // =====================================

  const addSize = (size: string) => {
    if (!size.trim()) return

    // Check if size already exists
    if (productSizes?.some(s => s.size.toLowerCase() === size.toLowerCase())) {
      onError('sizes', `Size "${size}" already exists`)
      return
    }

    const newSize: ProductSize = {
      size: size.trim(),
      sku: `${baseSku}-${size.trim().toUpperCase()}`,
      stockQuantity: 0,
      lowStockAlert: 0,
      isActive: true,
      sortOrder: productSizes?.length || 0
    }

    onSizesChange([...(productSizes || []), newSize])
    onClearError('sizes')
  }

  const removeSize = (index: number) => {
    const newSizes = productSizes?.filter((_, i) => i !== index) || []
    onSizesChange(newSizes)
  }

  const updateSize = (index: number, field: keyof ProductSize, value: any) => {
    const newSizes = productSizes?.map((size, i) =>
      i === index ? { ...size, [field]: value } : size
    ) || []
    onSizesChange(newSizes)
  }

  const addStandardSizes = (type: 'clothing' | 'jewelry' | 'footwear') => {
    const sizeMap = {
      clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      jewelry: ['Small', 'Medium', 'Large'],
      footwear: ['6', '7', '8', '9', '10', '11', '12']
    }

    const sizes = sizeMap[type]
    const newSizes = sizes.map((size, index) => ({
      size,
      sku: `${baseSku}-${size.toUpperCase()}`,
      stockQuantity: 0,
      lowStockAlert: 0,
      isActive: true,
      sortOrder: (productSizes?.length || 0) + index
    }))

    onSizesChange([...(productSizes || []), ...newSizes])
    onClearError('sizes')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Size Variants Toggle */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="requiresSizes"
            checked={requiresSizes}
            onChange={(e) => onRequiresSizesChange(e.target.checked)}
            className="mt-1"
          />
          <div>
            <label htmlFor="requiresSizes" className="font-medium text-gray-900 cursor-pointer">
              This product has size variants
            </label>
            <p className="text-sm text-gray-600 mt-1">
              Enable for kurtas, blouses, lehengas, and other fitted garments that require different sizes
            </p>
          </div>
        </div>

        {/* Size Management (when sizes are enabled) */}
        {requiresSizes && (
          <div className="space-y-4">
            {/* Quick Size Addition */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStandardSizes('clothing')}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Clothing Sizes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStandardSizes('jewelry')}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Jewelry Sizes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStandardSizes('footwear')}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Footwear Sizes
              </Button>
            </div>

            {/* Size List */}
            {productSizes && productSizes.length > 0 ? (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-3 text-xs font-medium text-gray-600 px-3 py-2 bg-white rounded border">
                  <div>Size</div>
                  <div>SKU</div>
                  <div>Stock Qty</div>
                  <div>Low Alert</div>
                  <div>Status</div>
                  <div>Action</div>
                </div>
                
                {/* Size Rows */}
                {productSizes.map((size, index) => (
                  <div key={index} className="grid grid-cols-6 gap-3 items-center bg-white p-3 rounded border">
                    {/* Size Name */}
                    <div className="font-medium text-sm">{size.size}</div>
                    
                    {/* SKU */}
                    <Input
                      value={size.sku}
                      onChange={(e) => updateSize(index, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="text-xs h-8"
                    />
                    
                    {/* Stock Quantity */}
                    <Input
                      type="number"
                      min="0"
                      value={size.stockQuantity}
                      onChange={(e) => updateSize(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                    
                    {/* Low Stock Alert */}
                    <Input
                      type="number"
                      min="0"
                      value={size.lowStockAlert}
                      onChange={(e) => updateSize(index, 'lowStockAlert', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="text-xs h-8"
                    />
                    
                    {/* Status */}
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={size.isActive}
                        onChange={(e) => updateSize(index, 'isActive', e.target.checked)}
                        className="h-3 w-3"
                      />
                      <span className="text-xs text-gray-600">Active</span>
                    </div>
                    
                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSize(index)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Ruler className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <div className="text-sm mb-3">
                  Add size variants using the quick buttons above or create custom sizes
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addStandardSizes('clothing')}
                  className="text-blue-700 border-blue-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Standard Clothing Sizes
                </Button>
              </div>
            )}

            {/* Size Validation Errors */}
            {errors.sizes && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">{errors.sizes}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ FIXED: Traditional Stock Management (for non-sized products) */}
        {!requiresSizes && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Traditional Inventory</h4>
            <div className="text-sm text-gray-600 mb-4">
              This product doesn't have size variants. Use simple stock tracking.
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* ✅ FIXED: Enabled Stock Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => onStockQuantityChange?.(parseInt(e.target.value) || 0)}
                  placeholder="Enter stock quantity"
                  className="bg-white"
                />
                <div className="text-xs text-gray-500">
                  Number of items available for sale
                </div>
              </div>

              {/* ✅ FIXED: Enabled Low Stock Alert Input */}
              <div className="space-y-2">
                <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                <Input
                  id="lowStockAlert"
                  type="number"
                  min="0"
                  value={lowStockAlert}
                  onChange={(e) => onLowStockAlertChange?.(parseInt(e.target.value) || 0)}
                  placeholder="Enter alert threshold"
                  className="bg-white"
                />
                <div className="text-xs text-gray-500">
                  Get notified when stock falls below this number
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}