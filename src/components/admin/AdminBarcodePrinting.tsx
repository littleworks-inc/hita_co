// src/components/admin/AdminBarcodePrinting.tsx
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed format selection
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Printer,
  Download,
  Settings,
  Search,
  Filter,
  Package,
  Tag,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Copy
} from 'lucide-react'
// Removed Checkbox import - using standard HTML input instead

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  sellingPriceUSD: number
  stockQuantity: number
  category: { name: string }
  requiresSizes: boolean
  productSizes?: Array<{
    id: string
    size: string
    sku: string
    stockQuantity: number
  }>
}

interface AdminBarcodePrintingProps {
  products: Product[]
  categories: string[]
  mode?: 'bulk' | 'single'
  singleProduct?: Product
}

// Label size configurations
const LABEL_SIZES = {
  '30x20': { width: 30, height: 20, name: '30×20mm (Small)', description: 'Compact labels' },
  '40x30': { width: 40, height: 30, name: '40×30mm (Medium)', description: 'Standard retail' },
  '50x30': { width: 50, height: 30, name: '50×30mm (Standard)', description: 'Most common' },
  '60x40': { width: 60, height: 40, name: '60×40mm (Large)', description: 'Easy to scan' },
  '70x50': { width: 70, height: 50, name: '70×50mm (Extra Large)', description: 'High visibility' },
  '100x50': { width: 100, height: 50, name: '100×50mm (Wide)', description: 'Maximum info' }
}

const PRINT_DENSITIES = {
  '203': { dpi: 203, name: '203 DPI (Standard)' },
  '300': { dpi: 300, name: '300 DPI (High Quality)' },
  '600': { dpi: 600, name: '600 DPI (Ultra High)' }
}

