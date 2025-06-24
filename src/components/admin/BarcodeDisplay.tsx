// =====================================
// FIXED: Complete Barcode System
// src/components/admin/BarcodeDisplay.tsx
// =====================================

'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Printer, Download, AlertCircle, CheckCircle } from 'lucide-react'
import JsBarcode from 'jsbarcode'

interface BarcodeDisplayProps {
  barcode: string
  barcodeType: string
  productName?: string
  price?: string
  size?: 'small' | 'medium' | 'large'
}

interface ValidationResult {
  isValid: boolean
  error?: string
  correctedCode?: string
  suggestion?: string
}

// ✅ FIXED: Complete validation functions
const validateBarcode = (code: string, type: string): ValidationResult => {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  switch (type.toUpperCase()) {
    case 'UPC':
      return validateUPC(code)
    case 'EAN13':
      return validateEAN13(code)
    case 'CODE128':
      return validateCODE128(code)
    case 'CODE39':
      return validateCODE39(code)
    default:
      return { isValid: false, error: `Unknown barcode type: ${type}` }
  }
}

const validateUPC = (code: string): ValidationResult => {
  const cleanCode = code.replace(/[\s\-]/g, '').replace(/\D/g, '')
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'UPC cannot be empty' }
  }
  
  if (cleanCode.length < 11) {
    return { 
      isValid: false, 
      error: `UPC too short (${cleanCode.length} digits). Need at least 11 digits.`,
      suggestion: 'Pad with leading zeros'
    }
  }
  
  if (cleanCode.length === 11) {
    const checkDigit = calculateUPCCheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added check digit: ${checkDigit}`
    }
  }
  
  if (cleanCode.length === 12) {
    const providedCheckDigit = parseInt(cleanCode[11])
    const calculatedCheckDigit = calculateUPCCheckDigit(cleanCode.substring(0, 11))
    
    if (providedCheckDigit === calculatedCheckDigit) {
      return { isValid: true, correctedCode: cleanCode }
    } else {
      const correctedCode = cleanCode.substring(0, 11) + calculatedCheckDigit
      return { 
        isValid: true, 
        correctedCode, 
        error: `Check digit corrected: ${providedCheckDigit} → ${calculatedCheckDigit}`
      }
    }
  }
  
  if (cleanCode.length > 12) {
    const truncated = cleanCode.substring(0, 12)
    return validateUPC(truncated)
  }
  
  return { isValid: false, error: `Invalid UPC length: ${cleanCode.length}` }
}

const validateEAN13 = (code: string): ValidationResult => {
  const cleanCode = code.replace(/[\s\-]/g, '').replace(/\D/g, '')
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'EAN-13 cannot be empty' }
  }
  
  if (cleanCode.length < 12) {
    return { 
      isValid: false, 
      error: `EAN-13 too short (${cleanCode.length} digits). Need at least 12 digits.`,
      suggestion: 'Pad with leading zeros'
    }
  }
  
  if (cleanCode.length === 12) {
    const checkDigit = calculateEAN13CheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added check digit: ${checkDigit}`
    }
  }
  
  if (cleanCode.length === 13) {
    const providedCheckDigit = parseInt(cleanCode[12])
    const calculatedCheckDigit = calculateEAN13CheckDigit(cleanCode.substring(0, 12))
    
    if (providedCheckDigit === calculatedCheckDigit) {
      return { isValid: true, correctedCode: cleanCode }
    } else {
      const correctedCode = cleanCode.substring(0, 12) + calculatedCheckDigit
      return { 
        isValid: true, 
        correctedCode, 
        error: `Check digit corrected: ${providedCheckDigit} → ${calculatedCheckDigit}`
      }
    }
  }
  
  if (cleanCode.length > 13) {
    const truncated = cleanCode.substring(0, 13)
    return validateEAN13(truncated)
  }
  
  return { isValid: false, error: `Invalid EAN-13 length: ${cleanCode.length}` }
}

