// src/app/exhibition/[id]/barcode-labels/page.tsx
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed multiple format options
// Print thermal labels for exhibition products

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Printer, 
  Download, 
  Settings, 
  Tag, 
  Package, 
  AlertCircle, 
  CheckCircle,
  Search,
  Filter,
  Grid3X3,
  RefreshCw
} from 'lucide-react'

interface ExhibitionProduct {
  id: string
  name: string
  sku: string
  barcode: string
  price: number
  finalPrice: number
  category: string
  quantityTaken: number
  quantitySold: number
  available: number
  exhibitionPrice?: number
  hasDiscount: boolean
  discountPercentage: number
  canPrint: boolean
}

interface Exhibition {
  id: string
  title: string
}

interface ProductsData {
  exhibition: Exhibition
  products: ExhibitionProduct[]
  stats: {
    totalProducts: number
    productsWithBarcodes: number
    barcodeFormat: string
  }
}

// Thermal Label Sizes (in mm)
const LABEL_SIZES = {
  '30x20': { width: 30, height: 20, name: '30×20mm (Small)' },
  '40x30': { width: 40, height: 30, name: '40×30mm (Medium)' },
  '50x30': { width: 50, height: 30, name: '50×30mm (Standard)' },
  '60x40': { width: 60, height: 40, name: '60×40mm (Large)' },
  '70x50': { width: 70, height: 50, name: '70×50mm (Extra Large)' },
  '100x50': { width: 100, height: 50, name: '100×50mm (Wide)' }
}

const PRINT_DENSITIES = {
  '203': { dpi: 203, name: '203 DPI (Standard)' },
  '300': { dpi: 300, name: '300 DPI (High Quality)' },
  '600': { dpi: 600, name: '600 DPI (Ultra High)' }
}

export default function ExhibitionBarcodeLabelsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<ProductsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Product selection and filtering
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Print settings - CODE128 is hardcoded
  const [labelSize, setLabelSize] = useState('50x30')
  const [printDensity, setPrintDensity] = useState('300')
  const [copies, setCopies] = useState(1)
  const [includeProductName, setIncludeProductName] = useState(true)
  const [includePrice, setIncludePrice] = useState(true)
  const [includeSku, setIncludeSku] = useState(true)
  const [includeCategory, setIncludeCategory] = useState(false)
  const [customText, setCustomText] = useState('')

  // Status and operations
  const [isPrinting, setIsPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState('')

  // Load exhibition products on mount
  useEffect(() => {
    loadExhibitionProducts()
  }, [params.id])

  const loadExhibitionProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/exhibition/${params.id}/barcode-labels`)
      if (!response.ok) {
        throw new Error('Failed to load exhibition products')
      }

      const productsData: ProductsData = await response.json()
      setData(productsData)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter products based on search
  const filteredProducts = data?.products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch && product.available > 0 // Only show available products
  }) || []

  // Get selected product data
  const selectedProductData = filteredProducts.filter(p => selectedProducts.includes(p.id))

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Select all products
  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedProducts([])
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
<title>Exhibition CODE128 Barcode Labels</title>
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
          printContent += `
<div class="label">
  ${includeProductName ? `<div class="name">${product.name}</div>` : ''}
  <div class="barcode">
    <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: bold; border: 1px solid #000; padding: 2px 4px;">
      ${product.barcode}
    </div>
  </div>
  ${includeSku ? `<div class="info">SKU: ${product.sku}</div>` : ''}
  ${includePrice ? `<div class="price">$${product.finalPrice.toFixed(2)}</div>` : ''}
  ${includeCategory ? `<div class="info">${product.category}</div>` : ''}
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

  // Download ZPL file for thermal printers
  const downloadZPLFile = async () => {
    if (selectedProductData.length === 0) {
      setPrintStatus('Please select at least one product to download')
      return
    }

    try {
      const response = await fetch(`/api/exhibition/${params.id}/barcode-labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          labelSize,
          copies,
          includeProductName,
          includePrice,
          includeSku,
          includeCategory,
          customText,
          printDensity
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate ZPL file')
      }

      const result = await response.json()
      
      if (result.success) {
        // Create and download the ZPL file
        const blob = new Blob([result.zplContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `exhibition-${params.id}-code128-labels-${new Date().toISOString().split('T')[0]}.zpl`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setPrintStatus(`✅ Downloaded CODE128 ZPL file for ${result.totalLabels} labels`)
      } else {
        throw new Error('Failed to generate labels')
      }

    } catch (error) {
      console.error('Download error:', error)
      setPrintStatus('❌ Download failed - see console for details')
    } finally {
      setTimeout(() => setPrintStatus(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading exhibition: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No exhibition data found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/exhibition/${params.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Exhibition
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                CODE128 Barcode Labels
              </h1>
              <p className="text-gray-600">
                {data.exhibition.title} • Generate professional barcode labels
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
          <Alert className={`mb-6 ${isPrinting ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
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
            
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Product Search
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

                {/* Selection Controls */}
                <div className="flex gap-2">
                  <Button onClick={selectAllProducts} variant="outline" size="sm">
                    Select All ({filteredProducts.length})
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Exhibition Products ({filteredProducts.length})
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
                            SKU: {product.sku} • ${product.finalPrice.toFixed(2)} • Available: {product.available}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            Barcode: {product.barcode} (CODE128)
                          </div>
                          {product.exhibitionPrice && (
                            <div className="text-xs text-green-600">
                              Exhibition Price: ${product.exhibitionPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{product.category}</Badge>
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
                        {size.name}
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
                  <Input
                    id="copies"
                    type="number"
                    min="1"
                    max="50"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  />
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
    </div>
  )
}