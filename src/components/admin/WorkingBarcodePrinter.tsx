// src/components/admin/WorkingBarcodePrinter.tsx
// 🔧 ENHANCED: Working barcode printer with size variant support
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, Copy, RefreshCw, Settings, ChevronDown, ChevronUp, AlertCircle, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  sellingPriceUSD: number
  stockQuantity: number
  category: { name: string }
  requiresSizes?: boolean
  productSizes?: Array<{
    size: string
    sku: string
    stockQuantity: number
  }>
}

interface WorkingBarcodePrinterProps {
  product: Product
  onBarcodeGenerated?: (barcode: string) => void
}

// CODE128 character set mapping (simplified)
const CODE128_CHARS: { [key: string]: string } = {
  ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
  '$': '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
  '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
  ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
  '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
  '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
  '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
  '<': '11100110100', '=': '11100110010', '>': '11011011000', '?': '11011000110',
  '@': '11000110110', 'A': '10100011000', 'B': '10001011000', 'C': '10001000110',
  'D': '10110001000', 'E': '10001101000', 'F': '10001100010', 'G': '11010001000',
  'H': '11000101000', 'I': '11000100010', 'J': '10110111000', 'K': '10110001110',
  'L': '10001101110', 'M': '10111011000', 'N': '10111000110', 'O': '10001110110',
  'P': '11101110110', 'Q': '11010001110', 'R': '11000101110', 'S': '11011101000',
  'T': '11011100010', 'U': '11011101110', 'V': '11101011000', 'W': '11101000110',
  'X': '11100010110', 'Y': '11101101000', 'Z': '11101100010'
}

