// =====================================
// src/components/admin/ProductSizeManager.tsx
// Size Management Component with Individual Inventory Tracking
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
}

export default function ProductSizeManager({
  requiresSizes,
  productSizes,
  baseSku,
  errors,
  onRequiresSizesChange,
  onSizesChange,
  onError,
  onClearError
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
      stockQuantity: 0,           // ✅ No default stock - admin sets
      lowStockAlert: 0,           // ✅ No default alert - admin sets  
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

  const addStandardSizes = (sizeType: 'clothing' | 'shoes' | 'jewelry') => {
    const sizePresets = {
      clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      shoes: ['6', '7', '8', '9', '10', '11'],
      jewelry: ['XS', 'S', 'M', 'L']
    }

    sizePresets[sizeType].forEach(size => {
      if (!productSizes?.some(s => s.size === size)) {
        addSize(size)
      }
    })
  }

  const handleRequiresSizesChange = (checked: boolean) => {
    onRequiresSizesChange(checked)
    // Clear sizes if disabling
    if (!checked) {
      onSizesChange([])
    }
  }

  // =====================================
  // RENDER COMPONENT
  // =====================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Inventory Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Manual Size Checkbox */}
        <div className="mb-6">
          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border">
            <input
              type="checkbox"
              id="requiresSizes"
              checked={requiresSizes}
              onChange={(e) => handleRequiresSizesChange(e.target.checked)}
              className="rounded h-4 w-4"
            />
            <Label htmlFor="requiresSizes" className="cursor-pointer">
              <span className="font-medium">This product has size variants</span>
              <div className="text-sm text-gray-500 mt-1">
                Enable for kurtas, blouses, lehengas, and other fitted garments that require different sizes
              </div>
            </Label>
          </div>
        </div>

        {/* Size Selection Interface */}
        {requiresSizes && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-blue-900">Size Variants Management</h4>
              <div className="text-sm text-blue-700">
                {productSizes.length} size{productSizes.length !== 1 ? 's' : ''} added
              </div>
            </div>

            {/* Quick Size Addition Buttons */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Quick Add:</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addStandardSizes('clothing')}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Clothing Sizes (XS-XXL)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addStandardSizes('shoes')}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Shoe Sizes (6-11)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const size = prompt('Enter custom size name (e.g., 32, 34, 36 for waist sizes):')
                    if (size?.trim()) addSize(size.trim())
                  }}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Custom Size
                </Button>
              </div>
            </div>

            {/* Size Management Table */}
            {productSizes.length > 0 ? (
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
                      placeholder="5"
                      className="text-xs h-8"
                    />
                    
                    {/* Status Toggle */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={size.isActive}
                        onChange={(e) => updateSize(index, 'isActive', e.target.checked)}
                        className="rounded h-3 w-3"
                      />
                      <span className="ml-1 text-xs text-gray-600">Active</span>
                    </div>
                    
                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSize(index)}
                      className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {/* Size Summary Card */}
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-600">Total Stock</div>
                      <div className="text-lg font-bold text-blue-600">
                        {productSizes.reduce((sum, size) => sum + size.stockQuantity, 0)}
                      </div>
                      <div className="text-xs text-gray-500">across all sizes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Active Sizes</div>
                      <div className="text-lg font-bold text-green-600">
                        {productSizes.filter(size => size.isActive).length}
                      </div>
                      <div className="text-xs text-gray-500">available for sale</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Low Stock</div>
                      <div className="text-lg font-bold text-orange-600">
                        {productSizes.filter(size => size.stockQuantity <= size.lowStockAlert).length}
                      </div>
                      <div className="text-xs text-gray-500">need restocking</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Out of Stock</div>
                      <div className="text-lg font-bold text-red-600">
                        {productSizes.filter(size => size.stockQuantity === 0).length}
                      </div>
                      <div className="text-xs text-gray-500">unavailable</div>
                    </div>
                  </div>
                </div>
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

        {/* Traditional Stock Management (for non-sized products) */}
        {!requiresSizes && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Traditional Inventory</h4>
            <div className="text-sm text-gray-600 mb-3">
              This product doesn't have size variants. Use simple stock tracking.
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={0} // This will be managed by parent component
                  disabled
                  placeholder="Managed by main form"
                  className="bg-gray-100"
                />
                <div className="text-xs text-gray-500">
                  Configure in the main pricing section above
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                <Input
                  id="lowStockAlert"
                  type="number"
                  min="0"
                  value={0} // This will be managed by parent component
                  disabled
                  placeholder="Managed by main form"
                  className="bg-gray-100"
                />
                <div className="text-xs text-gray-500">
                  Configure in the main pricing section above
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}