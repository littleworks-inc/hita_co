// =====================================
// src/components/admin/ProductBarcode.tsx - FIXED
// =====================================
'use client'

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui'
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Barcode Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="barcodeType">Barcode Format</Label>
          <select
            id="barcodeType"
            value={formData.barcodeType}
            onChange={(e) => onInputChange('barcodeType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CODE128">CODE128 - Internal Tracking</option>
            <option value="UPC">UPC - US Retail Standard</option>
            <option value="EAN13">EAN13 - International Standard</option>
            <option value="CODE39">CODE39 - Simple Format</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode Value</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => onInputChange('barcode', e.target.value)}
            placeholder="Enter or generate barcode"
          />
        </div>
      </CardContent>
    </Card>
  )
}
