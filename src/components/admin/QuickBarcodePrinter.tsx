// src/components/admin/QuickBarcodePrinter.tsx
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed multiple format options
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, Copy, RefreshCw, Tag, ChevronDown, ChevronUp, Settings, AlertCircle, CheckCircle } from 'lucide-react'

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
  }, [barcodeText])

  // Generate CODE128 barcode using JsBarcode
  const generateJsBarcodeImage = async () => {
    if (isGenerating || !canvasRef.current) return
    
    setIsGenerating(true)
    setBarcodeDataUrl('')
    setError('')

    try {
      console.log('🔄 Generating CODE128 barcode:', barcodeText)

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Cannot get canvas 2D context')
      }

      // Set canvas dimensions
      canvas.width = 400
      canvas.height = 100

      // Clear canvas with white background
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dynamic import JsBarcode
      const JsBarcode = (await import('jsbarcode')).default

      if (!JsBarcode || typeof JsBarcode !== 'function') {
        throw new Error('JsBarcode failed to load')
      }

      console.log('✅ JsBarcode loaded successfully')

      // Generate CODE128 barcode (accepts any alphanumeric content)
      JsBarcode(canvas, barcodeText, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000"
      })

      console.log('✅ CODE128 barcode generated successfully')

      // Get image data URL
      const dataUrl = canvas.toDataURL('image/png')
      setBarcodeDataUrl(dataUrl)

      console.log('✅ Barcode image ready:', dataUrl.length, 'characters')

    } catch (error) {
      console.error('❌ Barcode generation error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      // Fallback: Create error canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#f3f4f6'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#ef4444'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Barcode Error', canvas.width / 2, canvas.height / 2)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const shortError = errorMessage.length > 50 ? 
            errorMessage.substring(0, 50) + '...' : errorMessage
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
    setStatus(`Generated CODE128 barcode: ${newBarcode}`)
    setTimeout(() => setStatus(''), 3000)
  }

  const copyBarcode = () => {
    navigator.clipboard.writeText(barcodeText)
    setStatus(`Copied: ${barcodeText}`)
    setTimeout(() => setStatus(''), 2000)
  }

  // Enhanced print function with CODE128 labels
  const printLabels = async () => {
    if (!barcodeDataUrl) {
      setStatus('No barcode image available - please wait for generation')
      return
    }

    setIsPrinting(true)
    setStatus(`Printing ${copies} CODE128 ${copies === 1 ? 'label' : 'labels'}...`)

    try {
      // Create optimized print HTML for thermal labels
      let printContent = `<!DOCTYPE html>
<html>
<head>
<title>CODE128 Barcode Labels - ${product.name}</title>
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
.format-info {
  font-size: 6px;
  color: #6b7280;
  margin-top: 0.5mm;
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
    <img src="${barcodeDataUrl}" alt="CODE128 Barcode ${barcodeText}">
  </div>
  ${includeSku ? `<div class="info">SKU: ${product.sku}</div>` : ''}
  ${includePrice ? `<div class="price">$${product.sellingPriceUSD.toFixed(2)}</div>` : ''}
  <div class="format-info">CODE128</div>
</div>`
      }

      printContent += `
</body>
</html>`

      // Open print window
      const printWindow = window.open('', '_blank', 'width=600,height=400')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        // Auto-print after short delay
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
        
        setStatus(`✅ ${copies} CODE128 ${copies === 1 ? 'label' : 'labels'} sent to printer`)
      } else {
        setStatus('❌ Could not open print window - check popup blocker')
      }

    } catch (error) {
      console.error('Print error:', error)
      setStatus('❌ Print failed - see console for details')
    } finally {
      setIsPrinting(false)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Quick CODE128 Barcode Printer
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className={`p-2 rounded text-sm flex items-center gap-2 ${
            status.includes('❌') || error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {status.includes('❌') || error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            {status}
          </div>
        )}

        {/* Barcode Canvas (Hidden) */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
          width={400}
          height={100}
        />

        {/* Product Info */}
        <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
          <div><strong>Product:</strong> {product.name}</div>
          <div><strong>SKU:</strong> {product.sku}</div>
          <div><strong>Price:</strong> ${product.sellingPriceUSD.toFixed(2)}</div>
          <div><strong>Stock:</strong> {product.stockQuantity}</div>
          {product.barcode && (
            <div className="col-span-2">
              <strong>Current Barcode:</strong> {product.barcode} (CODE128)
            </div>
          )}
        </div>

        {/* Expanded Settings */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Print Settings (CODE128 Format)
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

              <div className="flex items-end">
                <div className="text-xs text-gray-600">
                  <div className="font-medium text-blue-600">CODE128 Format</div>
                  <div>Universal • Letters + Numbers</div>
                  <div>Most compatible barcode format</div>
                </div>
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

          <Button
            variant="outline"
            onClick={copyBarcode}
            disabled={!barcodeText}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Barcode
          </Button>

          <Button
            variant="outline"
            onClick={generateBarcodeFromSKU}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Generate from SKU
          </Button>

          {error && (
            <Button
              variant="outline"
              onClick={regenerateBarcode}
              className="flex items-center gap-2 text-red-600"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Generation
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 mt-4 p-2 bg-blue-50 rounded">
          <strong>CODE128 Benefits:</strong> Works with any letters, numbers, and symbols. 
          Most widely supported barcode format. Perfect for SKUs, product codes, and inventory tracking.
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickBarcodePrinter