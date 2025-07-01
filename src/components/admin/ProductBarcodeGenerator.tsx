'use client'

import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import {
  Tag,
  RefreshCw,
  Info,
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

  // Calculate UPC check digit
  const calculateUPCCheckDigit = (code: string): string => {
    let sum = 0
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i])
      sum += i % 2 === 0 ? digit * 3 : digit
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit.toString()
  }

  // Calculate EAN13 check digit
  const calculateEAN13CheckDigit = (code: string): string => {
    let sum = 0
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i])
      sum += i % 2 === 0 ? digit : digit * 3
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit.toString()
  }

  // Generate barcode with specified type and optional size variant
  const generateBarcodeWithType = (type: string, sizeSku?: string, sizeVariant?: string) => {
    let targetSku = sizeSku || sku
    
    // If we have a size variant, append it to the base SKU
    if (sizeVariant && !sizeSku) {
      targetSku = `${sku}-${sizeVariant.toUpperCase()}`
    }
    
    if (!targetSku) {
      return ''
    }

    const cleanSKU = targetSku.replace(/[^A-Z0-9]/g, '').toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    let generatedBarcode = ''

    switch (type.toUpperCase()) {
      case 'UPC':
        let upcBase = cleanSKU.replace(/[^0-9]/g, '')
        if (upcBase.length < 11) {
          upcBase = (upcBase + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 11).padStart(11, '0')
        } else {
          upcBase = upcBase.slice(0, 11)
        }
        const upcCheckDigit = calculateUPCCheckDigit(upcBase)
        generatedBarcode = upcBase + upcCheckDigit
        break
        
      case 'EAN13':
        let eanBase = cleanSKU.replace(/[^0-9]/g, '')
        if (eanBase.length < 12) {
          eanBase = (eanBase + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
        } else {
          eanBase = eanBase.slice(0, 12)
        }
        const eanCheckDigit = calculateEAN13CheckDigit(eanBase)
        generatedBarcode = eanBase + eanCheckDigit
        break
        
      case 'CODE39':
        generatedBarcode = cleanSKU.slice(0, 20)
        break
        
      case 'CODE128':
      default:
        // For CODE128, keep the readable format with dashes
        generatedBarcode = targetSku.length > 20 ? targetSku.slice(0, 20) : targetSku
        break
    }

    return generatedBarcode
  }

  // Generate barcode using current type for main product
  const generateBarcodeFromSKU = () => {
    const generated = generateBarcodeWithType(barcodeType)
    if (generated) {
      onBarcodeGenerated(generated, barcodeType)
      onUpdateNeeded(false)
      console.log('Main barcode generated:', { sku, type: barcodeType, barcode: generated })
    }
  }

  // Generate barcodes for all size variants
  const generateAllSizeBarcodes = () => {
    if (!requiresSizes || !productSizes.length) return

    productSizes.forEach((size, index) => {
      // Use base SKU + size suffix format
      const sizeBarcode = generateBarcodeWithType(barcodeType, undefined, size.size)
      if (sizeBarcode && onSizeBarcodeGenerated) {
        onSizeBarcodeGenerated(index, sizeBarcode)
      }
    })
  }

  // Copy barcode to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Enhanced barcode visualization component
  const BarcodeVisualization = ({ barcodeValue, label }: { barcodeValue: string, label?: string }) => (
    <div className="bg-white p-3 rounded border">
      {label && <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>}
      <div className="font-mono text-sm font-bold mb-1">{barcodeValue}</div>
      <div className="mx-auto w-full max-w-64 h-12 bg-white border flex items-end justify-center overflow-hidden">
        {(() => {
          const bars = []
          const barcodeString = barcodeValue
          
          // Create start pattern
          bars.push(
            <div key="start1" className="bg-black" style={{ width: '2px', height: '36px' }} />,
            <div key="start2" className="bg-white" style={{ width: '1px', height: '36px' }} />,
            <div key="start3" className="bg-black" style={{ width: '2px', height: '36px' }} />
          )
          
          // Generate bars for each character
          for (let i = 0; i < Math.min(barcodeString.length, 15); i++) {
            const char = barcodeString[i]
            const charCode = char.charCodeAt(0)
            
            const patterns = [
              [3, 1, 2, 1], [2, 2, 2, 2], [1, 3, 1, 3], [2, 1, 3, 1], [1, 2, 1, 4]
            ]
            
            const pattern = patterns[charCode % patterns.length]
            
            pattern.forEach((width, patternIndex) => {
              const isBlack = patternIndex % 2 === 0
              bars.push(
                <div
                  key={`char-${i}-${patternIndex}`}
                  className={isBlack ? 'bg-black' : 'bg-white'}
                  style={{ width: `${width}px`, height: '36px' }}
                />
              )
            })
            
            if (i < Math.min(barcodeString.length - 1, 14)) {
              bars.push(
                <div key={`sep-${i}`} className="bg-white" style={{ width: '1px', height: '36px' }} />
              )
            }
          }
          
          // Create end pattern
          bars.push(
            <div key="end1" className="bg-black" style={{ width: '2px', height: '36px' }} />,
            <div key="end2" className="bg-white" style={{ width: '1px', height: '36px' }} />,
            <div key="end3" className="bg-black" style={{ width: '2px', height: '36px' }} />
          )
          
          return bars
        })()}
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
          Barcode Management
          {requiresSizes && (
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Size Variants: {productSizes.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          
          {/* Main Product Barcode */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              {requiresSizes ? 'Master Product Barcode' : 'Product Barcode'}
            </h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => onBarcodeChange(e.target.value)}
                    placeholder="Barcode value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateBarcodeFromSKU}
                    disabled={!sku}
                    title="Generate barcode from SKU"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcodeType">Barcode Type</Label>
                <select
                  id="barcodeType"
                  value={barcodeType}
                  onChange={(e) => onBarcodeTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CODE128">CODE128 (Recommended)</option>
                  <option value="EAN13">EAN13</option>
                  <option value="UPC">UPC</option>
                  <option value="CODE39">CODE39</option>
                </select>
              </div>
            </div>

            {/* Main Barcode Preview */}
            {barcode && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h5 className="font-medium text-gray-900 mb-3">Main Product Barcode</h5>
                <BarcodeVisualization barcodeValue={barcode} />
                <div className="text-sm text-gray-600 mt-2">Type: {barcodeType}</div>
              </div>
            )}
          </div>

          {/* Size Variant Barcodes */}
          {requiresSizes && productSizes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Size Variant Barcodes</h4>
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
                    <strong>Size Variant Tracking:</strong> Each size gets its own unique barcode for individual inventory tracking.
                    This allows you to scan and track stock levels for each size separately.
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {productSizes.map((size, index) => {
                    // Generate readable size barcodes with suffix format
                    const sizeBarcode = generateBarcodeWithType(barcodeType, undefined, size.size)
                    const displaySku = `${sku}-${size.size.toUpperCase()}`
                    
                    return (
                      <BarcodeVisualization
                        key={index}
                        barcodeValue={sizeBarcode}
                        label={`Size ${size.size} (${displaySku})`}
                      />
                    )
                  })}
                </div>

                <div className="mt-4 p-3 bg-white rounded border">
                  <h6 className="font-medium text-gray-800 mb-2">Size Barcode Format:</h6>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Base Product:</strong> {sku}</div>
                    <div><strong>Size Variants:</strong></div>
                    <div className="ml-4 space-y-1 font-mono text-xs">
                      {productSizes.map(size => (
                        <div key={size.size}>• {sku}-{size.size.toUpperCase()}</div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <strong>Usage:</strong> Scan size-specific barcodes for individual inventory tracking
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Generation Options */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 mb-2">Auto-Generate Barcode</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Generate unique barcodes automatically from your product SKU for inventory tracking.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const generated = generateBarcodeWithType('CODE128')
                      if (generated) onBarcodeGenerated(generated, 'CODE128')
                    }}
                    disabled={!sku}
                  >
                    Generate CODE128
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const generated = generateBarcodeWithType('EAN13')
                      if (generated) onBarcodeGenerated(generated, 'EAN13')
                    }}
                    disabled={!sku}
                  >
                    Generate EAN13
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const generated = generateBarcodeWithType('UPC')
                      if (generated) onBarcodeGenerated(generated, 'UPC')
                    }}
                    disabled={!sku}
                  >
                    Generate UPC
                  </Button>
                </div>
              </div>
            </div>
          </div>

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

          {/* Barcode Type Information */}
          <div className="text-xs text-gray-600">
            {barcodeType === 'CODE128' && (
              <div className="bg-blue-50 p-3 rounded">
                <strong>CODE128:</strong> Perfect for readable size variants like "{sku}-XS", "{sku}-M", "{sku}-L", "{sku}-XL".
                Maintains human-readable format while supporting barcode scanning. Ideal for size tracking.
              </div>
            )}
            {barcodeType === 'EAN13' && (
              <div className="bg-green-50 p-3 rounded">
                <strong>EAN13:</strong> 13-digit international standard. Each size gets a unique EAN13 for retail systems.
                Check digit automatically calculated for validation.
              </div>
            )}
            {barcodeType === 'UPC' && (
              <div className="bg-yellow-50 p-3 rounded">
                <strong>UPC:</strong> 12-digit US retail standard. Perfect for size variants in North American retail.
                Each size receives its own valid UPC with check digit.
              </div>
            )}
            {barcodeType === 'CODE39' && (
              <div className="bg-purple-50 p-3 rounded">
                <strong>CODE39:</strong> Simple format supporting size codes. Works well with basic barcode scanners.
                Clear size identification in the barcode itself.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}