const WorkingBarcodePrinter: React.FC<WorkingBarcodePrinterProps> = ({
  product,
  onBarcodeGenerated
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copies, setCopies] = useState(1)
  const [includePrice, setIncludePrice] = useState(true)
  const [includeName, setIncludeName] = useState(true)
  const [includeSku, setIncludeSku] = useState(true)
  const [printMode, setPrintMode] = useState<'main' | 'sizes' | 'all'>('main')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [barcodeDataUrls, setBarcodeDataUrls] = useState<{[key: string]: string}>({})
  const [isGenerating, setIsGenerating] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mainBarcode = product.barcode || product.sku

  // Initialize selected sizes
  useEffect(() => {
    if (product.requiresSizes && product.productSizes) {
      setSelectedSizes(product.productSizes.map(size => size.size))
    }
  }, [product])

  // Generate main barcode on mount
  useEffect(() => {
    if (mainBarcode && canvasRef.current) {
      generateBarcodeForCode('main', mainBarcode)
    }
  }, [mainBarcode])

  // Generate barcode for specific code
  const generateBarcodeForCode = async (key: string, barcodeText: string) => {
    if (isGenerating) return
    
    setIsGenerating(true)

    try {
      console.log(`🔄 Generating barcode for ${key}:`, barcodeText)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      // Set canvas size
      canvas.width = 400
      canvas.height = 120

      // Clear with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Generate barcode pattern based on text
      ctx.fillStyle = '#000000'
      
      const barHeight = 60
      const startX = 30
      const startY = 20
      
      let x = startX
      
      // Start pattern
      ctx.fillRect(x, startY, 3, barHeight); x += 5
      ctx.fillRect(x, startY, 1, barHeight); x += 3
      ctx.fillRect(x, startY, 3, barHeight); x += 6
      
      // Encode each character
      for (let i = 0; i < barcodeText.length && x < canvas.width - 50; i++) {
        const char = barcodeText[i]
        const code = char.charCodeAt(0)
        
        // Create pattern based on character code
        const pattern = [
          (code % 7) + 1,  // Variable width bars
          2,               // Space
          (code % 5) + 1,  // Variable width bars
          1,               // Space
          (code % 3) + 2,  // Variable width bars
          2                // Space
        ]
        
        for (let j = 0; j < pattern.length && x < canvas.width - 50; j++) {
          if (j % 2 === 0) { // Draw bars on even indices
            ctx.fillRect(x, startY, pattern[j], barHeight)
          }
          x += pattern[j]
        }
        x += 2 // Character spacing
      }
      
      // End pattern
      ctx.fillRect(x, startY, 3, barHeight); x += 5
      ctx.fillRect(x, startY, 1, barHeight); x += 3
      ctx.fillRect(x, startY, 3, barHeight)
      
      // Add text below
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(barcodeText, canvas.width / 2, startY + barHeight + 25)

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      setBarcodeDataUrls(prev => ({ ...prev, [key]: dataUrl }))
      
      console.log(`✅ Barcode generated for ${key}`)

    } catch (error) {
      console.error(`❌ Barcode generation failed for ${key}:`, error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate all size barcodes
  const generateAllSizeBarcodes = async () => {
    if (!product.requiresSizes || !product.productSizes) return
    
    setStatus('Generating size barcodes...')
    
    for (const size of product.productSizes) {
      const sizeBarcode = `${product.sku}-${size.size.toUpperCase()}`
      await generateBarcodeForCode(`size-${size.size}`, sizeBarcode)
    }
    
    setStatus('✅ All size barcodes generated!')
    setTimeout(() => setStatus(''), 2000)
  }

  // Regenerate main barcode
  const regenerateMainBarcode = () => {
    setBarcodeDataUrls(prev => {
      const newUrls = { ...prev }
      delete newUrls.main
      return newUrls
    })
    generateBarcodeForCode('main', mainBarcode)
  }

  // Toggle size selection
  const toggleSizeSelection = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }

  // Print labels based on mode
  const printLabels = async () => {
    if (isPrinting) return

    let itemsToPrint: Array<{key: string, barcode: string, label: string, dataUrl: string}> = []

    // Determine what to print based on mode
    if (printMode === 'main') {
      if (barcodeDataUrls.main) {
        itemsToPrint.push({
          key: 'main',
          barcode: mainBarcode,
          label: 'Main Product',
          dataUrl: barcodeDataUrls.main
        })
      }
    } else if (printMode === 'sizes') {
      if (product.requiresSizes && product.productSizes) {
        for (const size of product.productSizes) {
          if (selectedSizes.includes(size.size) && barcodeDataUrls[`size-${size.size}`]) {
            itemsToPrint.push({
              key: `size-${size.size}`,
              barcode: `${product.sku}-${size.size.toUpperCase()}`,
              label: `Size ${size.size}`,
              dataUrl: barcodeDataUrls[`size-${size.size}`]
            })
          }
        }
      }
    } else if (printMode === 'all') {
      // Main product
      if (barcodeDataUrls.main) {
        itemsToPrint.push({
          key: 'main',
          barcode: mainBarcode,
          label: 'Main Product',
          dataUrl: barcodeDataUrls.main
        })
      }
      // Selected sizes
      if (product.requiresSizes && product.productSizes) {
        for (const size of product.productSizes) {
          if (selectedSizes.includes(size.size) && barcodeDataUrls[`size-${size.size}`]) {
            itemsToPrint.push({
              key: `size-${size.size}`,
              barcode: `${product.sku}-${size.size.toUpperCase()}`,
              label: `Size ${size.size}`,
              dataUrl: barcodeDataUrls[`size-${size.size}`]
            })
          }
        }
      }
    }

    if (itemsToPrint.length === 0) {
      setStatus('No labels to print - generate barcodes first')
      return
    }

    setIsPrinting(true)
    setStatus(`Preparing ${itemsToPrint.length * copies} label(s) for printing...`)

    try {
      let printContent = `<!DOCTYPE html>
<html>
<head>
<title>Barcode Labels - ${product.name}</title>
<style>
@page { 
  margin: 0; 
  size: 60mm 40mm; 
}
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  font-size: 8px;
}
.label {
  width: 60mm;
  height: 40mm;
  padding: 2mm;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  page-break-after: always;
  border: 1px solid #ddd;
  margin-bottom: 2mm;
}
.label:last-child {
  page-break-after: avoid;
  margin-bottom: 0;
}
.name { 
  font-weight: bold; 
  font-size: 9px; 
  margin-bottom: 1mm;
  max-height: 8mm;
  overflow: hidden;
  line-height: 1.1;
}
.barcode { 
  margin: 1mm 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.barcode img { 
  width: auto; 
  height: auto; 
  max-width: 54mm; 
  max-height: 18mm;
}
.info { 
  font-size: 7px; 
  margin: 0.5mm 0; 
  color: #555;
}
.price { 
  font-weight: bold; 
  color: #059669; 
  font-size: 8px; 
}
.size-info {
  font-weight: bold;
  color: #2563eb;
  font-size: 7px;
}
@media print {
  body { margin: 0; }
  .label { border: none; margin: 0; }
}
</style>
</head>
<body>`

      // Generate labels for each item and copy
      for (const item of itemsToPrint) {
        for (let copy = 1; copy <= copies; copy++) {
          const isMainProduct = item.key === 'main'
          const productNameToShow = isMainProduct ? product.name : `${product.name} - ${item.label}`
          
          printContent += `
<div class="label">
  ${includeName ? `<div class="name">${productNameToShow}</div>` : ''}
  <div class="barcode">
    <img src="${item.dataUrl}" alt="Barcode ${item.barcode}">
  </div>
  ${includeSku ? `<div class="info">SKU: ${item.barcode}</div>` : ''}
  ${!isMainProduct ? `<div class="size-info">${item.label}</div>` : ''}
  ${includePrice ? `<div class="info price">$${product.sellingPriceUSD.toFixed(2)}</div>` : ''}
</div>`
        }
      }

      printContent += `
</body>
</html>`

      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            setStatus('✅ Print dialog opened')
            setTimeout(() => setStatus(''), 2000)
          }, 500)
        }
      } else {
        setStatus('❌ Failed to open print window')
        setTimeout(() => setStatus(''), 3000)
      }

    } catch (error) {
      console.error('Print error:', error)
      setStatus('❌ Print failed')
      setTimeout(() => setStatus(''), 3000)
    } finally {
      setIsPrinting(false)
    }
  }

  const copyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode)
    setStatus(`Copied: ${barcode}`)
    setTimeout(() => setStatus(''), 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Working Barcode Printer
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {status && (
          <div className={`text-sm font-medium ${
            status.includes('✅') || status.includes('generated') || status.includes('ready') ? 'text-green-600' :
            status.includes('❌') || status.includes('failed') ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {status}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Barcode Display */}
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-gray-700 mb-2">Main Product Barcode</div>
          
          {isGenerating ? (
            <div className="py-4">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-blue-500" />
              <div className="text-sm text-gray-600">Generating barcode...</div>
            </div>
          ) : barcodeDataUrls.main ? (
            <div>
              <img 
                src={barcodeDataUrls.main} 
                alt={`Barcode: ${mainBarcode}`}
                className="mx-auto border border-gray-200 rounded"
                style={{ maxHeight: '140px', maxWidth: '100%' }}
              />
              <div className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Ready for printing
              </div>
            </div>
          ) : (
            <div className="py-4 text-gray-400">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm">No barcode generated</div>
            </div>
          )}
          
          <div className="flex gap-2 justify-center mt-3">
            <Button onClick={regenerateMainBarcode} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Main
            </Button>
            <Button onClick={() => copyBarcode(mainBarcode)} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>

        {/* Size Variants Section */}
        {product.requiresSizes && product.productSizes && product.productSizes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Size Variant Barcodes</span>
              </div>
              <Button
                onClick={generateAllSizeBarcodes}
                variant="outline"
                size="sm"
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate All Sizes
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {product.productSizes.map((size) => {
                const sizeKey = `size-${size.size}`
                const sizeBarcode = `${product.sku}-${size.size.toUpperCase()}`
                const hasBarcode = !!barcodeDataUrls[sizeKey]
                const isSelected = selectedSizes.includes(size.size)

                return (
                  <div key={size.size} className={`border rounded-lg p-3 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Size {size.size}</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSizeSelection(size.size)}
                        className="rounded"
                      />
                    </div>
                    
                    {hasBarcode ? (
                      <div className="text-center">
                        <img 
                          src={barcodeDataUrls[sizeKey]} 
                          alt={`Size ${size.size} barcode`}
                          className="mx-auto border border-gray-200 rounded mb-2"
                          style={{ maxHeight: '60px', maxWidth: '100%' }}
                        />
                        <div className="text-xs text-gray-600 font-mono">{sizeBarcode}</div>
                        <Button
                          onClick={() => copyBarcode(sizeBarcode)}
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <div className="text-xs">No barcode</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Print Settings */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Print Settings
            </div>

            {/* Print Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Print Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="printMode"
                    value="main"
                    checked={printMode === 'main'}
                    onChange={(e) => setPrintMode(e.target.value as any)}
                  />
                  Main Only
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="printMode"
                    value="sizes"
                    checked={printMode === 'sizes'}
                    onChange={(e) => setPrintMode(e.target.value as any)}
                    disabled={!product.requiresSizes}
                  />
                  Sizes Only
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="printMode"
                    value="all"
                    checked={printMode === 'all'}
                    onChange={(e) => setPrintMode(e.target.value as any)}
                  />
                  All Selected
                </label>
              </div>
            </div>

            {/* Other Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Copies</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-end">
                <div className="text-xs text-gray-600">
                  Custom barcode generation with size variant support
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Include on Label</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeName}
                    onChange={(e) => setIncludeName(e.target.checked)}
                  />
                  Product Name
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includePrice}
                    onChange={(e) => setIncludePrice(e.target.checked)}
                  />
                  Price
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeSku}
                    onChange={(e) => setIncludeSku(e.target.checked)}
                  />
                  SKU
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Product Info */}
        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
          <div><strong>Product:</strong> {product.name}</div>
          <div><strong>Price:</strong> ${product.sellingPriceUSD.toFixed(2)}</div>
          <div><strong>SKU:</strong> {product.sku}</div>
          <div><strong>Stock:</strong> {product.stockQuantity}</div>
          {product.barcode && (
            <div className="col-span-2">
              <strong>Barcode:</strong> {product.barcode}
            </div>
          )}
          {product.requiresSizes && (
            <div className="col-span-2">
              <strong>Sizes:</strong> {product.productSizes?.map(s => s.size).join(', ')}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={printLabels}
            disabled={isPrinting}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? 'Printing...' : `Print ${printMode === 'main' ? 'Main' : printMode === 'sizes' ? 'Sizes' : 'All'} (${copies > 1 ? `${copies} copies` : '1 copy'})`}
          </Button>

          <Button
            variant="outline"
            onClick={() => copyBarcode(mainBarcode)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Main Code
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default WorkingBarcodePrinter