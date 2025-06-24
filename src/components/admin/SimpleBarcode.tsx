// =====================================
// Simple Working Barcode Component
// src/components/admin/SimpleBarcode.tsx
// =====================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, AlertCircle } from 'lucide-react'

interface SimpleBarcodeProps {
  barcode: string
  barcodeType?: string
  productName?: string
}

export default function SimpleBarcode({ 
  barcode, 
  barcodeType = 'CODE128',
  productName 
}: SimpleBarcodeProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    generateBarcode()
  }, [barcode, barcodeType])

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

      // Set canvas size
      canvas.width = 400
      canvas.height = 120

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      console.log('Generating barcode:', { barcode, barcodeType })

      // Simple validation
      let processedBarcode = barcode.trim()
      let format = barcodeType

      // Auto-correct common issues
      if (format === 'UPC' && processedBarcode.length < 12) {
        processedBarcode = processedBarcode.padStart(12, '0')
      }
      if (format === 'EAN13' && processedBarcode.length < 13) {
        processedBarcode = processedBarcode.padStart(13, '0')
      }
      if (format === 'CODE39') {
        processedBarcode = processedBarcode.toUpperCase()
      }

      // Generate the barcode
      JsBarcode(canvas, processedBarcode, {
        format: format,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 12,
        textMargin: 8,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
        valid: (valid: boolean) => {
          console.log('JsBarcode validation:', valid)
          if (!valid) {
            throw new Error(`Invalid barcode format for ${format}`)
          }
        }
      })

      console.log('✅ Barcode generated successfully')
      setError(null)

    } catch (err) {
      console.error('❌ Barcode generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate barcode')
      
      // Draw error on canvas
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ef4444'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Failed to Generate Barcode', canvas.width / 2, canvas.height / 2)
        ctx.font = '10px Arial'
        ctx.fillText(String(err), canvas.width / 2, canvas.height / 2 + 20)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const copyBarcode = () => {
    navigator.clipboard.writeText(barcode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!barcode) {
    return (
      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        No barcode to display
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <div>
            <div className="font-medium text-red-800">Barcode Generation Error</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Barcode Display */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
        {productName && (
          <div className="text-sm font-medium text-gray-900 mb-3">
            {productName}
          </div>
        )}
        
        <div className="flex justify-center mb-3">
          <canvas
            ref={canvasRef}
            className="border border-gray-100"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        {isLoading && (
          <div className="text-sm text-gray-500">Generating barcode...</div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 py-2 px-3 rounded">
          {barcodeType} • {barcode}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={copyBarcode}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <summary className="cursor-pointer">Debug Info</summary>
          <div className="mt-2 space-y-1">
            <div>Barcode: {barcode}</div>
            <div>Type: {barcodeType}</div>
            <div>Canvas Ready: {canvasRef.current ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
          </div>
        </details>
      )}
    </div>
  )
}