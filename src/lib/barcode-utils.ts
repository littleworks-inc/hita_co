// =====================================
// Complete Barcode Utilities
// src/lib/barcode-utils.ts
// =====================================

export interface BarcodeValidationResult {
  isValid: boolean
  error?: string
  correctedCode?: string
  suggestion?: string
}

export interface BarcodeFormatInfo {
  name: string
  description: string
  minLength: number
  maxLength: number
  allowedChars: string
  hasCheckDigit: boolean
  useCases: string[]
}

// ✅ Barcode format information
export const BARCODE_FORMATS: Record<string, BarcodeFormatInfo> = {
  UPC: {
    name: 'UPC (Universal Product Code)',
    description: 'Standard US retail barcode',
    minLength: 11,
    maxLength: 12,
    allowedChars: '0-9',
    hasCheckDigit: true,
    useCases: ['Retail products', 'Grocery items', 'US market']
  },
  EAN13: {
    name: 'EAN-13 (European Article Number)',
    description: 'International retail barcode',
    minLength: 12,
    maxLength: 13,
    allowedChars: '0-9',
    hasCheckDigit: true,
    useCases: ['International retail', 'Books', 'Global market']
  },
  CODE128: {
    name: 'Code 128',
    description: 'High-density alphanumeric barcode',
    minLength: 1,
    maxLength: 80,
    allowedChars: 'ASCII 0-127',
    hasCheckDigit: false,
    useCases: ['Shipping', 'Inventory', 'Internal tracking']
  },
  CODE39: {
    name: 'Code 39',
    description: 'Alphanumeric barcode with limited character set',
    minLength: 1,
    maxLength: 43,
    allowedChars: '0-9, A-Z, -.$/+% and space',
    hasCheckDigit: false,
    useCases: ['Industrial', 'Government', 'Asset tracking']
  }
}

/**
 * Main validation function that routes to specific validators
 */
export const validateBarcode = (code: string, type: string): BarcodeValidationResult => {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  const normalizedType = type.toUpperCase()
  
  switch (normalizedType) {
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

/**
 * Validate UPC (Universal Product Code)
 * Format: 12 digits with check digit
 */
export const validateUPC = (code: string): BarcodeValidationResult => {
  // Remove spaces, hyphens, and non-digits
  const cleanCode = code.replace(/[\s\-]/g, '').replace(/\D/g, '')
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'UPC cannot be empty' }
  }
  
  if (cleanCode.length < 11) {
    return { 
      isValid: false, 
      error: `UPC too short (${cleanCode.length} digits). Need at least 11 digits.`,
      suggestion: 'Pad with leading zeros to make 11 digits'
    }
  }
  
  if (cleanCode.length === 11) {
    // Calculate and append check digit
    const checkDigit = calculateUPCCheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added check digit: ${checkDigit}`
    }
  }
  
  if (cleanCode.length === 12) {
    // Validate existing check digit
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
    // Truncate to 12 digits and validate
    const truncated = cleanCode.substring(0, 12)
    return {
      ...validateUPC(truncated),
      suggestion: `Truncated from ${cleanCode.length} to 12 digits`
    }
  }
  
  return { isValid: false, error: `Invalid UPC length: ${cleanCode.length}` }
}

/**
 * Validate EAN-13 (European Article Number)
 * Format: 13 digits with check digit
 */
export const validateEAN13 = (code: string): BarcodeValidationResult => {
  const cleanCode = code.replace(/[\s\-]/g, '').replace(/\D/g, '')
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'EAN-13 cannot be empty' }
  }
  
  if (cleanCode.length < 12) {
    return { 
      isValid: false, 
      error: `EAN-13 too short (${cleanCode.length} digits). Need at least 12 digits.`,
      suggestion: 'Pad with leading zeros to make 12 digits'
    }
  }
  
  if (cleanCode.length === 12) {
    // Calculate and append check digit
    const checkDigit = calculateEAN13CheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added check digit: ${checkDigit}`
    }
  }
  
  if (cleanCode.length === 13) {
    // Validate existing check digit
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
    // Truncate to 13 digits and validate
    const truncated = cleanCode.substring(0, 13)
    return {
      ...validateEAN13(truncated),
      suggestion: `Truncated from ${cleanCode.length} to 13 digits`
    }
  }
  
  return { isValid: false, error: `Invalid EAN-13 length: ${cleanCode.length}` }
}

/**
 * Validate CODE128
 * Format: Variable length alphanumeric (ASCII 0-127)
 */
