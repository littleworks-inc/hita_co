// src/components/admin/QuickBarcodePrinter.tsx
// 🔧 FIXED: Replace the custom barcode generation with proper JsBarcode implementation
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, Copy, RefreshCw, Tag, ChevronDown, ChevronUp, Settings, AlertCircle } from 'lucide-react'

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

interface QuickBarcodePrinterProps {
  product: Product
  onBarcodeGenerated?: (barcode: string) => void
}

const QuickBarcodePrinter: React.FC<QuickBarcodePrinterProps> = ({
  product,
  onBarcodeGenerated
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copies, setCopies] = useState(1)
  const [includePrice, setIncludePrice] = useState(true)
  const [includeName, setIncludeName] = useState(true)
  const [includeSku, setIncludeSku] = useState(true)
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'CODE39' | 'EAN13'>('CODE128')
  const [status, setStatus] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barcodeText = product.barcode || product.sku

  // Generate barcode when component mounts or barcode changes
  useEffect(() => {
    if (barcodeText && canvasRef.current) {
      generateJsBarcodeImage()
    }
  }, [barcodeText, barcodeFormat])

  // 🔧 FIXED: Proper JsBarcode implementation with all required canvas methods
  const generateJsBarcodeImage = async () => {
    if (isGenerating || !canvasRef.current) return
    
    setIsGenerating(true)
    setBarcodeDataUrl('')
    setError('')

    try {
      console.log('🔄 Starting JsBarcode generation:', { barcodeText, barcodeFormat })

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Cannot get canvas 2D context')
      }

      // ✅ CRITICAL FIX: Verify canvas context has all required methods
      const requiredMethods = ['save', 'restore', 'scale', 'translate', 'fillRect', 'fillText', 'measureText']
      for (const method of requiredMethods) {
        if (typeof (ctx as any)[method] !== 'function') {
          throw new Error(`Canvas context missing required method: ${method}`)
        }
      }

      console.log('✅ Canvas context verified with all required methods')

      // Set canvas dimensions BEFORE using JsBarcode
      canvas.width = 400
      canvas.height = 100

      // Clear canvas with white background
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dynamic import JsBarcode
      const JsBarcode = (await import('jsbarcode')).default

      if (!JsBarcode || typeof JsBarcode !== 'function') {
        throw new Error('JsBarcode failed to load or is not a function')
      }

      console.log('✅ JsBarcode loaded successfully')

      // Prepare barcode data based on format
      let processedBarcode = barcodeText.trim()
      
      // Format-specific processing
      switch (barcodeFormat) {
        case 'CODE39':
          processedBarcode = processedBarcode.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '')
          if (processedBarcode.length === 0) {
            throw new Error('No valid CODE39 characters found')
          }
          break
        case 'EAN13':
          processedBarcode = processedBarcode.replace(/[^0-9]/g, '')
          if (processedBarcode.length < 13) {
            processedBarcode = processedBarcode.padStart(13, '0')
          } else if (processedBarcode.length > 13) {
            processedBarcode = processedBarcode.slice(0, 13)
          }
          break
        case 'CODE128':
        default:
          // CODE128 accepts most characters
          break
      }

      console.log('📝 Processing barcode:', processedBarcode)

      // ✅ FIXED: Generate barcode with proper error handling
      let barcodeValid = false

      JsBarcode(canvas, processedBarcode, {
        format: barcodeFormat,
        width: barcodeFormat === 'CODE39' ? 1.5 : 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        textMargin: 8,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
        fontOptions: 'bold',
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        valid: (valid: boolean) => {
          console.log('🔍 JsBarcode validation result:', valid)
          barcodeValid = valid
          if (!valid) {
            throw new Error(`Invalid barcode: ${processedBarcode} for format ${barcodeFormat}`)
          }
        }
      })

      // Wait a moment for the barcode to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!barcodeValid) {
        throw new Error('Barcode generation failed validation')
      }

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      
      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Failed to generate image data URL')
      }

      setBarcodeDataUrl(dataUrl)
      setStatus('✅ Barcode generated successfully!')
      console.log('✅ JsBarcode generation completed successfully')
      
      setTimeout(() => setStatus(''), 2000)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ JsBarcode generation failed:', errorMessage)
      setError(errorMessage)
      setStatus('❌ Barcode generation failed')
      
      // Draw error message on canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = 400
          canvas.height = 100
          
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          ctx.fillStyle = '#ef4444'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('⚠️ Barcode Generation Failed', canvas.width / 2, canvas.height / 2 - 10)
          
          ctx.font = '11px Arial'
          ctx.fillStyle = '#666666'
          const shortError = errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage
          ctx.fillText(shortError, canvas.width / 2, canvas.height / 2 + 15)
        }
      }
      
      setTimeout(() => setStatus(''), 3000)
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateBarcode = () => {
    setBarcodeDataUrl('')
    setError('')
    generateJsBarcodeImage()
  }

  const generateBarcodeFromSKU = () => {
    const newBarcode = product.sku
    if (onBarcodeGenerated) {
      onBarcodeGenerated(newBarcode)
    }
    setStatus(`Generated barcode: ${newBarcode}`)
    setTimeout(() => setStatus(''), 3000)
  }

  const copyBarcode = () => {
    navigator.clipboard.writeText(barcodeText)
    setStatus(`Copied: ${barcodeText}`)
    setTimeout(() => setStatus(''), 2000)
  }

  // Enhanced print function with multiple copies
  const printLabels = async () => {
    if (!barcodeDataUrl) {
      setStatus('No barcode image available - please wait for generation')
      return
    }

    setIsPrinting(true)
    setStatus(`Printing ${copies} ${copies === 1 ? 'copy' : 'copies'}...`)

    try {
      // Create optimized print HTML for thermal labels
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
  max-height: 15mm;
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
@media print {
  body { margin: 0; }
  .label { border: none; margin: 0; }
}
</style>
</head>
<body>`

      // Generate labels for each copy
      for (let copy = 1; copy <= copies; copy++) {
        printContent += `
<div class="label">
  ${includeName ? `<div class="name">${product.name}</div>` : ''}
  <div class="barcode">
    <img src="${barcodeDataUrl}" alt="Barcode ${barcodeText}">
  </div>
  ${includeSku ? `<div class="info">SKU: ${product.sku}</div>` : ''}
  ${includePrice ? `<div class="info price">$${product.sellingPriceUSD.toFixed(2)}</div>` : ''}
</div>`
      }

      printContent += `
</body>
</html>`

      // Open print window
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        // Wait for images to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            setStatus('Print dialog opened')
            setTimeout(() => setStatus(''), 2000)
          }, 500)
        }
      } else {
        setStatus('Failed to open print window - check popup blocker')
        setTimeout(() => setStatus(''), 3000)
      }

    } catch (error) {
      console.error('Print error:', error)
      setStatus('Print failed - please try again')
      setTimeout(() => setStatus(''), 3000)
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Quick Barcode Printer
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
            status.includes('✅') || status.includes('successfully') || status.includes('ready') ? 'text-green-600' :
            status.includes('❌') || status.includes('failed') ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {status}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-800">Barcode Generation Error</div>
              <div className="text-sm text-red-700">{error}</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={regenerateBarcode}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Barcode Display */}
        <div className="bg-white border rounded-lg p-4 text-center">
          {isGenerating ? (
            <div className="py-4">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-blue-500" />
              <div className="text-sm text-gray-600">Generating JsBarcode...</div>
            </div>
          ) : barcodeDataUrl ? (
            <div>
              <img 
                src={barcodeDataUrl} 
                alt={`Barcode: ${barcodeText}`}
                className="mx-auto border border-gray-200 rounded"
                style={{ maxHeight: '120px', maxWidth: '100%' }}
              />
              <div className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Ready for printing ({barcodeFormat})
              </div>
            </div>
          ) : (
            <div className="py-4 text-gray-400">
              <Tag className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm">No barcode generated</div>
            </div>
          )}
          
          <Button onClick={regenerateBarcode} variant="outline" size="sm" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          
          {/* Hidden canvas for barcode generation */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Product Info */}
        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
          <div><strong>Product:</strong> {product.name}</div>
          <div><strong>Price:</strong> ${product.sellingPriceUSD.toFixed(2)}</div>
          <div>
            <strong>SKU:</strong> {product.sku}
            <button onClick={copyBarcode} className="ml-2 text-blue-600 hover:text-blue-800">
              <Copy className="h-3 w-3 inline" />
            </button>
          </div>
          <div><strong>Stock:</strong> {product.stockQuantity}</div>
          {product.barcode && (
            <div className="col-span-2">
              <strong>Barcode:</strong> {product.barcode}
            </div>
          )}
        </div>

        {/* Expanded Settings */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Print Settings
            </div>

            {/* Print Options */}
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

              <div>
                <label className="block text-sm font-medium mb-1">Barcode Format</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value as any)}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="CODE128">CODE128 (Recommended)</option>
                  <option value="CODE39">CODE39</option>
                  <option value="EAN13">EAN13</option>
                </select>
              </div>
            </div>

            {/* Include Options */}
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={printLabels}
            disabled={!barcodeDataUrl || isPrinting}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? 'Printing...' : `Print ${copies > 1 ? `${copies} Labels` : 'Label'}`}
          </Button>

          {!product.barcode && (
            <Button
              variant="outline"
              onClick={generateBarcodeFromSKU}
              className="flex items-center gap-2"
            >
              Generate Barcode
            </Button>
          )}

          <Button
            variant="outline"
            onClick={copyBarcode}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Code
          </Button>
        </div>

        {/* Size Variants (if applicable) */}
        {product.requiresSizes && product.productSizes && product.productSizes.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Size Variants</h4>
            <div className="grid grid-cols-1 gap-2">
              {product.productSizes.map((size, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <strong>Size {size.size}:</strong> {size.sku}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Stock: {size.stockQuantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(size.sku)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QuickBarcodePrinter