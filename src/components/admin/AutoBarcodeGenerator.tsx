// src/components/admin/AutoBarcodeGenerator.tsx
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed multiple format options
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Zap, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface AutoBarcodeGeneratorProps {
  sku: string
  currentBarcode: string
  currentBarcodeType?: string
  onBarcodeGenerated: (barcode: string, type: string) => void
  productName?: string
}

interface BarcodeValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

// Generate CODE128 barcode from SKU
const generateCODE128FromSKU = (sku: string): string => {
  if (!sku || sku.trim() === '') {
    return ''
  }

  // For CODE128, we can use the SKU directly with some enhancements
  const cleanSKU = sku.trim().toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  
  // Create a more readable barcode format
  let generatedBarcode = cleanSKU
  
  // If SKU is very short, add timestamp for uniqueness
  if (cleanSKU.length < 8) {
    generatedBarcode = `${cleanSKU}-${timestamp}`
  }
  
  // Limit length for practical scanning
  if (generatedBarcode.length > 30) {
    generatedBarcode = generatedBarcode.slice(0, 30)
  }

  return generatedBarcode
}

// Validate CODE128 barcode
const validateCODE128 = (code: string): BarcodeValidationResult => {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  if (code.length > 80) {
    return { 
      isValid: false, 
      error: `CODE128 too long (${code.length} characters). Maximum 80 characters.`,
      suggestion: 'Shorten the barcode or use a more concise SKU format'
    }
  }

  // CODE128 accepts almost any ASCII character
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

export default function AutoBarcodeGenerator({ 
  sku, 
  currentBarcode, 
  currentBarcodeType,
  onBarcodeGenerated, 
  productName 
}: AutoBarcodeGeneratorProps) {
  const [generatedBarcode, setGeneratedBarcode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [validationResult, setValidationResult] = useState<BarcodeValidationResult | null>(null)
  const [autoGenerate, setAutoGenerate] = useState(true)

  // Auto-generate barcode when SKU changes (if auto-generate is enabled)
  useEffect(() => {
    if (sku && autoGenerate && (!currentBarcode || currentBarcode.trim() === '')) {
      console.log('Auto-generating CODE128 barcode for SKU:', sku)
      generateBarcode()
    }
  }, [sku])

  // Validate current barcode when it changes
  useEffect(() => {
    if (currentBarcode) {
      const validation = validateCODE128(currentBarcode)
      setValidationResult(validation)
    }
  }, [currentBarcode])

  const generateBarcode = async () => {
    if (!sku || isGenerating) return

    setIsGenerating(true)

    try {
      // Simulate brief loading for UX
      await new Promise(resolve => setTimeout(resolve, 300))

      const newBarcode = generateCODE128FromSKU(sku)
      
      if (!newBarcode) {
        throw new Error('Failed to generate barcode from SKU')
      }

      // Validate the generated barcode
      const validation = validateCODE128(newBarcode)
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Generated barcode is invalid')
      }

      setGeneratedBarcode(newBarcode)
      setValidationResult(validation)

      // Call the parent handler
      onBarcodeGenerated(newBarcode, 'CODE128')

      console.log('✅ CODE128 barcode generated:', newBarcode)

    } catch (error) {
      console.error('❌ Barcode generation error:', error)
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown generation error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const useCurrentSKU = () => {
    if (sku) {
      onBarcodeGenerated(sku, 'CODE128')
      setValidationResult(validateCODE128(sku))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-blue-600" />
        <Label className="text-base font-medium">CODE128 Barcode Generator</Label>
      </div>

      {/* SKU Info */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          <div><strong>Source SKU:</strong> {sku || 'No SKU provided'}</div>
          <div className="text-xs text-blue-700 mt-1">
            CODE128 format supports letters, numbers, and symbols - perfect for any SKU format
          </div>
        </div>
      </div>

      {/* Current Barcode Validation */}
      {currentBarcode && validationResult && (
        <div className={`p-3 rounded-lg border ${
          validationResult.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {validationResult.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`text-sm font-medium ${
                validationResult.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                Current Barcode: {validationResult.isValid ? 'Valid' : 'Invalid'}
              </div>
              <div className={`text-xs ${
                validationResult.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {validationResult.error || validationResult.suggestion}
              </div>
              <div className="font-mono text-xs mt-1 p-1 bg-white rounded">
                {currentBarcode}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoGenerate"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="autoGenerate" className="text-sm">
            Auto-generate CODE128 barcode when SKU changes
          </Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={generateBarcode}
            disabled={!sku || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate CODE128
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={useCurrentSKU}
            disabled={!sku}
            className="flex-shrink-0"
          >
            Use SKU As-Is
          </Button>
        </div>
      </div>

      {/* Generated Barcode Preview */}
      {generatedBarcode && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-700 mb-2">
            <strong>Generated CODE128 Barcode:</strong>
          </div>
          <div className="font-mono text-sm bg-white p-2 rounded border">
            {generatedBarcode}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Length: {generatedBarcode.length} characters • Format: CODE128
          </div>
        </div>
      )}

      {/* FORMAT INFO */}
      <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
        <div className="font-medium text-gray-800 mb-1">About CODE128:</div>
        <div>• Universal format supporting letters, numbers, and symbols</div>
        <div>• Most widely compatible with barcode scanners</div>
        <div>• Perfect for SKUs, inventory codes, and product tracking</div>
        <div>• Compact and efficient encoding</div>
      </div>
    </div>
  )
}