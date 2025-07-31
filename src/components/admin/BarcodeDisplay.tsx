// src/components/admin/BarcodeDisplay.tsx
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed multi-format validation
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Printer, Download, AlertCircle, CheckCircle } from 'lucide-react'

interface BarcodeDisplayProps {
  barcode: string
  barcodeType?: string // Always CODE128, kept for compatibility
  productName?: string
  price?: string
  size?: 'small' | 'medium' | 'large'
}

interface ValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

// Validate CODE128 barcode (simplified)
const validateCODE128 = (code: string): ValidationResult => {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  if (code.length > 80) {
    return { 
      isValid: false, 
      error: `CODE128 too long (${code.length} characters). Maximum 80 characters.`,
      suggestion: 'Shorten the barcode'
    }
  }

  // CODE128 accepts most ASCII characters
  const invalidChars = code.split('').filter(char => char.charCodeAt(0) > 127)
  
  if (invalidChars.length > 0) {
    return { 
      isValid: false, 
      error: `Contains invalid characters: ${invalidChars.join(', ')}`,
      suggestion: 'Use only ASCII characters (letters, numbers, basic symbols)'
    }
  }

  return { 
    isValid: true, 
    suggestion: code.length > 40 ? 'Long barcodes may be harder to scan' : undefined
  }
}

export default function BarcodeDisplay({ 
  barcode, 
  barcodeType = 'CODE128', // Always CODE128
  productName, 
  price,
  size = 'medium' 
}: BarcodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true })
  const [barcodeGenerated, setBarcodeGenerated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Size configurations
  const config = useMemo(() => {
    const configs = {
      small: {
        width: 200,
        height: 80,
        fontSize: 10,
        textMargin: 5,
        containerClass: 'p-2',
        nameClass: 'text-xs',
        priceClass: 'text-sm font-bold'
      },
      medium: {
        width: 300,
        height: 100,
        fontSize: 12,
        textMargin: 8,
        containerClass: 'p-3',
        nameClass: 'text-sm',
        priceClass: 'text-lg font-bold'
      },
      large: {
        width: 400,
        height: 120,
        fontSize: 14,
        textMargin: 10,
        containerClass: 'p-4',
        nameClass: 'text-base',
        priceClass: 'text-xl font-bold'
      }
    }
    return configs[size]
  }, [size])

  // Validate barcode when it changes
  useEffect(() => {
    if (!barcode) {
      setValidation({ isValid: true })
      setBarcodeGenerated(false)
      return
    }

    console.log('Validating CODE128 barcode:', barcode)
    const result = validateCODE128(barcode)
    setValidation(result)
    setBarcodeGenerated(false)
  }, [barcode])

  // Generate barcode visualization
  useEffect(() => {
    if (!validation.isValid || !barcode || !canvasRef.current || barcodeGenerated) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const generateBarcode = async () => {
      try {
        console.log('Generating CODE128 barcode:', barcode)
        
        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Set canvas dimensions
        canvas.width = config.width
        canvas.height = config.height

        // Dynamic import JsBarcode
        const JsBarcode = (await import('jsbarcode')).default

        if (!JsBarcode) {
          throw new Error('JsBarcode failed to load')
        }

        // Generate CODE128 barcode
        JsBarcode(canvas, barcode, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: config.fontSize,
          textMargin: config.textMargin,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000"
        })

        setBarcodeGenerated(true)
        console.log('✅ CODE128 barcode generated successfully')

      } catch (error) {
        console.error('❌ Barcode generation error:', error)
        
        // Draw error message on canvas
        ctx.fillStyle = '#fee2e2'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#dc2626'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Barcode Error', canvas.width / 2, canvas.height / 2)
        ctx.fillText('Check console', canvas.width / 2, canvas.height / 2 + 15)
      }
    }

    generateBarcode()
  }, [validation.isValid, barcode, config, barcodeGenerated])

  // Copy barcode to clipboard
  const copyBarcode = async () => {
    try {
      await navigator.clipboard.writeText(barcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Download barcode as image
  const downloadBarcode = () => {
    if (!canvasRef.current || !barcodeGenerated) return

    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `barcode-${barcode}-CODE128.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  // Print barcode
  const printBarcode = () => {
    if (!canvasRef.current || !barcodeGenerated) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CODE128 Barcode - ${barcode}</title>
          <style>
            body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
            .barcode-container { margin: 20px auto; }
            img { max-width: 100%; border: 1px solid #ddd; padding: 10px; }
            .info { margin: 10px 0; }
          </style>
        </head>
        <body>
          ${productName ? `<h3>${productName}</h3>` : ''}
          <div class="barcode-container">
            <img src="${dataUrl}" alt="CODE128 Barcode ${barcode}" />
          </div>
          <div class="info">Barcode: ${barcode}</div>
          <div class="info">Format: CODE128</div>
          ${price ? `<div class="info">Price: ${price}</div>` : ''}
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=600,height=400')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  if (!barcode) {
    return (
      <div className={`border border-gray-200 rounded-lg ${config.containerClass}`}>
        <div className="text-center text-gray-500">
          <div className="text-sm">No barcode to display</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-gray-200 rounded-lg ${config.containerClass}`}>
      {/* Product Info */}
      {(productName || price) && (
        <div className="mb-3 text-center">
          {productName && <div className={`font-medium text-gray-900 ${config.nameClass}`}>{productName}</div>}
          {price && <div className={`text-green-600 ${config.priceClass}`}>{price}</div>}
        </div>
      )}

      {/* Validation Status */}
      {!validation.isValid && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <div className="font-medium">Invalid CODE128 Barcode</div>
            <div>{validation.error}</div>
            {validation.suggestion && (
              <div className="text-red-700 mt-1">💡 {validation.suggestion}</div>
            )}
          </div>
        </div>
      )}

      {validation.isValid && validation.suggestion && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            💡 {validation.suggestion}
          </div>
        </div>
      )}

      {/* Barcode Canvas */}
      <div className="mb-3 text-center bg-white border rounded p-2">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Barcode Info */}
      <div className="mb-3 text-center">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Format: <span className="font-mono bg-blue-100 text-blue-800 px-1 rounded">CODE128</span></div>
          <div>Value: <span className="font-mono bg-gray-100 px-1 rounded">{barcode}</span></div>
          <div>Length: {barcode.length} characters</div>
        </div>
      </div>

      {/* Action Buttons */}
      {validation.isValid && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyBarcode}
            className="text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadBarcode}
            disabled={!barcodeGenerated}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={printBarcode}
            disabled={!barcodeGenerated}
            className="text-xs"
          >
            <Printer className="h-3 w-3 mr-1" />
            Print
          </Button>
        </div>
      )}

      {/* Success Status */}
      {validation.isValid && barcodeGenerated && (
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          CODE128 barcode ready
        </div>
      )}
    </div>
  )
}