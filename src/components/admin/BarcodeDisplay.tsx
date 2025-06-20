'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Printer, Download, AlertCircle } from 'lucide-react'
import JsBarcode from 'jsbarcode'

interface BarcodeDisplayProps {
  barcode: string
  barcodeType: string
  productName?: string
  price?: string
  size?: 'small' | 'medium' | 'large'
}

// Barcode validation utilities
const validateBarcode = (code: string, type: string): { isValid: boolean; error?: string; correctedCode?: string } => {
  switch (type) {
    case 'UPC':
      return validateUPC(code)
    case 'EAN13':
      return validateEAN13(code)
    case 'CODE128':
      return validateCODE128(code)
    case 'CODE39':
      return validateCODE39(code)
    default:
      return { isValid: false, error: 'Unknown barcode type' }
  }
}

const validateUPC = (code: string): { isValid: boolean; error?: string; correctedCode?: string } => {
  // Remove any non-digits
  const cleanCode = code.replace(/\D/g, '')
  
  if (cleanCode.length === 11) {
    // Calculate check digit
    const checkDigit = calculateUPCCheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { isValid: true, correctedCode }
  } else if (cleanCode.length === 12) {
    // Validate existing check digit
    const providedCheckDigit = parseInt(cleanCode[11])
    const calculatedCheckDigit = calculateUPCCheckDigit(cleanCode.substring(0, 11))
    
    if (providedCheckDigit === calculatedCheckDigit) {
      return { isValid: true, correctedCode: cleanCode }
    } else {
      const correctedCode = cleanCode.substring(0, 11) + calculatedCheckDigit
      return { isValid: true, correctedCode, error: `Check digit corrected from ${providedCheckDigit} to ${calculatedCheckDigit}` }
    }
  } else {
    return { isValid: false, error: 'UPC must be 11 or 12 digits' }
  }
}

const validateEAN13 = (code: string): { isValid: boolean; error?: string; correctedCode?: string } => {
  const cleanCode = code.replace(/\D/g, '')
  
  if (cleanCode.length === 12) {
    const checkDigit = calculateEAN13CheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { isValid: true, correctedCode }
  } else if (cleanCode.length === 13) {
    const providedCheckDigit = parseInt(cleanCode[12])
    const calculatedCheckDigit = calculateEAN13CheckDigit(cleanCode.substring(0, 12))
    
    if (providedCheckDigit === calculatedCheckDigit) {
      return { isValid: true, correctedCode: cleanCode }
    } else {
      const correctedCode = cleanCode.substring(0, 12) + calculatedCheckDigit
      return { isValid: true, correctedCode, error: `Check digit corrected from ${providedCheckDigit} to ${calculatedCheckDigit}` }
    }
  } else {
    return { isValid: false, error: 'EAN-13 must be 12 or 13 digits' }
  }
}

const validateCODE128 = (code: string): { isValid: boolean; error?: string; correctedCode?: string } => {
  if (code.length === 0) {
    return { isValid: false, error: 'CODE128 cannot be empty' }
  }
  
  // CODE128 supports ASCII characters 0-127
  const isValidChars = code.split('').every(char => char.charCodeAt(0) <= 127)
  
  if (!isValidChars) {
    return { isValid: false, error: 'CODE128 contains invalid characters' }
  }
  
  return { isValid: true, correctedCode: code }
}

const validateCODE39 = (code: string): { isValid: boolean; error?: string; correctedCode?: string } => {
  // CODE39 valid characters: 0-9, A-Z, space, and symbols: - . $ / + %
  const validChars = /^[0-9A-Z\-\.\$\/\+\%\s]*$/
  
  if (!validChars.test(code)) {
    return { isValid: false, error: 'CODE39 contains invalid characters. Allowed: 0-9, A-Z, -.$/+% and space' }
  }
  
  if (code.length === 0) {
    return { isValid: false, error: 'CODE39 cannot be empty' }
  }
  
  return { isValid: true, correctedCode: code.toUpperCase() }
}

// Check digit calculation functions
const calculateUPCCheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    sum += (i % 2 === 0) ? digit * 3 : digit
  }
  return (10 - (sum % 10)) % 10
}

const calculateEAN13CheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    sum += (i % 2 === 0) ? digit : digit * 3
  }
  return (10 - (sum % 10)) % 10
}