export default function AdminBarcodePrinting({
  products,
  categories,
  mode = 'bulk',
  singleProduct
}: AdminBarcodePrintingProps) {
  // Product selection and filtering
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [hasBarcode, setHasBarcode] = useState(false)

  // Print settings - CODE128 is hardcoded
  const [labelSize, setLabelSize] = useState('50x30')
  const [printDensity, setPrintDensity] = useState('300')
  const [copies, setCopies] = useState(1)
  const [includeProductName, setIncludeProductName] = useState(true)
  const [includePrice, setIncludePrice] = useState(true)
  const [includeSku, setIncludeSku] = useState(true)
  const [includeCategory, setIncludeCategory] = useState(false)
  const [includeSizes, setIncludeSizes] = useState(false)
  const [customText, setCustomText] = useState('')

  // Status and operations
  const [isPrinting, setIsPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState('')

  // Initialize selection for single product mode
  useEffect(() => {
    if (mode === 'single' && singleProduct) {
      setSelectedProducts([singleProduct.id])
    }
  }, [mode, singleProduct])

  // Filter products based on search criteria
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || product.category.name === selectedCategory
    const matchesStock = !inStockOnly || product.stockQuantity > 0
    const matchesBarcode = !hasBarcode || product.barcode

    return matchesSearch && matchesCategory && matchesStock && matchesBarcode
  })

  // Get selected product data
  const selectedProductData = filteredProducts.filter(p => selectedProducts.includes(p.id))

  // Generate ZPL code for thermal printers (CODE128 only)
  const generateZPLCode = (product: Product): string => {
    const labelDimensions = LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES]
    const dpi = PRINT_DENSITIES[printDensity as keyof typeof PRINT_DENSITIES].dpi

    // Convert mm to dots
    const mmToDots = (mm: number) => Math.round((mm * dpi) / 25.4)
    const width = mmToDots(labelDimensions.width)
    const height = mmToDots(labelDimensions.height)

    let zpl = `^XA\n`
    zpl += `^LH0,0\n`
    zpl += `^LL${height}\n`

    let yPos = 20
    const centerX = Math.floor(width / 2)

    // Product name
    if (includeProductName && product.name) {
      const maxNameLength = labelSize === '30x20' ? 15 : labelSize === '40x30' ? 20 : 25
      const displayName = product.name.length > maxNameLength 
        ? product.name.substring(0, maxNameLength) + '...' 
        : product.name
      zpl += `^FO${centerX - 80},${yPos}^A0N,20,20^FD${displayName}^FS\n`
      yPos += 30
    }

    // CODE128 Barcode (hardcoded format)
    const barcodeData = product.barcode || product.sku
    const barcodeWidth = labelSize === '30x20' ? width - 20 : width - 40
    const barcodeHeight = Math.min(60, height - yPos - 40)
    
    zpl += `^FO${centerX - Math.floor(barcodeWidth/2)},${yPos}^BCN,${barcodeHeight},Y,N,N^FD${barcodeData}^FS\n`
    yPos += barcodeHeight + 10

    // Price
    if (includePrice) {
      zpl += `^FO${centerX - 40},${yPos}^A0N,18,18^FD$${product.sellingPriceUSD.toFixed(2)}^FS\n`
      yPos += 25
    }

    // SKU
    if (includeSku) {
      zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FDSKU: ${product.sku}^FS\n`
      yPos += 20
    }

    // Category
    if (includeCategory) {
      zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FD${product.category.name}^FS\n`
      yPos += 20
    }

    // Sizes
    if (includeSizes && product.requiresSizes && product.productSizes?.length) {
      const sizeText = product.productSizes.map(s => s.size).join(', ')
      const truncatedSizes = sizeText.length > 20 ? sizeText.substring(0, 20) + '...' : sizeText
      zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FDSizes: ${truncatedSizes}^FS\n`
      yPos += 25
    }

    // Stock quantity
    zpl += `^FO${centerX - 40},${yPos}^A0N,16,16^FDStock: ${product.stockQuantity}^FS\n`
    yPos += 25

    // Custom text
    if (customText && customText.trim()) {
      zpl += `^FO${centerX - 80},${yPos}^A0N,18,18^FD${customText}^FS\n`
      yPos += 20
    }

    // Format indicator
    zpl += `^FO10,${height - 20}^A0N,12,12^FDCODE128^FS\n`

    zpl += `^XZ\n`
    return zpl
  }

  // Print labels using web browser
  const printLabels = async () => {
    if (selectedProductData.length === 0) {
      setPrintStatus('Please select at least one product to print')
      return
    }

    setIsPrinting(true)
    setPrintStatus(`Preparing ${selectedProductData.length * copies} CODE128 labels for printing...`)

    try {
      // Create print HTML
      let printContent = `<!DOCTYPE html>
<html>
<head>
<title>CODE128 Barcode Labels</title>
<style>
@page { margin: 0; size: ${LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].width}mm ${LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].height}mm; }
body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 8px; }
.label {
  width: ${LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].width}mm;
  height: ${LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].height}mm;
  padding: 2mm; box-sizing: border-box; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center;
  page-break-after: always; border: 1px solid #ddd; margin-bottom: 2mm;
}
.label:last-child { page-break-after: avoid; margin-bottom: 0; }
.name { font-weight: bold; font-size: 9px; margin-bottom: 1mm; max-height: 8mm; overflow: hidden; line-height: 1.1; }
.barcode { margin: 1mm 0; flex: 1; display: flex; align-items: center; justify-content: center; }
.info { font-size: 7px; margin: 0.5mm 0; color: #555; }
.price { font-weight: bold; color: #059669; font-size: 8px; }
.format { font-size: 6px; color: #6b7280; margin-top: 0.5mm; }
@media print { body { margin: 0; } .label { border: none; margin: 0; } }
</style>
</head>
<body>`

      // Generate labels for each selected product
      selectedProductData.forEach(product => {
        for (let copy = 1; copy <= copies; copy++) {
          const barcodeData = product.barcode || product.sku
          printContent += `
<div class="label">
  ${includeProductName ? `<div class="name">${product.name}</div>` : ''}
  <div class="barcode">
    <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: bold; border: 1px solid #000; padding: 2px 4px;">
      ${barcodeData}
    </div>
  </div>
  ${includeSku ? `<div class="info">SKU: ${product.sku}</div>` : ''}
  ${includePrice ? `<div class="price">$${product.sellingPriceUSD.toFixed(2)}</div>` : ''}
  ${includeCategory ? `<div class="info">${product.category.name}</div>` : ''}
  ${customText ? `<div class="info">${customText}</div>` : ''}
  <div class="format">CODE128</div>
</div>`
        }
      })

      printContent += `</body></html>`

      // Open print window
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
        
        setPrintStatus(`✅ ${selectedProductData.length * copies} CODE128 labels sent to printer`)
      } else {
        setPrintStatus('❌ Could not open print window - check popup blocker')
      }

    } catch (error) {
      console.error('Print error:', error)
      setPrintStatus('❌ Print failed - see console for details')
    } finally {
      setIsPrinting(false)
      setTimeout(() => setPrintStatus(''), 5000)
    }
  }

  // Download ZPL file
  const downloadZPLFile = () => {
    if (selectedProductData.length === 0) {
      setPrintStatus('Please select at least one product to download')
      return
    }

    let zplContent = ''
    selectedProductData.forEach(product => {
      for (let copy = 1; copy <= copies; copy++) {
        zplContent += generateZPLCode(product) + '\n\n'
      }
    })

    const blob = new Blob([zplContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `code128-labels-${new Date().toISOString().split('T')[0]}.zpl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setPrintStatus(`✅ Downloaded CODE128 ZPL file for ${selectedProductData.length * copies} labels`)
    setTimeout(() => setPrintStatus(''), 3000)
  }

  // Selection functions
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id))
  }

  const clearSelection = () => {
    setSelectedProducts([])
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Printer className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              CODE128 Barcode Label Printing
            </h1>
            <p className="text-gray-600">
              Generate professional CODE128 barcode labels for your products
            </p>
          </div>
        </div>
        
        {selectedProducts.length > 0 && (
          <Badge variant="secondary" className="px-3 py-1">
            {selectedProducts.length} selected
          </Badge>
        )}
      </div>

      {/* Status Alert */}
      {printStatus && (
        <Alert className={isPrinting ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className="flex items-center gap-2">
            {isPrinting ? (
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {printStatus}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters */}
          {mode === 'bulk' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Product Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Search */}
                <div>
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">In Stock Only</span>
                    </label>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hasBarcode}
                        onChange={(e) => setHasBarcode(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Has Barcode</span>
                    </label>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button onClick={selectAllProducts} variant="outline" size="sm">
                      Select All
                    </Button>
                    <Button onClick={clearSelection} variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProducts.includes(product.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          SKU: {product.sku} • ${product.sellingPriceUSD.toFixed(2)} • Stock: {product.stockQuantity}
                        </div>
                        {product.barcode && (
                          <div className="text-xs text-gray-500 font-mono">
                            Barcode: {product.barcode} (CODE128)
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{product.category.name}</Badge>
                        {selectedProducts.includes(product.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products found matching your criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Print Settings */}
        <div className="space-y-4">
          
          {/* Barcode Format Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Barcode Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Format: CODE128</div>
                  <div className="text-xs text-blue-700 mt-1">
                    Universal format supporting letters, numbers & symbols. 
                    Most compatible with all barcode scanners.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Label Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Label Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Label Size */}
              <div>
                <Label htmlFor="labelSize">Label Size</Label>
                <select
                  id="labelSize"
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(LABEL_SIZES).map(([key, size]) => (
                    <option key={key} value={key}>
                      {size.name} - {size.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print Quality */}
              <div>
                <Label htmlFor="printDensity">Print Quality</Label>
                <select
                  id="printDensity"
                  value={printDensity}
                  onChange={(e) => setPrintDensity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(PRINT_DENSITIES).map(([key, density]) => (
                    <option key={key} value={key}>{density.name}</option>
                  ))}
                </select>
              </div>

              {/* Copies */}
              <div>
                <Label htmlFor="copies">Number of Copies</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    disabled={copies <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="copies"
                    type="number"
                    min="1"
                    max="50"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCopies(Math.min(50, copies + 1))}
                    disabled={copies >= 50}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Include Options */}
              <div>
                <Label>Include on Label</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeProductName}
                      onChange={(e) => setIncludeProductName(e.target.checked)}
                    />
                    <span className="text-sm">Product Name</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includePrice}
                      onChange={(e) => setIncludePrice(e.target.checked)}
                    />
                    <span className="text-sm">Price</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeSku}
                      onChange={(e) => setIncludeSku(e.target.checked)}
                    />
                    <span className="text-sm">SKU</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeCategory}
                      onChange={(e) => setIncludeCategory(e.target.checked)}
                    />
                    <span className="text-sm">Category</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeSizes}
                      onChange={(e) => setIncludeSizes(e.target.checked)}
                    />
                    <span className="text-sm">Sizes</span>
                  </label>
                </div>
              </div>

              {/* Custom Text */}
              <div>
                <Label htmlFor="customText">Custom Text</Label>
                <Textarea
                  id="customText"
                  placeholder="Add custom text to labels..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Print Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Print Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* Quick Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div>Selected: {selectedProducts.length} products</div>
                  <div>Total labels: {selectedProducts.length * copies}</div>
                  <div>Label size: {LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].name}</div>
                  <div>Format: CODE128</div>
                </div>
              </div>

              {/* Print Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={printLabels}
                  className="w-full"
                  disabled={selectedProducts.length === 0 || isPrinting}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print Labels (Web)'}
                </Button>

                <Button
                  onClick={downloadZPLFile}
                  variant="outline"
                  className="w-full"
                  disabled={selectedProducts.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download ZPL (Thermal)
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-gray-500 mt-4">
                <div><strong>Web Print:</strong> Opens print dialog for desktop printers</div>
                <div><strong>ZPL Download:</strong> For thermal printers (Zebra, etc.)</div>
                <div><strong>CODE128:</strong> Universal barcode format</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}