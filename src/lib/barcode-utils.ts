// =====================================
// COMPLETE: Barcode Utility Functions
// src/lib/barcode-utils.ts
// =====================================

export interface BarcodeValidationResult {
  isValid: boolean
  error?: string
  correctedCode?: string
  suggestion?: string
  format?: string
}

/**
 * Comprehensive barcode validation for all supported formats
 */
export const validateBarcode = (code: string, type: string): BarcodeValidationResult => {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  const cleanCode = code.trim()
  
  switch (type.toUpperCase()) {
    case 'UPC':
      return validateUPC(cleanCode)
    case 'EAN13':
      return validateEAN13(cleanCode)
    case 'CODE128':
      return validateCODE128(cleanCode)
    case 'CODE39':
      return validateCODE39(cleanCode)
    default:
      return { isValid: false, error: `Unsupported barcode type: ${type}` }
  }
}

/**
 * Validate UPC barcode with automatic check digit calculation
 */
export const validateUPC = (code: string): BarcodeValidationResult => {
  const cleanCode = code.replace(/[\s\-]/g, '').replace(/[^0-9]/g, '')
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'UPC must contain numbers' }
  }
  
  if (cleanCode.length < 11) {
    return { 
      isValid: false, 
      error: `UPC too short (${cleanCode.length} digits). Need at least 11 digits.` 
    }
  }
  
  if (cleanCode.length === 11) {
    // Add check digit
    const checkDigit = calculateUPCCheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added UPC check digit: ${checkDigit}`,
      format: 'UPC'
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
        suggestion: 'UPC check digit verified',
        format: 'UPC'
      }
    } else {
      const correctedCode = cleanCode.slice(0, 11) + calculatedCheckDigit
      return {
        isValid: true,
        correctedCode,
        suggestion: `Fixed UPC check digit: ${providedCheckDigit} → ${calculatedCheckDigit}`,
        format: 'UPC'
      }
    }
  }
  
  if (cleanCode.length > 12) {
    // Truncate to 12 digits and verify
    const truncated = cleanCode.slice(0, 12)
    return validateUPC(truncated)
  }
  
  return { isValid: false, error: 'UPC format error' }
}

/**
 * Validate EAN-13 barcode with automatic check digit calculation
 */
export const validateEAN13 = (code: string): BarcodeValidationResult => {
  const cleanCode = code.replace(/[\s\-]/g, '').replace(/[^0-9]/g, '')
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'EAN13 must contain numbers' }
  }
  
  if (cleanCode.length < 12) {
    return { 
      isValid: false, 
      error: `EAN13 too short (${cleanCode.length} digits). Need at least 12 digits.` 
    }
  }
  
  if (cleanCode.length === 12) {
    // Add check digit
    const checkDigit = calculateEAN13CheckDigit(cleanCode)
    const correctedCode = cleanCode + checkDigit
    return { 
      isValid: true, 
      correctedCode,
      suggestion: `Added EAN13 check digit: ${checkDigit}`,
      format: 'EAN13'
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
        suggestion: 'EAN13 check digit verified',
        format: 'EAN13'
      }
    } else {
      const correctedCode = cleanCode.slice(0, 12) + calculatedCheckDigit
      return {
        isValid: true,
        correctedCode,
        suggestion: `Fixed EAN13 check digit: ${providedCheckDigit} → ${calculatedCheckDigit}`,
        format: 'EAN13'
      }
    }
  }
  
  if (cleanCode.length > 13) {
    // Truncate to 13 digits and verify
    const truncated = cleanCode.slice(0, 13)
    return validateEAN13(truncated)
  }
  
  return { isValid: false, error: 'EAN13 format error' }
}

/**
 * Validate CODE39 barcode
 */
export const validateCODE39 = (code: string): BarcodeValidationResult => {
  const cleanCode = code.trim().toUpperCase()
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'CODE39 cannot be empty' }
  }
  
  // CODE39 valid characters: A-Z, 0-9, and special characters
  const validCharacters = /^[A-Z0-9\-\.\ \$\/\+\%]*$/
  
  if (!validCharacters.test(cleanCode)) {
    const filteredCode = cleanCode.replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '')
    if (filteredCode.length === 0) {
      return { 
        isValid: false, 
        error: 'No valid CODE39 characters found. Valid: A-Z, 0-9, -.$/+%' 
      }
    }
    return {
      isValid: true,
      correctedCode: filteredCode,
      suggestion: `Removed invalid characters. Original: "${cleanCode}" → Cleaned: "${filteredCode}"`,
      format: 'CODE39'
    }
  }
  
  if (cleanCode.length > 43) {
    const truncated = cleanCode.slice(0, 43)
    return {
      isValid: true,
      correctedCode: truncated,
      suggestion: `Truncated to 43 characters (CODE39 practical limit)`,
      format: 'CODE39'
    }
  }
  
  return {
    isValid: true,
    correctedCode: cleanCode,
    suggestion: 'Valid CODE39 barcode',
    format: 'CODE39'
  }
}

/**
 * Validate CODE128 barcode
 */
export const validateCODE128 = (code: string): BarcodeValidationResult => {
  const cleanCode = code.trim()
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'CODE128 cannot be empty' }
  }
  
  // CODE128 supports all ASCII characters (0-127)
  const hasInvalidChars = Array.from(cleanCode).some(char => char.charCodeAt(0) > 127)
  
  if (hasInvalidChars) {
    const filteredCode = Array.from(cleanCode)
      .filter(char => char.charCodeAt(0) <= 127)
      .join('')
    
    if (filteredCode.length === 0) {
      return { 
        isValid: false, 
        error: 'No valid ASCII characters found for CODE128' 
      }
    }
    
    return {
      isValid: true,
      correctedCode: filteredCode,
      suggestion: `Removed non-ASCII characters`,
      format: 'CODE128'
    }
  }
  
  if (cleanCode.length > 80) {
    const truncated = cleanCode.slice(0, 80)
    return {
      isValid: true,
      correctedCode: truncated,
      suggestion: `Truncated to 80 characters (practical limit)`,
      format: 'CODE128'
    }
  }
  
  return {
    isValid: true,
    correctedCode: cleanCode,
    suggestion: 'Valid CODE128 barcode',
    format: 'CODE128'
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
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  switch (preferredFormat.toUpperCase()) {
    case 'UPC':
      // Generate 11 digits, let system add check digit
      const upcBase = (cleanSKU + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 11).padStart(11, '0')
      return validateUPC(upcBase)
      
    case 'EAN13':
      // Generate 12 digits, let system add check digit
      const eanBase = (cleanSKU + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
      return validateEAN13(eanBase)
      
    case 'CODE39':
      // Use SKU directly (CODE39 supports alphanumeric)
      const code39Data = cleanSKU.replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '').slice(0, 20)
      return validateCODE39(code39Data || (cleanSKU.slice(0, 10) + timestamp.slice(-3)))
      
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
    grocery: 'UPC',
    clothing: 'EAN13',
    electronics: 'EAN13'
  }
  
  return recommendations[useCase.toLowerCase()] || 'CODE128'
}

/**
 * Analyze SKU and recommend best barcode format
 */
export const analyzeSkuForBarcodeFormat = (sku: string) => {
  const hasLetters = /[A-Za-z]/.test(sku)
  const hasNumbers = /[0-9]/.test(sku)
  const isNumericOnly = /^[0-9\-\s]*$/.test(sku)
  const skuLength = sku.replace(/[^A-Z0-9]/g, '').length
  
  if (isNumericOnly && skuLength >= 10) {
    return {
      format: 'EAN13',
      reason: 'SKU is numeric and sufficient length - EAN13 is ideal for retail',
      confidence: 'high'
    }
  } else if (isNumericOnly && skuLength >= 8) {
    return {
      format: 'UPC',
      reason: 'SKU is numeric - UPC is perfect for US/Canada retail',
      confidence: 'high'
    }
  } else if (hasLetters && hasNumbers && skuLength <= 20) {
    return {
      format: 'CODE128',
      reason: 'Mixed alphanumeric SKU - CODE128 is most efficient',
      confidence: 'high'
    }
  } else if (hasLetters && skuLength <= 15) {
    return {
      format: 'CODE39',
      reason: 'Alphanumeric SKU - CODE39 is simple and reliable',
      confidence: 'medium'
    }
  } else {
    return {
      format: 'CODE128',
      reason: 'Universal format that works with any content',
      confidence: 'medium'
    }
  }
}

/**
 * Generate random valid barcode for testing
 */
export const generateTestBarcode = (format: string): string => {
  const timestamp = Date.now().toString()
  
  switch (format.toUpperCase()) {
    case 'UPC':
      return timestamp.slice(-11).padStart(11, '0')
    case 'EAN13':
      return timestamp.slice(-12).padStart(12, '0')
    case 'CODE39':
      return `TEST${timestamp.slice(-6)}`
    case 'CODE128':
    default:
      return `TEST-${timestamp.slice(-8)}`
  }
}

/**
 * Format barcode for display (add spacing/hyphens)
 */
export const formatBarcodeForDisplay = (barcode: string, type: string): string => {
  switch (type.toUpperCase()) {
    case 'UPC':
      if (barcode.length === 12) {
        return `${barcode.slice(0, 1)} ${barcode.slice(1, 6)} ${barcode.slice(6, 11)} ${barcode.slice(11)}`
      }
      break
    case 'EAN13':
      if (barcode.length === 13) {
        return `${barcode.slice(0, 1)} ${barcode.slice(1, 7)} ${barcode.slice(7, 12)} ${barcode.slice(12)}`
      }
      break
    case 'CODE39':
    case 'CODE128':
      // No special formatting needed
      return barcode
  }
  
  return barcode
}

/**
 * Check if barcode needs update based on SKU changes
 */
export const shouldUpdateBarcode = (
  currentBarcode: string, 
  currentSku: string, 
  newSku: string
): boolean => {
  if (!currentBarcode || !currentSku || !newSku) return true
  if (currentSku === newSku) return false
  
  // If barcode contains SKU elements, suggest update
  const cleanCurrentSku = currentSku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  const cleanNewSku = newSku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  
  return currentBarcode.toUpperCase().includes(cleanCurrentSku) && cleanCurrentSku !== cleanNewSku
}