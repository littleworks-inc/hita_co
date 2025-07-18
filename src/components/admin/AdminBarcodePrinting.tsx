import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Printer, 
  Download, 
  Tag, 
  Package, 
  Settings,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Grid3X3,
  Copy,
  RefreshCw,
  Plus,
  Minus,
  Eye
} from 'lucide-react'

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
  // Can be used as standalone component or with pre-loaded products
  products?: Product[]
  singleProduct?: Product
  mode?: 'single' | 'batch' | 'all'
}

// Label size configurations
const LABEL_SIZES = {
  '30x20': { width: 30, height: 20, name: '30×20mm (Small)', description: 'Jewelry, small items' },
  '40x30': { width: 40, height: 30, name: '40×30mm (Medium)', description: 'Accessories, cards' },
  '50x30': { width: 50, height: 30, name: '50×30mm (Standard)', description: 'Most retail items' },
  '60x40': { width: 60, height: 40, name: '60×40mm (Large)', description: 'Clothing, larger items' },
  '70x50': { width: 70, height: 50, name: '70×50mm (Extra Large)', description: 'Detailed information' },
  '100x50': { width: 100, height: 50, name: '100×50mm (Wide)', description: 'Maximum information' }
}

const PRINT_DENSITIES = {
  '203': { dpi: 203, name: '203 DPI (Standard)' },
  '300': { dpi: 300, name: '300 DPI (High Quality)' },
  '600': { dpi: 600, name: '600 DPI (Ultra High)' }
}