const validateCODE128 = (code: string): ValidationResult => {
  if (code.length === 0) {
    return { isValid: false, error: 'CODE128 cannot be empty' }
  }
  
  if (code.length > 80) {
    return { 
      isValid: false, 
      error: `CODE128 too long (${code.length} characters). Maximum 80 characters.`
    }
  }
  
  // Check for valid ASCII characters (0-127)
  const invalidChars = code.split('').filter(char => char.charCodeAt(0) > 127)
  
  if (invalidChars.length > 0) {
    return { 
      isValid: false, 
      error: `Contains invalid characters: ${invalidChars.join(', ')}`,
      suggestion: 'Use only ASCII characters'
    }
  }
  
  return { 
    isValid: true, 
    correctedCode: code,
    suggestion: code.length > 40 ? 'Long barcodes may be harder to scan' : undefined
  }
}

const validateCODE39 = (code: string): ValidationResult => {
  if (code.length === 0) {
    return { isValid: false, error: 'CODE39 cannot be empty' }
  }
  
  if (code.length > 43) {
    return { 
      isValid: false, 
      error: `CODE39 too long (${code.length} characters). Maximum 43 characters.`
    }
  }
  
  // CODE39 valid characters: 0-9, A-Z, space, and symbols: - . $ / + %
  const validPattern = /^[0-9A-Z\-\.\$\/\+\%\s]*$/
  const upperCode = code.toUpperCase()
  
  if (!validPattern.test(upperCode)) {
    const invalidChars = upperCode.split('').filter(char => !validPattern.test(char))
    return { 
      isValid: false, 
      error: `Invalid characters: ${invalidChars.join(', ')}`,
      suggestion: 'Allowed: 0-9, A-Z, space, and symbols: - . $ / + %'
    }
  }
  
  return { 
    isValid: true, 
    correctedCode: upperCode,
    suggestion: upperCode !== code ? 'Converted to uppercase' : undefined
  }
}

// ✅ FIXED: Correct check digit calculations
const calculateUPCCheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    if (isNaN(digit)) continue
    // UPC: Multiply odd positions (1st, 3rd, 5th...) by 3
    sum += (i % 2 === 0) ? digit * 3 : digit
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

const calculateEAN13CheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    if (isNaN(digit)) continue
    // EAN13: Multiply even positions (2nd, 4th, 6th...) by 3
    sum += (i % 2 === 0) ? digit : digit * 3
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

