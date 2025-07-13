// src/app/exhibition/[id]/barcode-labels/page.tsx
// =====================================
// 🚀 Exhibition Barcode Labels Page
// Print thermal labels for exhibition products
// =====================================

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
  availableStock: number
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
  categories: string[]
  stats: {
    totalProducts: number
    inStockProducts: number
    productsWithBarcodes: number
    categoriesCount: number
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

// Print Density Options
const PRINT_DENSITIES = {
  '203': { dpi: 203, name: '203 DPI (Standard)' },
  '300': { dpi: 300, name: '300 DPI (High Quality)' },
  '600': { dpi: 600, name: '600 DPI (Ultra High)' }
}

interface BarcodeLabelPageProps {
  params: {
    id: string
  }
}

export default function ExhibitionBarcodeLabelPage({ params }: BarcodeLabelPageProps) {
  const router = useRouter()
  const [productsData, setProductsData] = useState<ProductsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Selection and filtering
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [hasBarcode, setHasBarcode] = useState(false)

  // Label settings
  const [labelSize, setLabelSize] = useState('50x30')
  const [printDensity, setPrintDensity] = useState('203')
  const [copies, setCopies] = useState(1)
  const [includeProductName, setIncludeProductName] = useState(true)
  const [includePrice, setIncludePrice] = useState(true)
  const [includeSku, setIncludeSku] = useState(true)
  const [includeCategory, setIncludeCategory] = useState(false)
  const [customText, setCustomText] = useState('')

  // Printing states
  const [isPrinting, setIsPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState('')

  // Load exhibition products data
  useEffect(() => {
    loadProductsData()
  }, [params.id, inStockOnly, hasBarcode, categoryFilter])

  const loadProductsData = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      if (categoryFilter) queryParams.append('category', categoryFilter)
      if (inStockOnly) queryParams.append('inStock', 'true')
      if (hasBarcode) queryParams.append('hasBarcode', 'true')

      const response = await fetch(`/api/exhibition/${params.id}/barcode-labels?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to load exhibition products')
      }

      const data: ProductsData = await response.json()
      setProductsData(data)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter products based on search query
  const filteredProducts = productsData?.products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  }) || []

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Select all filtered products
  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedProducts([])
  }

  // Generate and print labels
  const printLabels = async () => {
    if (selectedProducts.length === 0) {
      setPrintStatus('Please select at least one product to print')
      return
    }

    setIsPrinting(true)
    setPrintStatus('Generating labels...')

    try {
      const labelRequest = {
        productIds: selectedProducts,
        labelSize,
        printDensity,
        copies,
        includeProductName,
        includePrice,
        includeSku,
        includeCategory,
        customText
      }

      const response = await fetch(`/api/exhibition/${params.id}/barcode-labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labelRequest)
      })

      if (!response.ok) {
        throw new Error('Failed to generate labels')
      }

      const result = await response.json()
      
      setPrintStatus(`Successfully generated ${result.stats.totalLabels} labels!`)
      
      // Trigger browser print for each product
      await printWebLabels(result.products, labelRequest)
      
      // Clear status after success
      setTimeout(() => {
        setPrintStatus('')
        setSelectedProducts([]) // Clear selection after successful print
      }, 3000)

    } catch (err: any) {
      setPrintStatus(`Print failed: ${err.message}`)
    } finally {
      setIsPrinting(false)
    }
  }

  // Print web-friendly labels
  const printWebLabels = async (products: ExhibitionProduct[], settings: any) => {
    const selectedProductData = products.filter(p => selectedProducts.includes(p.id))
    
    for (const product of selectedProductData) {
      for (let copy = 1; copy <= copies; copy++) {
        await printSingleLabel(product, settings)
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  // Print single label
  const printSingleLabel = async (product: ExhibitionProduct, settings: any) => {
    return new Promise<void>((resolve) => {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        resolve()
        return
      }

      const labelDimensions = LABEL_SIZES[settings.labelSize as keyof typeof LABEL_SIZES]

      printWindow.document.write(`
        <html>
          <head>
            <title>Thermal Label - ${product.name}</title>
            <style>
              @page {
                size: ${labelDimensions.width}mm ${labelDimensions.height}mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 2mm;
                font-family: Arial, sans-serif;
                font-size: 8pt;
                width: ${labelDimensions.width - 4}mm;
                height: ${labelDimensions.height - 4}mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                text-align: center;
                box-sizing: border-box;
              }
              .product-name {
                font-weight: bold;
                font-size: 9pt;
                margin-bottom: 1mm;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .barcode-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              .barcode {
                font-family: 'Courier New', monospace;
                font-size: 6pt;
                letter-spacing: 1px;
                border: 1px solid #000;
                padding: 1mm;
                background: linear-gradient(90deg, #000 1px, #fff 1px, #fff 2px, #000 2px);
                background-size: 4px 100%;
                height: 8mm;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 1mm 0;
              }
              .barcode-number {
                font-family: monospace;
                font-size: 6pt;
                margin-top: 1mm;
              }
              .product-info {
                font-size: 7pt;
                margin: 0.5mm 0;
              }
              .price {
                font-weight: bold;
                font-size: 10pt;
                margin: 1mm 0;
              }
              .discount-badge {
                background: #ef4444;
                color: white;
                padding: 1mm;
                border-radius: 2mm;
                font-size: 6pt;
                font-weight: bold;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${settings.includeProductName ? `<div class="product-name">${product.name}</div>` : ''}
            <div class="barcode-container">
              <div class="barcode">${product.barcode}</div>
              <div class="barcode-number">${product.barcode}</div>
            </div>
            <div class="product-details">
              ${settings.includeSku ? `<div class="product-info">SKU: ${product.sku}</div>` : ''}
              ${settings.includePrice ? `
                <div class="price">
                  ${product.hasDiscount ? `
                    <span style="text-decoration: line-through; color: #666; font-size: 8pt;">$${product.price.toFixed(2)}</span>
                    <span style="color: #ef4444;">$${product.finalPrice.toFixed(2)}</span>
                  ` : `$${product.finalPrice.toFixed(2)}`}
                </div>
                ${product.hasDiscount ? `<div class="discount-badge">${product.discountPercentage}% OFF</div>` : ''}
              ` : ''}
              ${settings.includeCategory ? `<div class="product-info">${product.category}</div>` : ''}
              ${settings.customText ? `<div class="product-info">${settings.customText}</div>` : ''}
            </div>
          </body>
        </html>
      `)

      printWindow.document.close()

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
          resolve()
        }, 500)
      }
    })
  }

  // Download ZPL file
  const downloadZPLFile = async () => {
    if (selectedProducts.length === 0) {
      setPrintStatus('Please select at least one product to download')
      return
    }

    try {
      const labelRequest = {
        productIds: selectedProducts,
        labelSize,
        printDensity,
        copies,
        includeProductName,
        includePrice,
        includeSku,
        includeCategory,
        customText
      }

      const response = await fetch(`/api/exhibition/${params.id}/barcode-labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labelRequest)
      })

      if (!response.ok) {
        throw new Error('Failed to generate ZPL file')
      }

      const result = await response.json()
      
      // Create and download ZPL file
      const blob = new Blob([result.combinedZPL], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${productsData?.exhibition.title}-labels-${new Date().toISOString().split('T')[0]}.zpl`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setPrintStatus(`Downloaded ZPL file for ${result.stats.totalLabels} labels`)
      setTimeout(() => setPrintStatus(''), 3000)

    } catch (err: any) {
      setPrintStatus(`Download failed: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading exhibition products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!productsData) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Printer className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barcode Labels</h1>
            <p className="text-gray-600">{productsData.exhibition.title}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{productsData.stats.totalProducts}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{productsData.stats.inStockProducts}</div>
            <div className="text-sm text-gray-600">In Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{productsData.stats.productsWithBarcodes}</div>
            <div className="text-sm text-gray-600">With Barcodes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{selectedProducts.length}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Products ({selectedProducts.length} of {filteredProducts.length} selected)
              </CardTitle>
              
              {/* Search and Filters */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search products, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    disabled={!searchQuery}
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">All Categories</option>
                    {productsData.categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded text-sm">
                    <input 
                      type="checkbox" 
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded"
                    />
                    In Stock Only
                  </label>

                  <label className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded text-sm">
                    <input 
                      type="checkbox" 
                      checked={hasBarcode}
                      onChange={(e) => setHasBarcode(e.target.checked)}
                      className="rounded"
                    />
                    Has Barcode
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllProducts}
                    disabled={selectedProducts.length === filteredProducts.length || filteredProducts.length === 0}
                  >
                    Select All ({filteredProducts.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSelection}
                    disabled={selectedProducts.length === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No products found matching your filters</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProducts.includes(product.id) 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500 space-x-2">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span>Barcode: {product.barcode}</span>
                            <span>•</span>
                            <span>Stock: {product.availableStock}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {product.hasDiscount ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 line-through">${product.price.toFixed(2)}</span>
                                <span className="text-sm font-medium text-red-600">${product.finalPrice.toFixed(2)}</span>
                                <Badge variant="destructive" className="text-xs">{product.discountPercentage}% OFF</Badge>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">${product.finalPrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                          {product.availableStock === 0 && (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* Label Settings */}
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
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(LABEL_SIZES).map(([key, size]) => (
                    <option key={key} value={key}>{size.name}</option>
                  ))}
                </select>
              </div>

              {/* Print Density */}
              <div>
                <Label htmlFor="printDensity">Print Quality</Label>
                <select 
                  id="printDensity"
                  value={printDensity} 
                  onChange={(e) => setPrintDensity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(PRINT_DENSITIES).map(([key, density]) => (
                    <option key={key} value={key}>{density.name}</option>
                  ))}
                </select>
              </div>

              {/* Copies */}
              <div>
                <Label htmlFor="copies">Copies per Product</Label>
                <Input
                  id="copies"
                  type="number"
                  min="1"
                  max="99"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Label Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Label Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
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
                  <span className="text-sm">Price (with discounts)</span>
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

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button 
                onClick={printLabels}
                className="w-full"
                disabled={selectedProducts.length === 0 || isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                {isPrinting ? 'Printing...' : `Print ${selectedProducts.length * copies} Labels`}
              </Button>

              <Button 
                onClick={downloadZPLFile}
                variant="outline"
                className="w-full"
                disabled={selectedProducts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download ZPL File
              </Button>

              <div className="text-xs text-gray-500 text-center">
                Total labels: {selectedProducts.length * copies}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Messages */}
      {printStatus && (
        <Alert className={isPrinting ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{printStatus}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Thermal Printer Setup</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">For Direct ZPL Printing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Download the ZPL file using the button above</li>
                <li>Send the ZPL file directly to your thermal printer</li>
                <li>Compatible with Zebra, Datamax, Honeywell printers</li>
                <li>Connect via USB, Network, or Bluetooth</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Web Browser Printing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Print Labels" button</li>
                <li>Each label opens in a new window</li>
                <li>Set printer to correct label size</li>
                <li>Use 0 margins for best results</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm"><strong>💡 Tip:</strong> Test with a few labels first to ensure proper alignment. Different printers may require slight adjustments to the label size settings.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}