const AdminBarcodePrinting: React.FC<AdminBarcodePrintingProps> = ({
  products = [],
  singleProduct,
  mode = 'batch'
}) => {
  // State management
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [showBarcodesOnly, setShowBarcodesOnly] = useState(false)
  
  // Print settings
  const [labelSize, setLabelSize] = useState('50x30')
  const [printDensity, setPrintDensity] = useState('203')
  const [copies, setCopies] = useState(1)
  const [includeProductName, setIncludeProductName] = useState(true)
  const [includePrice, setIncludePrice] = useState(true)
  const [includeSku, setIncludeSku] = useState(true)
  const [includeCategory, setIncludeCategory] = useState(false)
  const [includeSizes, setIncludeSizes] = useState(false)
  const [customText, setCustomText] = useState('')
  
  // Status
  const [printStatus, setPrintStatus] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // If single product mode, auto-select it
  useEffect(() => {
    if (mode === 'single' && singleProduct) {
      setSelectedProducts([singleProduct.id])
    }
  }, [mode, singleProduct])

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !categoryFilter || product.category.name === categoryFilter
    const matchesStock = !showInStockOnly || product.stockQuantity > 0
    const matchesBarcode = !showBarcodesOnly || product.barcode
    
    return matchesSearch && matchesCategory && matchesStock && matchesBarcode
  })

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category.name)))

  // Selected product data
  const selectedProductData = filteredProducts.filter(p => selectedProducts.includes(p.id))

  // Generate ZPL code for thermal printers
  const generateZPLCode = (product: Product): string => {
    const labelDimensions = LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES]
    const dpi = PRINT_DENSITIES[printDensity as keyof typeof PRINT_DENSITIES].dpi

    // Convert mm to dots (1mm = dpi/25.4)
    const mmToDots = (mm: number) => Math.round((mm * dpi) / 25.4)
    const width = mmToDots(labelDimensions.width)
    const height = mmToDots(labelDimensions.height)

    let zpl = `^XA\n` // Start of label
    zpl += `^LH0,0\n` // Label home position
    zpl += `^LL${height}\n` // Label length

    let yPos = 20
    const centerX = Math.floor(width / 2)

    // Product name
    if (includeProductName && product.name) {
      const maxNameLength = labelSize === '30x20' ? 15 : labelSize === '40x30' ? 20 : 25
      const displayName = product.name.length > maxNameLength 
        ? product.name.substring(0, maxNameLength) + '...'
        : product.name
      zpl += `^FO${centerX - 100},${yPos}^A0N,25,25^FD${displayName}^FS\n`
      yPos += 40
    }

    // Barcode
    if (product.barcode) {
      zpl += `^FO${centerX - 100},${yPos}^BY2^BCN,40,Y,N,N^FD${product.barcode}^FS\n`
      yPos += 60
    }

    // SKU
    if (includeSku && product.sku) {
      zpl += `^FO${centerX - 80},${yPos}^A0N,20,20^FDSKU: ${product.sku}^FS\n`
      yPos += 30
    }

    // Price
    if (includePrice) {
      zpl += `^FO${centerX - 60},${yPos}^A0N,30,30^FD$${product.sellingPriceUSD.toFixed(2)}^FS\n`
      yPos += 40
    }

    // Category
    if (includeCategory && product.category.name) {
      zpl += `^FO${centerX - 50},${yPos}^A0N,18,18^FD${product.category.name}^FS\n`
      yPos += 25
    }

    // Size information
    if (includeSizes && product.requiresSizes && product.productSizes?.length) {
      const sizeText = product.productSizes.map(s => s.size).join(', ')
      const truncatedSizes = sizeText.length > 20 ? sizeText.substring(0, 20) + '...' : sizeText
      zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FDSizes: ${truncatedSizes}^FS\n`
      yPos += 25
    }

    // Custom text
    if (customText && customText.trim()) {
      zpl += `^FO${centerX - 80},${yPos}^A0N,18,18^FD${customText}^FS\n`
    }

    zpl += `^XZ\n` // End of label
    return zpl
  }

  // Print via web browser
  const printWebLabel = async (product: Product): Promise<void> => {
    return new Promise((resolve) => {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        resolve()
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode Label - ${product.name}</title>
            <style>
              @page { margin: 0; size: ${LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].width}mm ${LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].height}mm; }
              body { 
                margin: 0; 
                padding: 8px; 
                font-family: Arial, sans-serif; 
                text-align: center;
                font-size: ${labelSize === '30x20' ? '8' : labelSize === '40x30' ? '10' : '12'}px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                height: 100vh;
              }
              .product-name { font-weight: bold; margin-bottom: 4px; }
              .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 20px; margin: 4px 0; }
              .barcode-number { font-family: monospace; font-size: 8px; margin-bottom: 4px; }
              .product-info { margin: 2px 0; }
              .price { font-weight: bold; color: #059669; }
              @media print { body { margin: 0; padding: 4px; } }
            </style>
          </head>
          <body>
            ${includeProductName ? `<div class="product-name">${product.name}</div>` : ''}
            <div class="barcode">${product.barcode || product.sku}</div>
            <div class="barcode-number">${product.barcode || product.sku}</div>
            ${includeSku ? `<div class="product-info">SKU: ${product.sku}</div>` : ''}
            ${includePrice ? `<div class="price">$${product.sellingPriceUSD.toFixed(2)}</div>` : ''}
            ${includeCategory ? `<div class="product-info">${product.category.name}</div>` : ''}
            ${includeSizes && product.requiresSizes && product.productSizes?.length ? 
              `<div class="product-info">Sizes: ${product.productSizes.map(s => s.size).join(', ')}</div>` : ''}
            ${customText ? `<div class="product-info">${customText}</div>` : ''}
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

  // Print selected labels
  const printLabels = async () => {
    if (selectedProductData.length === 0) {
      setPrintStatus('Please select at least one product to print')
      return
    }

    setIsPrinting(true)
    setPrintStatus('Preparing labels...')

    try {
      let totalLabels = 0

      for (const product of selectedProductData) {
        for (let copy = 1; copy <= copies; copy++) {
          setPrintStatus(`Printing ${product.name} (${copy}/${copies})...`)
          await printWebLabel(product)
          totalLabels++
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      setPrintStatus(`Successfully printed ${totalLabels} labels!`)
      setTimeout(() => setPrintStatus(''), 3000)

    } catch (error) {
      console.error('Print error:', error)
      setPrintStatus('Print failed. Please check your printer connection.')
    } finally {
      setIsPrinting(false)
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
    link.download = `barcode-labels-${new Date().toISOString().split('T')[0]}.zpl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setPrintStatus(`Downloaded ZPL file for ${selectedProductData.length * copies} labels`)
    setTimeout(() => setPrintStatus(''), 3000)
  }

  // Copy barcode
  const copyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode)
    setPrintStatus(`Copied barcode: ${barcode}`)
    setTimeout(() => setPrintStatus(''), 2000)
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
              {mode === 'single' ? 'Print Product Label' : 'Barcode Label Printing'}
            </h1>
            <p className="text-gray-600">
              {mode === 'single' 
                ? 'Print barcode labels for this product'
                : 'Select products and print professional barcode labels'
              }
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
          {isPrinting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{printStatus}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          
          {mode !== 'single' && (
            <>
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Product Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Search */}
                  <div>
                    <Label htmlFor="search">Search Products</Label>
                    <Input
                      id="search"
                      placeholder="Search by name, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Filters</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={showInStockOnly}
                            onChange={(e) => setShowInStockOnly(e.target.checked)}
                          />
                          <span className="text-sm">In stock only</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={showBarcodesOnly}
                            onChange={(e) => setShowBarcodesOnly(e.target.checked)}
                          />
                          <span className="text-sm">Has barcode only</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions */}
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
            </>
          )}

          {/* Product List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === 'single' ? 'Product Details' : `Products (${filteredProducts.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(mode === 'single' ? [singleProduct].filter(Boolean) : filteredProducts).map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProducts.includes(product.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => mode !== 'single' && toggleProductSelection(product.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {product.sku}
                        {product.barcode && (
                          <span className="ml-2">
                            Barcode: {product.barcode}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyBarcode(product.barcode)
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <Copy className="h-3 w-3 inline" />
                            </button>
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        ${product.sellingPriceUSD.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">
                        Stock: {product.stockQuantity}
                      </Badge>
                      {product.requiresSizes && (
                        <Badge variant="secondary" className="text-xs">
                          Sizes: {product.productSizes?.length || 0}
                        </Badge>
                      )}
                      {!product.barcode && (
                        <Badge variant="destructive" className="text-xs">
                          No Barcode
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredProducts.length === 0 && mode !== 'single' && (
                  <div className="text-center py-8 text-gray-500">
                    No products found matching your criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Print Settings */}
        <div className="lg:col-span-2 space-y-4">
          
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
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="copies"
                    type="number"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="10"
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCopies(Math.min(10, copies + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* What to Include */}
              <div>
                <Label>Include on Label</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
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
                <div><strong>Web Print:</strong> Opens print dialogs for desktop printers</div>
                <div><strong>ZPL Download:</strong> For thermal printers (Zebra, Datamax, etc.)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminBarcodePrinting