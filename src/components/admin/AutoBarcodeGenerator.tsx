// =====================================
// FIXED: Auto-Generate Barcode from SKU System
// src/components/admin/AutoBarcodeGenerator.tsx
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Zap, BarChart3, AlertCircle, CheckCircle, Info, Settings } from 'lucide-react'
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

// ✅ ENHANCED: Complete barcode generation from SKU
const generateBarcodeFromSKU = (sku: string, format: string): BarcodeValidationResult => {
  if (!sku || sku.trim() === '') {
    return { isValid: false, error: 'SKU cannot be empty' }
  }

  // Clean and prepare SKU
  const cleanSKU = sku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  console.log('Generating barcode from SKU:', { sku, cleanSKU, format, timestamp })

  switch (format.toUpperCase()) {
    case 'UPC':
      // Generate 11 digits for UPC (system will add check digit)
      let upcBase = cleanSKU.replace(/[^0-9]/g, '') // Only digits for UPC
      if (upcBase.length < 11) {
        // Use timestamp and padding to create 11 digits
        upcBase = (upcBase + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 11).padStart(11, '0')
      } else {
        upcBase = upcBase.slice(0, 11)
      }
      return validateUPC(upcBase)
      
    case 'EAN13':
      // Generate 12 digits for EAN13 (system will add check digit)
      let eanBase = cleanSKU.replace(/[^0-9]/g, '') // Only digits for EAN13
      if (eanBase.length < 12) {
        // Use timestamp and padding to create 12 digits
        eanBase = (eanBase + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
      } else {
        eanBase = eanBase.slice(0, 12)
      }
      return validateEAN13(eanBase)
      
    case 'CODE39':
      // Use SKU directly (CODE39 supports alphanumeric but limited characters)
      const code39Data = cleanSKU.replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '').slice(0, 20) // CODE39 valid characters
      if (code39Data.length === 0) {
        return { isValid: false, error: 'SKU contains no valid CODE39 characters' }
      }
      return {
        isValid: true,
        correctedCode: code39Data,
        suggestion: `Generated from SKU using valid CODE39 characters`
      }
      
    case 'CODE128':
    default:
      // Use SKU + timestamp for uniqueness (CODE128 supports all ASCII)
      const code128Data = `${cleanSKU}${timestamp}`.slice(0, 40)
      return {
        isValid: true,
        correctedCode: code128Data,
        suggestion: `Generated from SKU + timestamp for uniqueness`
      }
  }
}

// ✅ COMPLETE: UPC validation with check digit calculation
const validateUPC = (code: string): BarcodeValidationResult => {
  const cleanCode = code.replace(/\D/g, '')
  
  if (cleanCode.length < 11) {
    return { isValid: false, error: `UPC needs at least 11 digits (got ${cleanCode.length})` }
  }
  
  if (cleanCode.length === 11) {
    const checkDigit = calculateUPCCheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added UPC check digit: ${checkDigit}`
    }
  }
  
  if (cleanCode.length === 12) {
    // Verify existing check digit
    const providedCheckDigit = parseInt(cleanCode[11])
    const calculatedCheckDigit = calculateUPCCheckDigit(cleanCode.slice(0, 11))
    
    if (providedCheckDigit === calculatedCheckDigit) {
      return {
        isValid: true,
        correctedCode: cleanCode,
        suggestion: 'UPC check digit verified'
      }
    } else {
      const correctedCode = cleanCode.slice(0, 11) + calculatedCheckDigit
      return {
        isValid: true,
        correctedCode,
        suggestion: `Fixed UPC check digit: ${providedCheckDigit} → ${calculatedCheckDigit}`
      }
    }
  }
  
  return { isValid: false, error: 'UPC must be 11 or 12 digits' }
}

// ✅ COMPLETE: EAN13 validation with check digit calculation  
const validateEAN13 = (code: string): BarcodeValidationResult => {
  const cleanCode = code.replace(/\D/g, '')
  
  if (cleanCode.length < 12) {
    return { isValid: false, error: `EAN13 needs at least 12 digits (got ${cleanCode.length})` }
  }
  
  if (cleanCode.length === 12) {
    const checkDigit = calculateEAN13CheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added EAN13 check digit: ${checkDigit}`
    }
  }
  
  if (cleanCode.length === 13) {
    // Verify existing check digit
    const providedCheckDigit = parseInt(cleanCode[12])
    const calculatedCheckDigit = calculateEAN13CheckDigit(cleanCode.slice(0, 12))
    
    if (providedCheckDigit === calculatedCheckDigit) {
      return {
        isValid: true,
        correctedCode: cleanCode,
        suggestion: 'EAN13 check digit verified'
      }
    } else {
      const correctedCode = cleanCode.slice(0, 12) + calculatedCheckDigit
      return {
        isValid: true,
        correctedCode,
        suggestion: `Fixed EAN13 check digit: ${providedCheckDigit} → ${calculatedCheckDigit}`
      }
    }
  }
  
  return { isValid: false, error: 'EAN13 must be 12 or 13 digits' }
}

