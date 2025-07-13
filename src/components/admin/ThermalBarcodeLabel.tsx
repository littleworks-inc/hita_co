import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Printer, 
  Download, 
  Settings, 
  Tag, 
  Package, 
  AlertCircle, 
  CheckCircle,
  Copy,
  RefreshCw,
  Zap,
  Grid3X3
} from 'lucide-react'

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

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  price: number
  category: string
}

interface ThermalBarcodeProps {
  products?: Product[]
  onPrintComplete?: (printedItems: number) => void
}

export default function ThermalBarcodeLabel({ products = [], onPrintComplete }: ThermalBarcodeProps) {
  // Basic states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [labelSize, setLabelSize] = useState('50x30')
  const [printDensity, setPrintDensity] = useState('203')
  const [copies, setCopies] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  
  // Label customization
  const [includeProductName, setIncludeProductName] = useState(true)
  const [includePrice, setIncludePrice] = useState(true)
  const [includeSku, setIncludeSku] = useState(true)
  const [includeCategory, setIncludeCategory] = useState(false)
  const [customText, setCustomText] = useState('')
  
  // Printing states
  const [isPrinting, setIsPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  
  // Canvas refs for preview
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Mock products if none provided
  const mockProducts: Product[] = [
    { id: '1', name: 'Blue Cotton T-Shirt', sku: 'HC-BLUE-001', barcode: '123456789012', price: 29.99, category: 'Clothing' },
    { id: '2', name: 'Red Summer Dress', sku: 'HC-RED-002', barcode: '123456789013', price: 49.99, category: 'Clothing' },
    { id: '3', name: 'Black Leather Jacket', sku: 'HC-BLACK-003', barcode: '123456789014', price: 129.99, category: 'Outerwear' },
    { id: '4', name: 'White Canvas Shoes', sku: 'HC-WHITE-004', barcode: '123456789015', price: 79.99, category: 'Footwear' },
  ]
  
  const displayProducts = products.length > 0 ? products : mockProducts
  
  // Generate label preview
  const generateLabelPreview = (product: Product) => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const labelDimensions = LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES]
    const scale = 4 // Scale for better preview quality
    
    // Set canvas size based on label dimensions
    canvas.width = labelDimensions.width * scale
    canvas.height = labelDimensions.height * scale
    
    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Set text properties
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    
    let yPosition = 20
    const centerX = canvas.width / 2
    const lineHeight = 24
    
    // Product name
    if (includeProductName && product.name) {
      ctx.font = 'bold 16px Arial'
      const maxWidth = canvas.width - 20
      const words = product.name.split(' ')
      let line = ''
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, centerX, yPosition)
          line = words[i] + ' '
          yPosition += lineHeight
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, centerX, yPosition)
      yPosition += lineHeight + 10
    }
    
    // Barcode simulation (simple bars)
    const barcodeHeight = 40
    const barcodeWidth = canvas.width - 40
    const startX = 20
    
    ctx.fillStyle = '#000000'
    for (let i = 0; i < product.barcode.length; i++) {
      const barWidth = Math.floor(barcodeWidth / product.barcode.length)
      const x = startX + (i * barWidth)
      const height = parseInt(product.barcode[i]) % 2 === 0 ? barcodeHeight : barcodeHeight * 0.7
      ctx.fillRect(x, yPosition, barWidth * 0.8, height)
    }
    yPosition += barcodeHeight + 15
    
    // Barcode number
    ctx.font = '12px monospace'
    ctx.fillText(product.barcode, centerX, yPosition)
    yPosition += lineHeight
    
    // SKU
    if (includeSku && product.sku) {
      ctx.font = '14px Arial'
      ctx.fillText(`SKU: ${product.sku}`, centerX, yPosition)
      yPosition += lineHeight
    }
    
    // Price
    if (includePrice) {
      ctx.font = 'bold 18px Arial'
      ctx.fillText(`$${product.price.toFixed(2)}`, centerX, yPosition)
      yPosition += lineHeight
    }
    
    // Category
    if (includeCategory && product.category) {
      ctx.font = '12px Arial'
      ctx.fillText(product.category, centerX, yPosition)
      yPosition += lineHeight
    }
    
    // Custom text
    if (customText.trim()) {
      ctx.font = '12px Arial'
      ctx.fillText(customText, centerX, yPosition)
    }
  }
  
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
    setSelectedProducts(displayProducts.map(p => p.id))
  }
  
  // Clear selection
  const clearSelection = () => {
    setSelectedProducts([])
  }
  
  // Generate ZPL code for thermal printers
  const generateZPLCode = (product: Product): string => {
    const labelDimensions = LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES]
    const dpi = PRINT_DENSITIES[printDensity as keyof typeof PRINT_DENSITIES].dpi
    
    // Convert mm to dots (1mm = dpi/25.4)
    const mmToDots = (mm: number) => Math.round((mm * dpi) / 25.4)
    
    const width = mmToDots(labelDimensions.width)
    const height = mmToDots(labelDimensions.height)
    
    let zpl = `^XA\\n` // Start of label
    zpl += `^LH0,0\\n` // Label home position
    zpl += `^LL${height}\\n` // Label length
    
    let yPos = 20
    const centerX = Math.floor(width / 2)
    
    // Product name
    if (includeProductName && product.name) {
      zpl += `^FO${centerX - 100},${yPos}^A0N,25,25^FD${product.name}^FS\\n`
      yPos += 40
    }
    
    // Barcode
    zpl += `^FO${centerX - 100},${yPos}^BY2^BCN,40,Y,N,N^FD${product.barcode}^FS\\n`
    yPos += 60
    
    // SKU
    if (includeSku && product.sku) {
      zpl += `^FO${centerX - 80},${yPos}^A0N,20,20^FDSKU: ${product.sku}^FS\\n`
      yPos += 30
    }
    
    // Price
    if (includePrice) {
      zpl += `^FO${centerX - 60},${yPos}^A0N,30,30^FD$${product.price.toFixed(2)}^FS\\n`
      yPos += 40
    }
    
    // Category
    if (includeCategory && product.category) {
      zpl += `^FO${centerX - 50},${yPos}^A0N,18,18^FD${product.category}^FS\\n`
      yPos += 25
    }
    
    // Custom text
    if (customText.trim()) {
      zpl += `^FO${centerX - 80},${yPos}^A0N,18,18^FD${customText}^FS\\n`
    }
    
    zpl += `^XZ\\n` // End of label
    
    return zpl
  }
  
  // Print selected labels
  const printLabels = async () => {
    if (selectedProducts.length === 0) {
      setPrintStatus('Please select at least one product to print')
      return
    }
    
    setIsPrinting(true)
    setPrintStatus('Preparing labels...')
    
    try {
      const selectedProductData = displayProducts.filter(p => selectedProducts.includes(p.id))
      let totalLabels = 0
      
      for (const product of selectedProductData) {
        // Generate ZPL code
        const zplCode = generateZPLCode(product)
        
        // Print each label the specified number of copies
        for (let copy = 1; copy <= copies; copy++) {
          setPrintStatus(`Printing ${product.name} (${copy}/${copies})...`)
          
          // For web environment, we'll create a print-friendly version
          await printWebLabel(product, zplCode)
          totalLabels++
          
          // Small delay between prints
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      setPrintStatus(`Successfully printed ${totalLabels} labels!`)
      onPrintComplete?.(totalLabels)
      
      // Clear status after 3 seconds
      setTimeout(() => setPrintStatus(''), 3000)
      
    } catch (error) {
      console.error('Print error:', error)
      setPrintStatus('Print failed. Please check your printer connection.')
    } finally {
      setIsPrinting(false)
    }
  }
  
  // Print web-friendly label (opens print dialog)
  const printWebLabel = async (product: Product, zplCode: string) => {
    return new Promise<void>((resolve) => {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        resolve()
        return
      }
      
      const labelDimensions = LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES]
      
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
              .zpl-code {
                display: none;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${includeProductName ? `<div class="product-name">${product.name}</div>` : ''}
            <div class="barcode-container">
              <div class="barcode">${product.barcode}</div>
              <div class="barcode-number">${product.barcode}</div>
            </div>
            <div class="product-details">
              ${includeSku ? `<div class="product-info">SKU: ${product.sku}</div>` : ''}
              ${includePrice ? `<div class="price">$${product.price.toFixed(2)}</div>` : ''}
              ${includeCategory ? `<div class="product-info">${product.category}</div>` : ''}
              ${customText ? `<div class="product-info">${customText}</div>` : ''}
            </div>
            <div class="zpl-code">${zplCode}</div>
          </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
          resolve()
        }, 500)
      }
    })
  }
  
  // Download ZPL file for direct printer use
  const downloadZPLFile = () => {
    if (selectedProducts.length === 0) return
    
    const selectedProductData = displayProducts.filter(p => selectedProducts.includes(p.id))
    let zplContent = ''
    
    selectedProductData.forEach(product => {
      for (let copy = 1; copy <= copies; copy++) {
        zplContent += generateZPLCode(product) + '\\n\\n'
      }
    })
    
    const blob = new Blob([zplContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `thermal-labels-${new Date().toISOString().split('T')[0]}.zpl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  // Update preview when settings change
  useEffect(() => {
    if (showPreview && selectedProducts.length > 0) {
      const firstProduct = displayProducts.find(p => selectedProducts.includes(p.id))
      if (firstProduct) {
        generateLabelPreview(firstProduct)
      }
    }
  }, [showPreview, selectedProducts, labelSize, includeProductName, includePrice, includeSku, includeCategory, customText])
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Printer className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thermal Label Printer</h1>
          <p className="text-gray-600">Print barcode labels for thermal label printers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Products ({selectedProducts.length} selected)
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllProducts}
                  disabled={selectedProducts.length === displayProducts.length}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelection}
                  disabled={selectedProducts.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayProducts.map(product => (
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
                          <span className="font-medium">${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">{product.category}</Badge>
                    </div>
                  </div>
                ))}
              </div>
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
                onClick={() => setShowPreview(!showPreview)}
                variant="outline" 
                className="w-full"
                disabled={selectedProducts.length === 0}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>

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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Label Preview</CardTitle>
            <p className="text-sm text-gray-600">
              Preview of first selected product • {LABEL_SIZES[labelSize as keyof typeof LABEL_SIZES].name}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
                <canvas 
                  ref={previewCanvasRef}
                  className="border border-gray-200"
                  style={{ maxWidth: '300px', height: 'auto' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <CardTitle>Printer Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">For Direct ZPL Printing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Download the ZPL file using the button above</li>
                <li>Send the ZPL file directly to your thermal printer via USB, Network, or Bluetooth</li>
                <li>Most thermal printers support ZPL commands natively</li>
                <li>Compatible with Zebra, Datamax, Honeywell, and other ZPL-compatible printers</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Web Browser Printing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click the "Print Labels" button</li>
                <li>Each label will open in a new window</li>
                <li>Set your printer to the correct label size</li>
                <li>Print with margins set to 0 for best results</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm"><strong>Note:</strong> For production environments, consider using a direct printer integration library like <code>node-thermal-printer</code> or printer-specific SDKs for better control and reliability.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}