export const validateCODE128 = (code: string): BarcodeValidationResult => {
  if (code.length === 0) {
    return { isValid: false, error: 'CODE128 cannot be empty' }
  }
  
  if (code.length > 80) {
    return { 
      isValid: false, 
      error: `CODE128 too long (${code.length} characters). Maximum 80 characters recommended.`
    }
  }
  
  // Check for valid ASCII characters (0-127)
  const invalidChars = code.split('').filter(char => char.charCodeAt(0) > 127)
  
  if (invalidChars.length > 0) {
    return { 
      isValid: false, 
      error: `CODE128 contains invalid characters: ${invalidChars.join(', ')}`,
      suggestion: 'Use only ASCII characters (letters, numbers, basic symbols)'
    }
  }
  
  return { 
    isValid: true, 
    correctedCode: code,
    suggestion: code.length > 40 ? 'Long barcodes may be harder to scan' : undefined
  }
}

/**
 * Validate CODE39
 * Format: Limited character set (0-9, A-Z, -.$/+% and space)
 */
export const validateCODE39 = (code: string): BarcodeValidationResult => {
  if (code.length === 0) {
    return { isValid: false, error: 'CODE39 cannot be empty' }
  }
  
  if (code.length > 43) {
    return { 
      isValid: false, 
      error: `CODE39 too long (${code.length} characters). Maximum 43 characters recommended.`
    }
  }
  
  // CODE39 valid characters: 0-9, A-Z, space, and symbols: - . $ / + %
  const validPattern = /^[0-9A-Z\-\.\$\/\+\%\s]*$/
  const upperCode = code.toUpperCase()
  
  if (!validPattern.test(upperCode)) {
    const invalidChars = upperCode.split('').filter(char => !validPattern.test(char))
    return { 
      isValid: false, 
      error: `CODE39 contains invalid characters: ${invalidChars.join(', ')}`,
      suggestion: 'Allowed characters: 0-9, A-Z, space, and symbols: - . $ / + %'
    }
  }
  
  return { 
    isValid: true, 
    correctedCode: upperCode,
    suggestion: upperCode !== code ? 'Converted to uppercase' : undefined
  }
}

/**
 * Calculate UPC check digit
 * UPC Algorithm: Multiply odd positions by 3, sum all, take modulo 10, subtract from 10
 */