// ✅ COMPLETE: UPC check digit calculation
const calculateUPCCheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    // UPC: Multiply odd positions (1st, 3rd, 5th...) by 3
    sum += (i % 2 === 0) ? digit * 3 : digit
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

// ✅ COMPLETE: EAN13 check digit calculation
const calculateEAN13CheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    // EAN13: Multiply even positions (2nd, 4th, 6th...) by 3
    sum += (i % 2 === 0) ? digit : digit * 3
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

// ✅ ENHANCED: Barcode format recommendations based on SKU analysis
const getBarcodeRecommendation = (sku: string) => {
  const hasLetters = /[A-Za-z]/.test(sku)
  const hasNumbers = /[0-9]/.test(sku)
  const skuLength = sku.length
  const onlyNumbers = /^[0-9]+$/.test(sku.replace(/[^A-Z0-9]/g, ''))
  
  if (onlyNumbers && skuLength >= 10) {
    return {
      format: 'EAN13',
      reason: 'SKU is numeric and long enough - EAN13 is perfect for retail',
      confidence: 'high'
    }
  } else if (onlyNumbers && skuLength >= 8) {
    return {
      format: 'UPC',
      reason: 'SKU is numeric - UPC is great for US retail',
      confidence: 'high'
    }
  } else if (hasLetters && hasNumbers) {
    return {
      format: 'CODE128',
      reason: 'SKU contains letters and numbers - CODE128 supports both efficiently',
      confidence: 'high'
    }
  } else if (hasLetters) {
    return {
      format: 'CODE39',
      reason: 'SKU contains letters - CODE39 supports alphanumeric characters',
      confidence: 'medium'
    }
  } else {
    return {
      format: 'CODE128',
      reason: 'CODE128 is versatile and works for any content',
      confidence: 'medium'
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
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Auto-generate barcode when SKU changes (if auto-generate is enabled)
  useEffect(() => {
    if (sku && autoGenerate && (!currentBarcode || currentBarcode.trim() === '')) {
      console.log('Auto-generating barcode for SKU:', sku)
      generateBarcode()
    }
  }, [sku, selectedFormat])

  // Update format when barcode type changes externally
  useEffect(() => {
    if (currentBarcodeType && currentBarcodeType !== selectedFormat) {
      setSelectedFormat(currentBarcodeType)
    }
  }, [currentBarcodeType])

  const generateBarcode = () => {
    if (!sku) {
      setValidationResult({ isValid: false, error: 'SKU is required to generate barcode' })
      return
    }

    setIsGenerating(true)
    
    // Simulate brief generation time for better UX
    setTimeout(() => {
      const result = generateBarcodeFromSKU(sku, selectedFormat)
      setValidationResult(result)
      
      if (result.isValid && result.correctedCode) {
        setGeneratedBarcode(result.correctedCode)
        onBarcodeGenerated(result.correctedCode, selectedFormat)
        console.log('✅ Barcode generated:', result.correctedCode)
      } else {
        console.log('❌ Barcode generation failed:', result.error)
      }
      
      setIsGenerating(false)
    }, 500)
  }

  const handleFormatChange = (newFormat: string) => {
    setSelectedFormat(newFormat)
    if (sku && autoGenerate) {
      // Re-generate with new format
      setTimeout(() => generateBarcode(), 100)
    }
  }

  const handleManualBarcodeChange = (newBarcode: string) => {
    onBarcodeGenerated(newBarcode, selectedFormat)
    setValidationResult(null) // Clear validation when manually entering
  }

  const recommendation = sku ? getBarcodeRecommendation(sku) : null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Automatic Barcode Generator
          {/* ✅ REMOVED Badge dependency - using simple span instead */}
          <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Enhanced
          </span>
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

        {/* Format Selection with Smart Recommendation */}
        <div className="space-y-3">
          <Label htmlFor="barcodeFormat">Barcode Format</Label>
          
          {recommendation && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              recommendation.confidence === 'high' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <CheckCircle className={`h-4 w-4 ${
                recommendation.confidence === 'high' ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <div className="flex-1">
                <span className={`text-sm font-medium ${
                  recommendation.confidence === 'high' ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  Recommended: {recommendation.format}
                </span>
                <div className={`text-xs ${
                  recommendation.confidence === 'high' ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {recommendation.reason}
                </div>
              </div>
            </div>
          )}
          
          <select
            id="barcodeFormat"
            value={selectedFormat}
            onChange={(e) => handleFormatChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="CODE128">CODE128 - Universal (Letters + Numbers)</option>
            <option value="CODE39">CODE39 - Simple Alphanumeric</option>
            <option value="EAN13">EAN13 - International Retail (13 digits)</option>
            <option value="UPC">UPC - US Retail (12 digits)</option>
          </select>
          
          {!showAdvanced && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(true)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <Settings className="h-3 w-3 mr-1" />
              Show format details
            </Button>
          )}
          
          {showAdvanced && (
            <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-md">
              <div><strong>CODE128:</strong> Best for mixed content, compact, widely supported</div>
              <div><strong>CODE39:</strong> Simple format, limited characters, larger size</div>
              <div><strong>EAN13:</strong> International standard, numbers only, retail POS</div>
              <div><strong>UPC:</strong> US/Canada standard, numbers only, grocery/retail</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(false)}
                className="text-xs text-gray-500 hover:text-gray-700 mt-2"
              >
                Hide details
              </Button>
            </div>
          )}
        </div>

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
              Auto-generate barcode when SKU changes
            </Label>
          </div>

          <Button
            type="button"
            onClick={generateBarcode}
            disabled={!sku || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Barcode...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Barcode from SKU
              </>
            )}
          </Button>
        </div>

        {/* Generation Result */}
        {validationResult && (
          <div className={`p-4 rounded-lg border ${
            validationResult.isValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
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
              <div className={`text-sm mt-1 ${
                validationResult.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {validationResult.error}
              </div>
            )}
            
            {validationResult.suggestion && (
              <div className="text-sm text-green-700 mt-1">
                💡 {validationResult.suggestion}
              </div>
            )}

            {validationResult.isValid && validationResult.correctedCode && (
              <div className="mt-3 p-2 bg-white rounded border">
                <div className="text-xs text-gray-500 mb-1">Generated Barcode:</div>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {validationResult.correctedCode}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Manual Barcode Input */}
        <div className="space-y-2">
          <Label htmlFor="manualBarcode">Manual Barcode Entry</Label>
          <Input
            id="manualBarcode"
            value={currentBarcode}
            onChange={(e) => handleManualBarcodeChange(e.target.value)}
            placeholder={`Enter ${selectedFormat} barcode manually`}
          />
          <div className="text-xs text-gray-500">
            You can also enter a barcode manually if you have an existing one
          </div>
        </div>

        {/* Barcode Preview */}
        {currentBarcode && (
          <div className="space-y-2">
            <Label>Live Barcode Preview</Label>
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
            <div className="text-sm text-gray-700 space-y-1">
              <div><strong>Generated:</strong> <code className="bg-gray-200 px-1 rounded">{generatedBarcode}</code></div>
              <div><strong>Format:</strong> {selectedFormat}</div>
              <div><strong>Source:</strong> SKU "{sku}"</div>
              <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}