export default function BarcodeDisplay({ 
  barcode, 
  barcodeType, 
  productName, 
  price,
  size = 'medium' 
}: BarcodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true })
  const [barcodeGenerated, setBarcodeGenerated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ✅ FIXED: Stable config object to prevent infinite re-renders
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

  // ✅ FIXED: Separate validation effect to prevent loops
  useEffect(() => {
    if (!barcode) {
      setValidation({ isValid: true })
      setBarcodeGenerated(false)
      return
    }

    console.log('Validating barcode:', { barcode, barcodeType })
    const result = validateBarcode(barcode, barcodeType)
    setValidation(result)
    setBarcodeGenerated(false) // Reset generation state when barcode changes
  }, [barcode, barcodeType])

  // ✅ FIXED: Separate generation effect with proper error handling
  useEffect(() => {
    if (!validation.isValid || !validation.correctedCode || !canvasRef.current || barcodeGenerated) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      console.log('Generating barcode:', validation.correctedCode, barcodeType)
      
      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Set canvas dimensions
      canvas.width = config.width
      canvas.height = config.height

      // Generate barcode with JsBarcode
      JsBarcode(canvas, validation.correctedCode, {
        format: barcodeType === 'EAN13' ? 'EAN13' : barcodeType.toUpperCase(),
        width: barcodeType === 'CODE39' ? 1.5 : 2,
        height: config.height - 40,
        displayValue: true,
        fontSize: config.fontSize,
        textMargin: config.textMargin,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
        valid: (valid) => {
          if (valid) {
            setBarcodeGenerated(true)
            console.log('Barcode generated successfully')
          } else {
            console.error('JsBarcode validation failed')
          }
        }
      })
    } catch (error) {
      console.error('Barcode generation error:', error)
      // Draw error message on canvas
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ef4444'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Barcode Generation Failed', canvas.width / 2, canvas.height / 2)
      ctx.fillText(error instanceof Error ? error.message : 'Unknown error', canvas.width / 2, canvas.height / 2 + 20)
    }
  }, [validation.isValid, validation.correctedCode, barcodeType, config, barcodeGenerated])

  // ✅ FIXED: Stable callback functions
  const copyBarcode = useCallback(() => {
    const codeToUse = validation.correctedCode || barcode
    navigator.clipboard.writeText(codeToUse).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }, [validation.correctedCode, barcode])

  const printBarcode = useCallback(() => {
    if (!canvasRef.current || !barcodeGenerated) return
    
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${productName || barcode}</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
              .barcode-container { margin: 20px auto; max-width: 400px; }
              .product-name { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
              .product-price { font-size: 18px; color: #059669; font-weight: bold; margin-top: 10px; }
              .barcode-info { font-size: 12px; color: #666; margin-top: 10px; }
              @media print { body { margin: 0; padding: 5px; } }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${productName ? `<div class="product-name">${productName}</div>` : ''}
              <img src="${dataURL}" alt="Barcode" style="max-width: 100%; height: auto;" />
              ${price ? `<div class="product-price">${price}</div>` : ''}
              <div class="barcode-info">${barcodeType} • ${validation.correctedCode || barcode}</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }, [barcodeGenerated, productName, price, barcodeType, validation.correctedCode, barcode])

  const downloadBarcode = useCallback(() => {
    if (!canvasRef.current || !barcodeGenerated) return

    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `barcode-${validation.correctedCode || barcode}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [barcodeGenerated, validation.correctedCode, barcode])

  // No barcode provided
  if (!barcode) {
    return (
      <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="text-sm">No barcode to display</div>
        <div className="text-xs text-gray-500 mt-1">Enter a barcode to generate</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Validation Messages */}
      {!validation.isValid && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-red-800">Invalid Barcode</div>
            <div className="text-sm text-red-700">{validation.error}</div>
            {validation.suggestion && (
              <div className="text-xs text-red-600 mt-1">💡 {validation.suggestion}</div>
            )}
          </div>
        </div>
      )}

      {validation.isValid && validation.error && (
        <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-yellow-800">Barcode Corrected</div>
            <div className="text-sm text-yellow-700">{validation.error}</div>
            {validation.suggestion && (
              <div className="text-xs text-yellow-600 mt-1">💡 {validation.suggestion}</div>
            )}
          </div>
        </div>
      )}

      {validation.isValid && !validation.error && validation.suggestion && (
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-blue-800">Barcode Generated</div>
            <div className="text-sm text-blue-700">{validation.suggestion}</div>
          </div>
        </div>
      )}

      {/* Barcode Display */}
      {validation.isValid && (
        <div className={`border border-gray-300 rounded-lg bg-white ${config.containerClass} text-center shadow-sm`}>
          {/* Product Name */}
          {productName && (
            <div className={`${config.nameClass} font-medium text-gray-900 mb-3 truncate`}>
              {productName}
            </div>
          )}
          
          {/* Barcode Canvas */}
          <div className="flex justify-center mb-3">
            <canvas 
              ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto' }}
              className="border border-gray-100 bg-white"
            />
          </div>
          
          {/* Price */}
          {price && (
            <div className={`${config.priceClass} text-green-600 mb-3`}>
              {price}
            </div>
          )}
          
          {/* Barcode Info */}
          <div className="text-xs text-gray-500 bg-gray-50 py-2 px-3 rounded">
            <div>{barcodeType} Format</div>
            <div className="font-mono mt-1">{validation.correctedCode || barcode}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {validation.isValid && barcodeGenerated && (
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
            onClick={printBarcode}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Label
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadBarcode}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
        </div>
      )}

      {/* Loading State */}
      {validation.isValid && !barcodeGenerated && validation.correctedCode && (
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">Generating barcode...</div>
        </div>
      )}
    </div>
  )
}