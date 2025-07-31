// src/components/admin/ProductBarcodeGenerator.tsx
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed multiple format buttons
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tag,
  RefreshCw,
  AlertTriangle,
  Package,
  Copy
} from 'lucide-react'

interface ProductSize {
  id?: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

interface ProductBarcodeGeneratorProps {
  sku: string
  barcode: string
  barcodeType: string
  barcodeNeedsUpdate: boolean
  requiresSizes: boolean
  productSizes: ProductSize[]
  onBarcodeChange: (barcode: string) => void
  onBarcodeTypeChange: (type: string) => void
  onBarcodeGenerated: (barcode: string, type: string) => void
  onUpdateNeeded: (needed: boolean) => void
  onSizeBarcodeGenerated?: (sizeIndex: number, barcode: string) => void
}

export default function ProductBarcodeGenerator({
  sku,
  barcode,
  barcodeType,
  barcodeNeedsUpdate,
  requiresSizes,
  productSizes,
  onBarcodeChange,
  onBarcodeTypeChange,
  onBarcodeGenerated,
  onUpdateNeeded,
  onSizeBarcodeGenerated
}: ProductBarcodeGeneratorProps) {

  // Generate CODE128 barcode from SKU (simplified)
  const generateCODE128FromSKU = (sourceSku: string, sizeVariant?: string): string => {
    if (!sourceSku) return ''

    let targetSku = sourceSku.trim().toUpperCase()
    
    // If we have a size variant, append it to the base SKU
    if (sizeVariant) {
      targetSku = `${sourceSku}-${sizeVariant.toUpperCase()}`
    }

    // For CODE128, we can use the SKU directly with some enhancements
    const timestamp = Date.now().toString().slice(-6)
    
    // If SKU is very short, add timestamp for uniqueness
    if (targetSku.length < 8) {
      targetSku = `${targetSku}-${timestamp}`
    }
    
    // Limit length for practical scanning
    if (targetSku.length > 30) {
      targetSku = targetSku.slice(0, 30)
    }

    return targetSku
  }

  // Generate barcode using CODE128 for main product
  const generateBarcodeFromSKU = () => {
    const generated = generateCODE128FromSKU(sku)
    if (generated) {
      onBarcodeGenerated(generated, 'CODE128')
      onBarcodeTypeChange('CODE128')
      onUpdateNeeded(false)
      console.log('Main CODE128 barcode generated:', { sku, barcode: generated })
    }
  }

  // Generate CODE128 barcodes for all size variants
  const generateAllSizeBarcodes = () => {
    if (!requiresSizes || !productSizes.length) return

    productSizes.forEach((size, index) => {
      // Use base SKU + size suffix format
      const sizeBarcode = generateCODE128FromSKU(sku, size.size)
      if (sizeBarcode && onSizeBarcodeGenerated) {
        onSizeBarcodeGenerated(index, sizeBarcode)
      }
    })
  }

  // Copy barcode to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Simple barcode visualization component for CODE128
  const BarcodeVisualization = ({ barcodeValue, label }: { barcodeValue: string, label?: string }) => (
    <div className="bg-white p-3 rounded border">
      {label && <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>}
      <div className="font-mono text-sm font-bold mb-1">{barcodeValue}</div>
      <div className="mx-auto w-full max-w-64 h-12 bg-white border flex items-end justify-center overflow-hidden">
        {/* Simple CODE128 visualization */}
        <div className="flex items-end justify-center gap-px">
          {/* Start pattern */}
          <div className="bg-black" style={{ width: '2px', height: '36px' }} />
          <div className="bg-white" style={{ width: '1px', height: '36px' }} />
          <div className="bg-black" style={{ width: '2px', height: '36px' }} />
          
          {/* Data bars - simplified representation */}
          {barcodeValue.split('').slice(0, 15).map((char, i) => {
            const charCode = char.charCodeAt(0)
            const patterns = [
              [3, 1, 2, 1], [2, 2, 2, 2], [1, 3, 1, 3], [2, 1, 3, 1], [1, 2, 1, 4]
            ]
            const pattern = patterns[charCode % patterns.length]
            
            return pattern.map((width, patternIndex) => (
              <div
                key={`char-${i}-${patternIndex}`}
                className={patternIndex % 2 === 0 ? 'bg-black' : 'bg-white'}
                style={{ width: `${width}px`, height: '36px' }}
              />
            ))
          })}
          
          {/* End pattern */}
          <div className="bg-black" style={{ width: '2px', height: '36px' }} />
          <div className="bg-white" style={{ width: '1px', height: '36px' }} />
          <div className="bg-black" style={{ width: '2px', height: '36px' }} />
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(barcodeValue)}
        className="mt-1 text-xs"
      >
        <Copy className="h-3 w-3 mr-1" />
        Copy
      </Button>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          CODE128 Barcode Management
          {requiresSizes && (
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Size Variants: {productSizes.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          
          {/* Barcode Format Info */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Barcode Format: CODE128</div>
              <div className="text-xs text-blue-700 mt-1">
                Universal format supporting letters, numbers & symbols. 
                Most compatible with all barcode scanners and POS systems.
              </div>
            </div>
          </div>
          
          {/* Main Product Barcode */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              {requiresSizes ? 'Master Product Barcode (CODE128)' : 'Product Barcode (CODE128)'}
            </h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode Value</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => onBarcodeChange(e.target.value)}
                    placeholder="CODE128 barcode value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateBarcodeFromSKU}
                    disabled={!sku}
                    title="Generate CODE128 barcode from SKU"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-600">
                  Supports any letters, numbers, and symbols
                </div>
              </div>

              {/* Hidden field to maintain barcodeType consistency */}
              <input type="hidden" value="CODE128" />
              
              <div className="space-y-2">
                <Label>Generation Options</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateBarcodeFromSKU}
                    disabled={!sku}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Generate CODE128
                  </Button>
                </div>
                <div className="text-xs text-gray-600">
                  Auto-generates from SKU using CODE128 format
                </div>
              </div>
            </div>

            {/* Main Barcode Preview */}
            {barcode && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h5 className="font-medium text-gray-900 mb-3">Main Product Barcode (CODE128)</h5>
                <BarcodeVisualization barcodeValue={barcode} />
                <div className="text-sm text-gray-600 mt-2">Format: CODE128 • Length: {barcode.length} chars</div>
              </div>
            )}
          </div>

          {/* Size Variant Barcodes */}
          {requiresSizes && productSizes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Size Variant Barcodes (CODE128)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAllSizeBarcodes}
                  disabled={!sku}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Generate All Size Barcodes
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Size Variant Tracking:</strong> Each size gets its own unique CODE128 barcode for individual inventory tracking.
                    This allows you to scan and track stock levels for each size separately.
                  </div>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {productSizes.map((size, index) => {
                    const sizeBarcode = generateCODE128FromSKU(sku, size.size)
                    return (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          Size: {size.size}
                        </div>
                        <div className="font-mono text-xs text-gray-600 mb-2">
                          {sizeBarcode}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stock: {size.stockQuantity} • SKU: {size.sku}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sizeBarcode)}
                          className="text-xs mt-1 p-1 h-auto"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SKU Change Detection */}
          {barcodeNeedsUpdate && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  SKU changed - consider updating barcode
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateBarcodeFromSKU}
                  className="ml-auto"
                >
                  Update Barcode
                </Button>
              </div>
            </div>
          )}

          {/* CODE128 Information */}
          <div className="text-xs text-gray-600">
            <div className="bg-blue-50 p-3 rounded">
              <strong>CODE128 Benefits:</strong> Perfect for readable size variants like "{sku}-XS", "{sku}-M", "{sku}-L", "{sku}-XL".
              Maintains human-readable format while supporting barcode scanning. Ideal for size tracking and inventory management.
              Works with any POS system and barcode scanner.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}