export default function BarcodeDisplay({ 
  barcode, 
  barcodeType, 
  productName, 
  price,
  size = 'medium' 
}: BarcodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string; correctedCode?: string }>({ isValid: true })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Size configurations
  const sizeConfigs = {
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

  const config = sizeConfigs[size]

  // Validate and generate barcode when barcode or type changes
  useEffect(() => {
    if (!barcode) {
      setValidation({ isValid: true })
      return
    }

    const result = validateBarcode(barcode, barcodeType)
    setValidation(result)

    // Generate barcode if valid
    if (result.isValid && result.correctedCode && canvasRef.current) {
      try {
        // Generate barcode on canvas
        JsBarcode(canvasRef.current, result.correctedCode, {
          format: barcodeType === 'EAN13' ? 'EAN13' : barcodeType,
          width: barcodeType === 'CODE39' ? 1.5 : 2,
          height: config.height - 40, // Leave space for text
          displayValue: true,
          fontSize: config.fontSize,
          textMargin: config.textMargin,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        })
      } catch (error) {
        console.error('Barcode generation error:', error)
        setValidation({ isValid: false, error: 'Failed to generate barcode' })
      }
    }
  }, [barcode, barcodeType, config])

  const copyBarcode = () => {
    const codeToUse = validation.correctedCode || barcode
    navigator.clipboard.writeText(codeToUse)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const printBarcode = () => {
    if (!canvasRef.current) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const canvas = canvasRef.current
      const dataURL = canvas.toDataURL('image/png')
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${productName || barcode}</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; }
              .barcode-container { margin: 20px auto; }
              .product-info { margin: 10px 0; font-family: Arial, sans-serif; }
              .product-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
              .product-price { font-size: 16px; color: #059669; font-weight: bold; }
              .barcode-info { font-size: 10px; color: #666; margin-top: 5px; }
              @media print { 
                body { margin: 0; padding: 5px; } 
                .barcode-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${productName ? `<div class="product-info"><div class="product-name">${productName}</div></div>` : ''}
              <img src="${dataURL}" alt="Barcode" style="max-width: 100%;" />
              ${price ? `<div class="product-info"><div class="product-price">${price}</div></div>` : ''}
              <div class="barcode-info">${barcodeType} • ${validation.correctedCode || barcode}</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const downloadBarcode = () => {
    if (!canvasRef.current) return

    // Create a high-resolution canvas for download
    const downloadCanvas = document.createElement('canvas')
    const ctx = downloadCanvas.getContext('2d')
    if (!ctx) return

    // Set high resolution
    const scale = 3
    downloadCanvas.width = config.width * scale
    downloadCanvas.height = (config.height + 60) * scale // Extra space for text

    // Fill white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height)

    // Generate high-res barcode
    const tempCanvas = document.createElement('canvas')
    try {
      JsBarcode(tempCanvas, validation.correctedCode || barcode, {
        format: barcodeType === 'EAN13' ? 'EAN13' : barcodeType,
        width: (barcodeType === 'CODE39' ? 1.5 : 2) * scale,
        height: (config.height - 20) * scale,
        displayValue: true,
        fontSize: config.fontSize * scale,
        textMargin: config.textMargin * scale,
        margin: 10 * scale,
        background: '#ffffff',
        lineColor: '#000000'
      })

      // Draw barcode on download canvas
      const barcodeY = productName ? 30 * scale : 10 * scale
      ctx.drawImage(tempCanvas, 
        (downloadCanvas.width - tempCanvas.width) / 2, 
        barcodeY
      )

      // Add product name if provided
      if (productName) {
        ctx.fillStyle = '#000000'
        ctx.font = `bold ${16 * scale}px Arial`
        ctx.textAlign = 'center'
        ctx.fillText(productName, downloadCanvas.width / 2, 20 * scale)
      }

      // Add price if provided
      if (price) {
        ctx.fillStyle = '#059669'
        ctx.font = `bold ${18 * scale}px Arial`
        ctx.textAlign = 'center'
        const priceY = barcodeY + tempCanvas.height + 25 * scale
        ctx.fillText(price, downloadCanvas.width / 2, priceY)
      }

      // Download the image
      const link = document.createElement('a')
      link.download = `barcode-${validation.correctedCode || barcode}.png`
      link.href = downloadCanvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) {
      console.error('Download generation error:', error)
    }
  }

  if (!barcode) {
    return (
      <div className="text-center text-gray-400 py-4">
        <div className="text-sm">No barcode generated</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Validation Error */}
      {!validation.isValid && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">{validation.error}</span>
        </div>
      )}

      {/* Validation Warning */}
      {validation.isValid && validation.error && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-700">{validation.error}</span>
        </div>
      )}

      {/* Barcode Display */}
      {validation.isValid && (
        <div className={`border border-gray-300 rounded-md bg-white ${config.containerClass} text-center`}>
          {/* Product Name */}
          {productName && (
            <div className={`${config.nameClass} font-medium text-gray-900 mb-2 truncate`}>
              {productName}
            </div>
          )}
          
          {/* Barcode Canvas */}
          <div className="flex justify-center mb-2">
            <canvas 
              ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto' }}
              className="border border-gray-100"
            />
          </div>
          
          {/* Price */}
          {price && (
            <div className={`${config.priceClass} text-green-600 mb-2`}>
              {price}
            </div>
          )}
          
          {/* Barcode Type */}
          <div className="text-xs text-gray-500">
            {barcodeType} • {validation.correctedCode || barcode}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {validation.isValid && (
        <div className="flex gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyBarcode}
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy'}
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
            onClick={downloadBarcode}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
        </div>
      )}

      {/* Info */}
      {validation.isValid && (
        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 text-center">
          <div>✅ Scannable with any barcode scanner</div>
          <div>📱 Compatible with POS systems</div>
          <div>🏷️ Perfect for price tags and inventory</div>
          <div>🎯 Auto-corrected check digits for accuracy</div>
        </div>
      )}
    </div>
  )
}