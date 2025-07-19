// src/components/admin/ReliableBarcode.tsx
// 🔧 FIXED: Reliable barcode generation component
"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, Printer, RefreshCw, AlertCircle } from 'lucide-react'

interface ReliableBarcodeProps {
  barcode: string
  productName?: string
  price?: number
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC'
  size?: 'small' | 'medium' | 'large'
  showControls?: boolean
  onImageGenerated?: (dataUrl: string) => void
}

const ReliableBarcode: React.FC<ReliableBarcodeProps> = ({
  barcode,
  productName,
  price,
  format = 'CODE128',
  size = 'medium',
  showControls = true,
  onImageGenerated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Size configurations
  const sizeConfig = {
    small: { width: 300, height: 80, fontSize: 10, barHeight: 50 },
    medium: { width: 400, height: 100, fontSize: 12, barHeight: 60 },
    large: { width: 500, height: 120, fontSize: 14, barHeight: 80 }
  }

  const config = sizeConfig[size]

  // Generate barcode using JsBarcode
  const generateBarcode = useCallback(async () => {
    if (!barcode || !canvasRef.current) {
      setError('No barcode provided or canvas not ready')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      console.log('🔄 Starting barcode generation:', { barcode, format })

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Cannot get canvas 2D context')
      }

      // Set canvas dimensions
      canvas.width = config.width
      canvas.height = config.height

      // Clear canvas with white background
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dynamic import JsBarcode to ensure it's loaded
      const JsBarcode = (await import('jsbarcode')).default

      if (!JsBarcode) {
        throw new Error('JsBarcode failed to load')
      }

      console.log('✅ JsBarcode loaded successfully')

      // Prepare barcode data based on format
      let processedBarcode = barcode.trim().toUpperCase()
      
      // Format-specific validation and processing
      switch (format) {
        case 'CODE39':
          processedBarcode = processedBarcode.replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '')
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
        case 'UPC':
          processedBarcode = processedBarcode.replace(/[^0-9]/g, '')
          if (processedBarcode.length < 12) {
            processedBarcode = processedBarcode.padStart(12, '0')
          } else if (processedBarcode.length > 12) {
            processedBarcode = processedBarcode.slice(0, 12)
          }
          break
        case 'CODE128':
        default:
          // CODE128 accepts most characters, minimal processing needed
          break
      }

      console.log('📝 Processed barcode:', processedBarcode)

      // Generate barcode with JsBarcode
      let generationSuccess = false

      JsBarcode(canvas, processedBarcode, {
        format: format,
        width: format === 'CODE39' ? 1.5 : 2,
        height: config.barHeight,
        displayValue: true,
        fontSize: config.fontSize,
        textMargin: 8,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
        fontOptions: 'bold',
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        valid: (valid: boolean) => {
          console.log('🔍 JsBarcode validation:', valid)
          if (!valid) {
            throw new Error(`Invalid barcode: ${processedBarcode} for format ${format}`)
          }
          generationSuccess = true
        }
      })

      // Wait a bit for the barcode to be drawn
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!generationSuccess) {
        throw new Error('Barcode generation failed validation')
      }

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      
      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Failed to generate image data')
      }

      setImageDataUrl(dataUrl)
      if (onImageGenerated) {
        onImageGenerated(dataUrl)
      }

      console.log('✅ Barcode generated successfully')
      setError('')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ Barcode generation failed:', errorMessage)
      setError(errorMessage)
      
      // Draw error on canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          ctx.fillStyle = '#ef4444'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('⚠️ Barcode Generation Failed', canvas.width / 2, canvas.height / 2 - 10)
          
          ctx.font = '11px Arial'
          ctx.fillStyle = '#666666'
          ctx.fillText(errorMessage.slice(0, 50), canvas.width / 2, canvas.height / 2 + 15)
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }, [barcode, format, config, onImageGenerated])

  // Generate barcode when barcode or format changes
  useEffect(() => {
    if (barcode && canvasRef.current) {
      generateBarcode()
    }
  }, [barcode, format, generateBarcode])

  // Copy barcode to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(barcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Download barcode image
  const downloadImage = () => {
    if (!imageDataUrl) return

    const link = document.createElement('a')
    link.download = `barcode-${barcode}.png`
    link.href = imageDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print barcode
  const printBarcode = () => {
    if (!imageDataUrl) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode - ${productName || barcode}</title>
            <style>
              @page { margin: 0.5in; }
              body { 
                margin: 0; 
                padding: 20px; 
                text-align: center; 
                font-family: Arial, sans-serif; 
              }
              .barcode-container { 
                margin: 20px auto; 
                max-width: 500px; 
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 8px;
              }
              .product-name { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 15px; 
                color: #333;
              }
              .barcode-image { 
                margin: 15px 0;
                max-width: 100%; 
                height: auto; 
              }
              .product-price { 
                font-size: 20px; 
                color: #059669; 
                font-weight: bold; 
                margin: 15px 0; 
              }
              .barcode-info { 
                font-size: 12px; 
                color: #666; 
                margin-top: 15px; 
                border-top: 1px solid #eee;
                padding-top: 10px;
              }
              @media print { 
                body { margin: 0; padding: 10px; }
                .barcode-container { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${productName ? `<div class="product-name">${productName}</div>` : ''}
              <img src="${imageDataUrl}" alt="Barcode" class="barcode-image" />
              ${price ? `<div class="product-price">$${price.toFixed(2)}</div>` : ''}
              <div class="barcode-info">
                ${format} • ${barcode}
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!barcode) {
    return (
      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="text-sm">No barcode to display</div>
        <div className="text-xs text-gray-400 mt-1">Enter a barcode to generate preview</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
              onClick={generateBarcode}
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Product Info */}
      {(productName || price) && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {productName && <div><strong>Product:</strong> {productName}</div>}
            {price && <div><strong>Price:</strong> ${price.toFixed(2)}</div>}
            <div><strong>Format:</strong> {format}</div>
            <div><strong>Code:</strong> {barcode}</div>
          </div>
        </div>
      )}

      {/* Barcode Display */}
      <div className="text-center p-4 bg-white border rounded-lg">
        {isGenerating ? (
          <div className="py-8">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-blue-500" />
            <div className="text-sm text-gray-600">Generating barcode...</div>
          </div>
        ) : imageDataUrl ? (
          <div>
            <img 
              src={imageDataUrl} 
              alt={`Barcode: ${barcode}`}
              className="mx-auto border border-gray-200 rounded"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Ready for printing
            </div>
          </div>
        ) : (
          <div className="py-8 text-gray-400">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <div className="text-sm">Failed to generate barcode</div>
          </div>
        )}

        {/* Hidden canvas for generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Controls */}
      {showControls && imageDataUrl && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadImage}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={printBarcode}
            className="flex items-center gap-1"
          >
            <Printer className="h-3 w-3" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateBarcode}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  )
}

export default ReliableBarcode