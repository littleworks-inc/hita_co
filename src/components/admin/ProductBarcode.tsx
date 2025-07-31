// src/components/admin/ProductBarcode.tsx
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed format selection dropdown
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

interface Product {
  sku: string
  barcode: string
  barcodeType: string
}

interface ProductBarcodeProps {
  formData: Product
  onInputChange: (field: keyof Product, value: any) => void
  mode: 'create' | 'edit'
}

export default function ProductBarcode({ 
  formData, 
  onInputChange, 
  mode 
}: ProductBarcodeProps) {
  // Always set barcodeType to CODE128 when barcode changes
  const handleBarcodeChange = (value: string) => {
    onInputChange('barcode', value)
    // Automatically set the type to CODE128
    if (formData.barcodeType !== 'CODE128') {
      onInputChange('barcodeType', 'CODE128')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Barcode Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barcode Format Info - Read Only */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="font-medium">Barcode Format: CODE128</div>
            <div className="text-xs text-blue-700 mt-1">
              Universal format supporting letters, numbers & symbols. 
              Most compatible with all barcode scanners.
            </div>
          </div>
        </div>

        {/* Barcode Value Input */}
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode Value</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => handleBarcodeChange(e.target.value)}
            placeholder="Enter barcode or leave empty to auto-generate from SKU"
          />
          <div className="text-xs text-gray-600">
            {formData.barcode ? (
              <>
                Current barcode: <span className="font-mono">{formData.barcode}</span> (CODE128)
              </>
            ) : (
              'Will auto-generate CODE128 barcode from SKU if left empty'
            )}
          </div>
        </div>

        {/* Hidden field to maintain barcodeType in form data */}
        <input
          type="hidden"
          value="CODE128"
          onChange={() => {}} // Keep form consistent
        />

        {/* Benefits Info */}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <div className="font-medium text-gray-700 mb-1">CODE128 Benefits:</div>
          <div>• Works with any SKU format (letters, numbers, symbols)</div>
          <div>• Compatible with all modern barcode scanners</div>
          <div>• Efficient encoding - compact barcode size</div>
          <div>• Perfect for inventory tracking and POS systems</div>
        </div>
      </CardContent>
    </Card>
  )
}