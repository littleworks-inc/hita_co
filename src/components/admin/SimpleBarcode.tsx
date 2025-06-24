// =====================================
// ENHANCED: Simple Working Barcode Component
// src/components/admin/SimpleBarcode.tsx
// =====================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface SimpleBarcodeProps {
  barcode: string
  barcodeType?: string
  productName?: string
  size?: 'small' | 'medium' | 'large'
  showControls?: boolean
}

interface BarcodeConfig {
  width: number
  height: number
  displayValue: boolean
  fontSize: number
  margin: number
}

const getSizeConfig = (size: 'small' | 'medium' | 'large'): BarcodeConfig => {
  switch (size) {
    case 'small':
      return { width: 1, height: 40, displayValue: true, fontSize: 8, margin: 5 }
    case 'large':
      return { width: 3, height: 100, displayValue: true, fontSize: 16, margin: 15 }
    case 'medium':
    default:
      return { width: 2, height: 80, displayValue: true, fontSize: 12, margin: 10 }
  }
}

export default function SimpleBarcode({ 
  barcode, 
  barcodeType = 'CODE128',
  productName,
  size = 'medium',
  showControls = true
}: SimpleBarcodeProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showValue, setShowValue] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (barcode && canvasRef.current) {
      generateBarcode()
    }
  }, [barcode, barcodeType, size, showValue])

  const generateBarcode = async () => {
    if (!barcode || !canvasRef.current) {
      setError('No barcode provided or canvas not ready')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Dynamic import to ensure JsBarcode is available
      const JsBarcode = (await import('jsbarcode')).default

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Get size configuration
      const config = getSizeConfig(size)
      
      // Set canvas size based on configuration
      canvas.width = 400
      canvas.height = config.height + (config.displayValue && showValue ? 30 : 10) + (config.margin * 2)

      // Clear canvas with white background
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      console.log('Generating barcode:', { barcode, barcodeType, config })

      // Prepare barcode data
      let processedBarcode = barcode.trim()
      let format = barcodeType.toUpperCase()

      // Auto-correct and validate common issues
      if (format === 'UPC') {
        processedBarcode = processedBarcode.replace(/[^0-9]/g, '')
        if (processedBarcode.length < 12) {
          processedBarcode = processedBarcode.padStart(12, '0')
        }
        if (processedBarcode.length > 12) {
          processedBarcode = processedBarcode.slice(0, 12)
        }
      }
      
      if (format === 'EAN13') {
        processedBarcode = processedBarcode.replace(/[^0-9]/g, '')
        if (processedBarcode.length < 13) {
          processedBarcode = processedBarcode.padStart(13, '0')
        }
        if (processedBarcode.length > 13) {
          processedBarcode = processedBarcode.slice(0, 13)
        }
      }
      
      if (format === 'CODE39') {
        processedBarcode = processedBarcode.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '')
        if (processedBarcode.length === 0) {
          throw new Error('No valid CODE39 characters found')
        }
      }

      // Validate barcode length for display
      if (processedBarcode.length === 0) {
        throw new Error('Barcode cannot be empty after processing')
      }

      // Generate the barcode using JsBarcode
      JsBarcode(canvas, processedBarcode, {
        format: format,
        width: config.width,
        height: config.height,
        displayValue: config.displayValue && showValue,
        fontSize: config.fontSize,
        textMargin: 8,
        margin: config.margin,
        background: '#ffffff',
        lineColor: '#000000',
        fontOptions: 'bold',
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        valid: (valid: boolean) => {
          console.log('JsBarcode validation result:', valid)
          if (!valid) {
            throw new Error(`Invalid barcode: ${processedBarcode} for format ${format}`)
          }
        }
      })

      console.log('✅ Barcode generated successfully:', processedBarcode)
      setError(null)
      setIsInitialized(true)

    } catch (err) {
      console.error('❌ Barcode generation failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate barcode'
      setError(errorMessage)
      
      // Draw error message on canvas
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        // Set canvas size for error display
        canvas.width = 400
        canvas.height = 100
        
        // Clear with white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw error
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('⚠️ Barcode Generation Failed', canvas.width / 2, canvas.height / 2 - 10)
        ctx.font = '11px Arial'
        ctx.fillStyle = '#666666'
        ctx.fillText(errorMessage.slice(0, 50), canvas.width / 2, canvas.height / 2 + 15)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const copyBarcode = async () => {
    try {
      await navigator.clipboard.writeText(barcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy barcode:', err)
    }
  }

  const toggleValueDisplay = () => {
    setShowValue(!showValue)
  }

  if (!barcode || barcode.trim() === '') {
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
            <div className="text-xs text-red-600 mt-1">
              Check that your barcode is valid for the {barcodeType} format
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!error && isInitialized && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div className="text-sm text-green-800">
            Barcode generated successfully ({barcodeType} format)
          </div>
        </div>
      )}

      {/* Barcode Display */}
      <div className={`bg-white border border-gray-300 rounded-lg shadow-sm text-center transition-all duration-200 ${
        size === 'small' ? 'p-2' : size === 'large' ? 'p-6' : 'p-4'
      }`}>
        {/* Product Name */}
        {productName && (
          <div className={`font-medium text-gray-900 mb-3 truncate ${
            size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'
          }`}>
            {productName}
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Generating barcode...</span>
          </div>
        )}

        {/* Barcode Canvas */}
        {!isLoading && (
          <div className="flex justify-center mb-3">
            <canvas
              ref={canvasRef}
              className="border border-gray-100 bg-white rounded"
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        )}

        {/* Barcode Info */}
        <div className={`text-gray-500 bg-gray-50 rounded ${
          size === 'small' ? 'py-1 px-2 text-xs' : 'py-2 px-3 text-xs'
        }`}>
          <div className="font-medium">{barcodeType} Format</div>
          {showValue && (
            <div className="font-mono mt-1 break-all">{barcode}</div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      {showControls && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyBarcode}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleValueDisplay}
            className="flex items-center gap-2"
          >
            {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showValue ? 'Hide Value' : 'Show Value'}
          </Button>
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
          <summary className="cursor-pointer font-medium">Debug Information</summary>
          <div className="mt-2 space-y-1 font-mono">
            <div><strong>Original:</strong> {barcode}</div>
            <div><strong>Type:</strong> {barcodeType}</div>
            <div><strong>Size:</strong> {size}</div>
            <div><strong>Canvas Ready:</strong> {canvasRef.current ? 'Yes' : 'No'}</div>
            <div><strong>Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {error || 'None'}</div>
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
          </div>
        </details>
      )}
    </div>
  )
}