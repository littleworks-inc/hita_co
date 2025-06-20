// lib/barcode-utils.ts

export interface BarcodeValidationResult {
  isValid: boolean
  error?: string
  correctedCode?: string
  suggestion?: string
}

/**
 * Validate and correct barcode based on format type
 */
export const validateBarcode = (code: string, type: string): BarcodeValidationResult => {
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

/**
 * Validate UPC (Universal Product Code)
 * Format: 12 digits with check digit
 */
export const validateUPC = (code: string): BarcodeValidationResult => {
  // Remove any non-digits and spaces
  const cleanCode = code.replace(/[\s\-]/g, '').replace(/\D/g, '')
  
  if (cleanCode.length === 0) {
    return { isValid: false, error: 'UPC cannot be empty' }
  }
  
  if (cleanCode.length < 11) {
    return { 
      isValid: false, 
      error: `UPC too short (${cleanCode.length} digits). Need at least 11 digits.`,
      suggestion: 'Pad with leading zeros to make 11 digits, then system will add check digit'
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
    return validateUPC(truncated)
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
      suggestion: 'Pad with leading zeros to make 12 digits, then system will add check digit'
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
    return validateEAN13(truncated)
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
 */
export const calculateUPCCheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    if (isNaN(digit)) continue
    
    // Multiply odd positions by 3, even positions by 1
    sum += (i % 2 === 0) ? digit * 3 : digit
  }
  
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

/**
 * Calculate EAN-13 check digit
 */
export const calculateEAN13CheckDigit = (code: string): number => {
  let sum = 0
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i])
    if (isNaN(digit)) continue
    
    // Multiply even positions by 3, odd positions by 1
    sum += (i % 2 === 0) ? digit : digit * 3
  }
  
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}

/**
 * Generate barcode from SKU with proper format validation
 */
export const generateBarcodeFromSKU = (sku: string, preferredFormat: string = 'CODE128'): BarcodeValidationResult => {
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
export const getBarcodeFormatRecommendation = (useCase: 'retail' | 'inventory' | 'international' | 'simple'): {
  format: string
  reason: string
  description: string
} => {
  switch (useCase) {
    case 'retail':
      return {
        format: 'UPC',
        reason: 'Standard for US retail, compatible with all POS systems',
        description: '12-digit format used by major retailers like Walmart, Target, Amazon'
      }
      
    case 'international':
      return {
        format: 'EAN13',
        reason: 'International standard, accepted worldwide',
        description: '13-digit format used globally, includes country codes'
      }
      
    case 'simple':
      return {
        format: 'CODE39',
        reason: 'Simple format, easy to implement, alphanumeric support',
        description: 'Basic format good for internal tracking, supports letters and numbers'
      }
      
    case 'inventory':
    default:
      return {
        format: 'CODE128',
        reason: 'High density, compact, supports full ASCII character set',
        description: 'Most versatile format, perfect for inventory management and internal use'
      }
  }
}

/**
 * Check if barcode is likely to be scannable
 */
export const checkScannability = (code: string, format: string): {
  scannable: boolean
  issues: string[]
  suggestions: string[]
} => {
  const issues: string[] = []
  const suggestions: string[] = []
  
  const validation = validateBarcode(code, format)
  
  if (!validation.isValid) {
    issues.push(`Invalid ${format} format: ${validation.error}`)
    return { scannable: false, issues, suggestions }
  }
  
  // Check length for scanning reliability
  if (format === 'CODE128' && code.length > 50) {
    issues.push('CODE128 barcode is very long, may be difficult to scan')
    suggestions.push('Consider shorter product codes or use CODE39 for simple data')
  }
  
  if (format === 'CODE39' && code.length > 30) {
    issues.push('CODE39 barcode is long, may be difficult to scan')
    suggestions.push('Consider using CODE128 for longer data')
  }
  
  // Check for common scanning issues
  if (code.includes('  ')) {
    issues.push('Multiple consecutive spaces may cause scanning issues')
    suggestions.push('Replace multiple spaces with single spaces or dashes')
  }
  
  if (format === 'UPC' || format === 'EAN13') {
    const numericCode = validation.correctedCode || code
    if (numericCode.startsWith('000000')) {
      suggestions.push('Leading zeros may indicate test/internal use - not suitable for retail')
    }
  }
  
  // Positive indicators
  const scannable = issues.length === 0
  
  if (scannable) {
    suggestions.push(`${format} format is optimal for scanning`)
    suggestions.push('Print with high contrast (black bars on white background)')
    suggestions.push('Ensure minimum 2x width multiplier for reliable scanning')
  }
  
  return { scannable, issues, suggestions }
}