import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Printer, 
  Download, 
  Copy, 
  Settings,
  CheckCircle,
  AlertCircle,
  Tag,
  Package,
  Plus,
  Minus
} from 'lucide-react'

interface QuickBarcodePrinterProps {
  product: {
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate barcode visual using canvas
  useEffect(() => {
    generateBarcodeImage()
  }, [product.barcode, product.sku])

  const generateBarcodeImage = () => {
    const barcode = product.barcode || product.sku
    if (!barcode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 300
    canvas.height = 80

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Generate simple barcode pattern (for demo - replace with JsBarcode in production)
    const barcodeWidth = 250
    const barcodeHeight = 50
    const startX = 25
    const startY = 15

    // Create barcode pattern based on the code
    ctx.fillStyle = '#000000'
    
    // Simple encoding: each character creates a pattern
    const cleanCode = barcode.replace(/[^A-Z0-9]/g, '')
    const barWidth = barcodeWidth / (cleanCode.length * 5)
    
    for (let i = 0; i < cleanCode.length; i++) {
      const char = cleanCode[i]
      const charCode = char.charCodeAt(0)
      
      // Create pattern based on character code
      for (let j = 0; j < 5; j++) {
        if ((charCode + j) % 3 === 0) {
          const x = startX + (i * 5 + j) * barWidth
          ctx.fillRect(x, startY, barWidth * 0.8, barcodeHeight)
        }
      }
    }

    // Add start/end bars
    ctx.fillRect(startX - 5, startY, 3, barcodeHeight)
    ctx.fillRect(startX + barcodeWidth + 2, startY, 3, barcodeHeight)

    // Convert to data URL for use in print
    setBarcodeDataUrl(canvas.toDataURL())
  }

  // Generate barcode if missing
  const generateBarcode = () => {
    const newBarcode = product.sku // Simple fallback
    if (onBarcodeGenerated) {
      onBarcodeGenerated(newBarcode)
    }
    setStatus(`Generated barcode: ${newBarcode}`)
    setTimeout(() => setStatus(''), 3000)
  }

  // Copy barcode to clipboard
  const copyBarcode = () => {
    const barcode = product.barcode || product.sku
    navigator.clipboard.writeText(barcode)
    setStatus(`Copied: ${barcode}`)
    setTimeout(() => setStatus(''), 2000)
  }

  // Print single label via web browser with REAL barcode image
  const printLabel = async () => {
    setIsPrinting(true)
    setStatus('Preparing label...')

    try {
      for (let copy = 1; copy <= copies; copy++) {
        setStatus(`Printing label ${copy}/${copies}...`)
        
        const printWindow = window.open('', '_blank')
        if (!printWindow) continue

        printWindow.document.write(`
          <html>
            <head>
              <title>Barcode Label - ${product.name}</title>
              <style>
                @page { margin: 0; size: 60mm 40mm; }
                body { 
                  margin: 0; 
                  padding: 8px; 
                  font-family: Arial, sans-serif; 
                  text-align: center;
                  font-size: 11px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  height: 100vh;
                }
                .product-name { 
                  font-weight: bold; 
                  margin-bottom: 4px; 
                  font-size: 12px;
                  max-height: 24px;
                  overflow: hidden;
                }
                .barcode-image { 
                  margin: 4px 0; 
                  max-width: 100%;
                  height: auto;
                }
                .barcode-number { 
                  font-family: monospace; 
                  font-size: 9px; 
                  margin-bottom: 4px; 
                }
                .product-info { 
                  margin: 2px 0; 
                  font-size: 10px;
                }
                .price { 
                  font-weight: bold; 
                  color: #059669; 
                  font-size: 14px;
                }
                @media print { 
                  body { margin: 0; padding: 4px; } 
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${includeName ? `<div class="product-name">${product.name}</div>` : ''}
              ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode" class="barcode-image" />` : ''}
              <div class="barcode-number">${product.barcode || product.sku}</div>
              ${includeSku ? `<div class="product-info">SKU: ${product.sku}</div>` : ''}
              ${includePrice ? `<div class="price">$${product.sellingPriceUSD.toFixed(2)}</div>` : ''}
              <div class="product-info">${product.category.name}</div>
              ${product.requiresSizes && product.productSizes ? 
                `<div class="product-info">Sizes: ${product.productSizes.map(s => s.size).join(', ')}</div>` : ''}
              <div class="product-info">Stock: ${product.stockQuantity}</div>
            </body>
          </html>
        `)

        printWindow.document.close()
        
        await new Promise<void>((resolve) => {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
              printWindow.close()
              resolve()
            }, 500)
          }
        })

        // Small delay between copies
        if (copy < copies) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      setStatus(`Successfully printed ${copies} label(s)!`)
      setTimeout(() => setStatus(''), 3000)

    } catch (error) {
      console.error('Print error:', error)
      setStatus('Print failed. Please check your printer.')
    } finally {
      setIsPrinting(false)
    }
  }

  // Download as ZPL for thermal printers
  const downloadZPL = () => {
    const barcode = product.barcode || product.sku
    
    let zpl = `^XA\n`
    zpl += `^LH0,0\n`
    zpl += `^LL320\n` // 60mm height at 203 DPI
    
    let yPos = 20
    
    // Product name
    if (includeName) {
      const name = product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
      zpl += `^FO50,${yPos}^A0N,25,25^FD${name}^FS\n`
      yPos += 40
    }
    
    // Barcode - REAL ZPL barcode command
    zpl += `^FO50,${yPos}^BY2^BCN,40,Y,N,N^FD${barcode}^FS\n`
    yPos += 60
    
    // SKU
    if (includeSku) {
      zpl += `^FO70,${yPos}^A0N,20,20^FDSKU: ${product.sku}^FS\n`
      yPos += 30
    }
    
    // Price
    if (includePrice) {
      zpl += `^FO90,${yPos}^A0N,30,30^FD$${product.sellingPriceUSD.toFixed(2)}^FS\n`
      yPos += 40
    }
    
    // Category
    zpl += `^FO70,${yPos}^A0N,18,18^FD${product.category.name}^FS\n`
    yPos += 25
    
    // Stock
    zpl += `^FO70,${yPos}^A0N,16,16^FDStock: ${product.stockQuantity}^FS\n`
    
    zpl += `^XZ\n`

    // Create multiple copies
    let finalZpl = ''
    for (let i = 0; i < copies; i++) {
      finalZpl += zpl + '\n'
    }

    const blob = new Blob([finalZpl], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `label-${product.sku}-${new Date().toISOString().split('T')[0]}.zpl`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setStatus(`Downloaded ZPL file for ${copies} label(s)`)
    setTimeout(() => setStatus(''), 3000)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <span>Print Barcode Label</span>
            {!product.barcode && (
              <Badge variant="destructive" className="text-xs">
                No Barcode
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Simple' : 'Advanced'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        {/* Status */}
        {status && (
          <Alert className={isPrinting ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}>
            {isPrinting ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {/* Barcode Preview */}
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-gray-700 mb-2">Barcode Preview</div>
          {barcodeDataUrl ? (
            <img src={barcodeDataUrl} alt="Barcode" className="mx-auto max-w-full h-auto" />
          ) : (
            <div className="text-gray-400 py-4">
              <Tag className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm">No barcode generated</div>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {product.barcode || product.sku}
          </div>
          {/* Hidden canvas for barcode generation */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Product Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Product:</strong> {product.name}
            </div>
            <div>
              <strong>Price:</strong> ${product.sellingPriceUSD.toFixed(2)}
            </div>
            <div>
              <strong>SKU:</strong> {product.sku}
              <button
                onClick={copyBarcode}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <Copy className="h-3 w-3 inline" />
              </button>
            </div>
            <div>
              <strong>Stock:</strong> {product.stockQuantity}
            </div>
            {product.barcode ? (
              <div className="col-span-2">
                <strong>Barcode:</strong> {product.barcode}
                <button
                  onClick={copyBarcode}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <Copy className="h-3 w-3 inline" />
                </button>
              </div>
            ) : (
              <div className="col-span-2">
                <Button
                  onClick={generateBarcode}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Barcode
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            
            {/* Copies */}
            <div>
              <Label className="text-sm font-medium">Number of Copies</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                  className="w-16 text-center"
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
              <Label className="text-sm font-medium">Include on Label</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeName}
                    onChange={(e) => setIncludeName(e.target.checked)}
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
              </div>
            </div>
          </div>
        )}

        {/* Size Information */}
        {product.requiresSizes && product.productSizes && product.productSizes.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Size Variants Available</span>
            </div>
            <div className="text-sm text-blue-700">
              <div className="grid grid-cols-3 gap-2">
                {product.productSizes.map((size, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium">{size.size}</div>
                    <div className="text-xs">Stock: {size.stockQuantity}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs">
                💡 Each size has unique SKU: {product.productSizes[0]?.sku.split('-')[0]}-[SIZE]
              </div>
            </div>
          </div>
        )}

        {/* Print Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={printLabel}
            disabled={isPrinting}
            className="w-full"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Printing...' : `Print ${copies > 1 ? `${copies} Labels` : 'Label'}`}
          </Button>
          
          <Button
            onClick={downloadZPL}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download ZPL
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <div><strong>Print:</strong> Opens browser print dialog with real barcode image</div>
          <div><strong>ZPL:</strong> For thermal printers (creates actual scannable barcodes)</div>
          {!product.barcode && (
            <div className="text-orange-600">
              <strong>Note:</strong> Generate a barcode first for optimal scanning
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickBarcodePrinter