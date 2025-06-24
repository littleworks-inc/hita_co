// =====================================
// Auto-Generate Barcode from SKU System
// src/components/admin/AutoBarcodeGenerator.tsx
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Zap, BarChart3, AlertCircle, CheckCircle, Info } from 'lucide-react'
import SimpleBarcode from './SimpleBarcode'

interface AutoBarcodeGeneratorProps {
  sku: string
  currentBarcode: string
  currentBarcodeType: string
  onBarcodeGenerated: (barcode: string, barcodeType: string) => void
  productName?: string
}

interface BarcodeValidationResult {
  isValid: boolean
  error?: string
  correctedCode?: string
  suggestion?: string
}

// Enhanced barcode generation from SKU
const generateBarcodeFromSKU = (sku: string, format: string): BarcodeValidationResult => {
  if (!sku || sku.trim() === '') {
    return { isValid: false, error: 'SKU cannot be empty' }
  }

  // Clean and prepare SKU
  const cleanSKU = sku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
  
  console.log('Generating barcode from SKU:', { sku, cleanSKU, format })

  switch (format.toUpperCase()) {
    case 'UPC':
      // Generate 11 digits for UPC (system will add check digit)
      let upcBase = cleanSKU.replace(/[^0-9]/g, '') // Only digits for UPC
      if (upcBase.length < 11) {
        upcBase = (upcBase + timestamp).slice(0, 11).padStart(11, '0')
      } else {
        upcBase = upcBase.slice(0, 11)
      }
      return validateUPC(upcBase)
      
    case 'EAN13':
      // Generate 12 digits for EAN13 (system will add check digit)
      let eanBase = cleanSKU.replace(/[^0-9]/g, '') // Only digits for EAN13
      if (eanBase.length < 12) {
        eanBase = (eanBase + timestamp).slice(0, 12).padStart(12, '0')
      } else {
        eanBase = eanBase.slice(0, 12)
      }
      return validateEAN13(eanBase)
      
    case 'CODE39':
      // Use SKU directly (CODE39 supports alphanumeric)
      const code39Data = cleanSKU.slice(0, 20) // Reasonable length
      return {
        isValid: true,
        correctedCode: code39Data,
        suggestion: 'Generated from SKU (alphanumeric)'
      }
      
    case 'CODE128':
    default:
      // Use SKU + timestamp for uniqueness
      const code128Data = `${cleanSKU}${timestamp}`.slice(0, 40)
      return {
        isValid: true,
        correctedCode: code128Data,
        suggestion: 'Generated from SKU + timestamp'
      }
  }
}

// UPC validation with check digit calculation
const validateUPC = (code: string): BarcodeValidationResult => {
  const cleanCode = code.replace(/\D/g, '')
  
  if (cleanCode.length === 11) {
    const checkDigit = calculateUPCCheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added UPC check digit: ${checkDigit}`
    }
  }
  
  return { isValid: false, error: 'UPC generation failed' }
}

// EAN13 validation with check digit calculation  
const validateEAN13 = (code: string): BarcodeValidationResult => {
  const cleanCode = code.replace(/\D/g, '')
  
  if (cleanCode.length === 12) {
    const checkDigit = calculateEAN13CheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added EAN13 check digit: ${checkDigit}`
    }
  }
  
  return { isValid: false, error: 'EAN13 generation failed' }
}

// UPC check digit calculation
const calculateUPCCheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    sum += (i % 2 === 0) ? digit * 3 : digit
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

// EAN13 check digit calculation
const calculateEAN13CheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    sum += (i % 2 === 0) ? digit : digit * 3
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

// Barcode format recommendations
const getBarcodeRecommendation = (sku: string) => {
  const hasLetters = /[A-Za-z]/.test(sku)
  const hasNumbers = /[0-9]/.test(sku)
  
  if (hasLetters && hasNumbers) {
    return {
      format: 'CODE128',
      reason: 'SKU contains letters and numbers - CODE128 supports both'
    }
  } else if (hasNumbers && !hasLetters) {
    return {
      format: 'EAN13',
      reason: 'SKU is numeric - EAN13 is great for retail'
    }
  } else {
    return {
      format: 'CODE39',
      reason: 'SKU format requires alphanumeric support'
    }
  }
}

export default function AutoBarcodeGenerator({ 
  sku, 
  currentBarcode, 
  currentBarcodeType,
  onBarcodeGenerated, 
  productName 
}: AutoBarcodeGeneratorProps) {
  const [selectedFormat, setSelectedFormat] = useState(currentBarcodeType || 'CODE128')
  const [generatedBarcode, setGeneratedBarcode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [validationResult, setValidationResult] = useState<BarcodeValidationResult | null>(null)
  const [autoGenerate, setAutoGenerate] = useState(true)

  // Auto-generate barcode when SKU changes (if auto-generate is enabled)
  useEffect(() => {
    if (sku && autoGenerate && !currentBarcode) {
      generateBarcode()
    }
  }, [sku, selectedFormat, autoGenerate])

  const generateBarcode = () => {
    if (!sku) {
      setValidationResult({ isValid: false, error: 'SKU is required to generate barcode' })
      return
    }

    setIsGenerating(true)
    
    // Simulate brief generation time for UX
    setTimeout(() => {
      const result = generateBarcodeFromSKU(sku, selectedFormat)
      setValidationResult(result)
      
      if (result.isValid && result.correctedCode) {
        setGeneratedBarcode(result.correctedCode)
        onBarcodeGenerated(result.correctedCode, selectedFormat)
      }
      
      setIsGenerating(false)
    }, 300)
  }

  const recommendation = sku ? getBarcodeRecommendation(sku) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Barcode Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* SKU Display */}
        {sku && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
              <Info className="h-4 w-4" />
              Source SKU: <code className="bg-blue-100 px-2 py-1 rounded">{sku}</code>
            </div>
          </div>
        )}

        {/* Format Selection with Recommendation */}
        <div className="space-y-3">
          <Label htmlFor="barcodeFormat">Barcode Format</Label>
          
          {recommendation && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                <strong>Recommended:</strong> {recommendation.format} - {recommendation.reason}
              </span>
            </div>
          )}
          
          <select
            id="barcodeFormat"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CODE128">CODE128 - Universal (Letters + Numbers)</option>
            <option value="CODE39">CODE39 - Simple Alphanumeric</option>
            <option value="EAN13">EAN13 - International Retail (13 digits)</option>
            <option value="UPC">UPC - US Retail (12 digits)</option>
          </select>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>CODE128:</strong> Best for SKUs with letters and numbers</div>
            <div><strong>CODE39:</strong> Simple format, uppercase letters only</div>
            <div><strong>EAN13:</strong> International standard, numbers only</div>
            <div><strong>UPC:</strong> US retail standard, numbers only</div>
          </div>
        </div>

        {/* Auto-Generate Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoGenerate"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="autoGenerate" className="text-sm">
            Auto-generate barcode when SKU changes
          </Label>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateBarcode}
          disabled={!sku || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              {currentBarcode ? 'Regenerate' : 'Generate'} Barcode from SKU
            </>
          )}
        </Button>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-3 rounded-lg border ${
            validationResult.isValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                validationResult.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.isValid ? 'Barcode Generated Successfully' : 'Generation Failed'}
              </span>
            </div>
            
            {validationResult.error && (
              <div className="text-sm text-red-700 mt-1">{validationResult.error}</div>
            )}
            
            {validationResult.suggestion && (
              <div className="text-sm text-green-700 mt-1">💡 {validationResult.suggestion}</div>
            )}
          </div>
        )}

        {/* Manual Barcode Input */}
        <div className="space-y-2">
          <Label htmlFor="manualBarcode">Manual Barcode Entry</Label>
          <Input
            id="manualBarcode"
            value={currentBarcode}
            onChange={(e) => onBarcodeGenerated(e.target.value, selectedFormat)}
            placeholder={`Enter ${selectedFormat} barcode manually`}
          />
          <div className="text-xs text-gray-500">
            You can also enter a barcode manually if you have an existing one
          </div>
        </div>

        {/* Barcode Preview */}
        {currentBarcode && (
          <div className="space-y-2">
            <Label>Barcode Preview</Label>
            <SimpleBarcode
              barcode={currentBarcode}
              barcodeType={selectedFormat}
              productName={productName}
            />
          </div>
        )}

        {/* Generation Info */}
        {generatedBarcode && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-700">
              <div><strong>Generated:</strong> {generatedBarcode}</div>
              <div><strong>Format:</strong> {selectedFormat}</div>
              <div><strong>Source:</strong> SKU "{sku}"</div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

// Usage in ProductForm:
/*
// Add this to your ProductForm component:

import AutoBarcodeGenerator from './AutoBarcodeGenerator'

// In your JSX, replace the barcode section with:
<AutoBarcodeGenerator
  sku={formData.sku}
  currentBarcode={formData.barcode}
  currentBarcodeType={formData.barcodeType}
  onBarcodeGenerated={(barcode, barcodeType) => {
    handleInputChange('barcode', barcode)
    handleInputChange('barcodeType', barcodeType)
  }}
  productName={formData.name}
/>
*/