export const calculateUPCCheckDigit = (code: string): number => {
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

/**
 * Calculate EAN-13 check digit
 * EAN13 Algorithm: Multiply even positions by 3, sum all, take modulo 10, subtract from 10
 */
export const calculateEAN13CheckDigit = (code: string): number => {
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

/**
 * Generate barcode from SKU with proper format validation
 */
export const generateBarcodeFromSKU = (
  sku: string, 
  preferredFormat: string = 'CODE128'
): BarcodeValidationResult => {
  if (!sku || sku.trim() === '') {
    return { isValid: false, error: 'SKU cannot be empty' }
  }
  
  // Clean SKU for barcode generation
  const cleanSKU = sku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  
  switch (preferredFormat.toUpperCase()) {
    case 'UPC':
      // Generate 11 digits, let system add check digit
      const upcBase = (cleanSKU + timestamp).replace(/[^0-9]/g, '').slice(0, 11).padStart(11, '0')
      return validateUPC(upcBase)
      
    case 'EAN13':
      // Generate 12 digits, let system add check digit
      const eanBase = (cleanSKU + timestamp).replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
      return validateEAN13(eanBase)
      
    case 'CODE39':
      // Use SKU directly (CODE39 supports alphanumeric)
      const code39Data = cleanSKU.slice(0, 20) // Reasonable length
      return validateCODE39(code39Data)
      
    case 'CODE128':
    default:
      // Use SKU + timestamp for uniqueness
      const code128Data = `${cleanSKU}${timestamp}`.slice(0, 40)
      return validateCODE128(code128Data)
  }
}

/**
 * Get barcode format recommendations based on use case
 */
export const getBarcodeFormatRecommendation = (useCase: string): string => {
  const recommendations: Record<string, string> = {
    retail: 'UPC',
    international: 'EAN13',
    inventory: 'CODE128',
    warehouse: 'CODE128',
    shipping: 'CODE128',
    internal: 'CODE39',
    assets: 'CODE39',
    books: 'EAN13',
    grocery: 'UPC'
  }
  
  return recommendations[useCase.toLowerCase()] || 'CODE128'
}

/**
 * Generate random valid barcode for testing
 */
export const generateRandomBarcode = (format: string): BarcodeValidationResult => {
  switch (format.toUpperCase()) {
    case 'UPC':
      const upcDigits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
      return validateUPC(upcDigits)
      
    case 'EAN13':
      const eanDigits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
      return validateEAN13(eanDigits)
      
    case 'CODE39':
      const code39Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const code39Length = Math.floor(Math.random() * 10) + 5 // 5-15 chars
      const code39Data = Array.from({ length: code39Length }, () => 
        code39Chars[Math.floor(Math.random() * code39Chars.length)]
      ).join('')
      return validateCODE39(code39Data)
      
    case 'CODE128':
    default:
      const code128Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const code128Length = Math.floor(Math.random() * 15) + 8 // 8-23 chars
      const code128Data = Array.from({ length: code128Length }, () => 
        code128Chars[Math.floor(Math.random() * code128Chars.length)]
      ).join('')
      return validateCODE128(code128Data)
  }
}

/**
 * Check if barcode format supports images/logos
 */
export const supportsDataMatrix = (format: string): boolean => {
  const dataMatrixFormats = ['CODE128', 'CODE39']
  return dataMatrixFormats.includes(format.toUpperCase())
}

/**
 * Get optimal barcode dimensions for printing
 */
export const getOptimalDimensions = (
  format: string, 
  printSize: 'small' | 'medium' | 'large' = 'medium'
): { width: number; height: number; dpi: number } => {
  const baseDimensions = {
    UPC: { width: 300, height: 100 },
    EAN13: { width: 300, height: 100 },
    CODE128: { width: 400, height: 80 },
    CODE39: { width: 400, height: 80 }
  }
  
  const sizeMultipliers = {
    small: 0.7,
    medium: 1.0,
    large: 1.5
  }
  
  const base = baseDimensions[format.toUpperCase()] || baseDimensions.CODE128
  const multiplier = sizeMultipliers[printSize]
  
  return {
    width: Math.round(base.width * multiplier),
    height: Math.round(base.height * multiplier),
    dpi: 300 // Standard print DPI
  }
}

/**
 * Validate barcode readability score (0-100)
 */
export const calculateReadabilityScore = (
  code: string, 
  format: string, 
  printQuality: 'low' | 'medium' | 'high' = 'medium'
): number => {
  let score = 100
  
  // Length penalties
  if (format === 'CODE39' && code.length > 20) score -= 20
  if (format === 'CODE128' && code.length > 30) score -= 15
  if (code.length > 40) score -= 25
  
  // Character complexity penalties
  const specialChars = (code.match(/[^A-Z0-9]/g) || []).length
  score -= specialChars * 2
  
  // Print quality adjustments
  const qualityMultipliers = { low: 0.7, medium: 0.9, high: 1.0 }
  score *= qualityMultipliers[printQuality]
  
  // Format reliability adjustments
  const formatReliability = {
    UPC: 0.95,
    EAN13: 0.95,
    CODE128: 0.90,
    CODE39: 0.85
  }
  score *= formatReliability[format.toUpperCase()] || 0.85
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Get troubleshooting tips for barcode issues
 */
export const getTroubleshootingTips = (
  validation: BarcodeValidationResult,
  format: string
): string[] => {
  const tips: string[] = []
  
  if (!validation.isValid) {
    tips.push('✓ Check barcode format matches the selected type')
    tips.push('✓ Verify all characters are valid for this format')
    
    if (format === 'UPC' || format === 'EAN13') {
      tips.push('✓ Ensure numeric-only input for UPC/EAN13')
      tips.push('✓ Check digit length (UPC: 11-12, EAN13: 12-13)')
    }
    
    if (format === 'CODE39') {
      tips.push('✓ Use only: 0-9, A-Z, and symbols: - . $ / + %')
      tips.push('✓ Avoid lowercase letters (will be converted)')
    }
    
    if (format === 'CODE128') {
      tips.push('✓ Avoid special Unicode characters')
      tips.push('✓ Keep length under 40 characters for best scanning')
    }
  } else {
    tips.push('✓ Test print at actual size before mass production')
    tips.push('✓ Ensure good contrast between bars and background')
    tips.push('✓ Use high-quality printer for best results')
    tips.push('✓ Test scan with multiple devices to verify readability')
  }
  
  return tips
}

// Export all validation functions for external use
export {
  validateUPC,
  validateEAN13,
  validateCODE128,
  validateCODE39,
  calculateUPCCheckDigit,
  calculateEAN13CheckDigit
}