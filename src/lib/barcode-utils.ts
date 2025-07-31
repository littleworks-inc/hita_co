// src/lib/barcode-utils.ts
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed multi-format logic

/**
 * Determine if barcode should be updated when SKU changes
 */
export function shouldUpdateBarcode(
  originalSku: string, 
  newSku: string, 
  currentBarcode: string
): boolean {
  // Don't update if SKU hasn't actually changed
  if (originalSku === newSku) {
    return false
  }

  // Don't update if there's no current barcode (will auto-generate)
  if (!currentBarcode || currentBarcode.trim() === '') {
    return false
  }

  // Don't update if SKU change is minimal (just case or spacing)
  const cleanOriginal = originalSku.toLowerCase().replace(/[\s\-]/g, '')
  const cleanNew = newSku.toLowerCase().replace(/[\s\-]/g, '')
  
  if (cleanOriginal === cleanNew) {
    return false
  }

  // Update if SKU has meaningful changes
  return true
}

/**
 * Generate CODE128 barcode from SKU
 */
export function generateBarcodeFromSKU(sku: string): string {
  if (!sku || sku.trim() === '') {
    return ''
  }

  // Clean and format the SKU for CODE128
  const cleanSKU = sku.trim().toUpperCase()
  const timestamp = Date.now().toString().slice(-6)

  // For CODE128, we can be flexible with the format
  let generatedBarcode = cleanSKU

  // If SKU is very short, add timestamp for uniqueness
  if (cleanSKU.length < 8) {
    generatedBarcode = `${cleanSKU}-${timestamp}`
  }

  // Ensure reasonable length for scanning
  if (generatedBarcode.length > 30) {
    generatedBarcode = generatedBarcode.slice(0, 30)
  }

  return generatedBarcode
}

/**
 * Validate CODE128 barcode format
 */
export function validateBarcodeFormat(code: string): { isValid: boolean; error?: string } {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  // CODE128 accepts most ASCII characters
  if (code.length > 80) {
    return { isValid: false, error: 'CODE128 too long (max 80 characters)' }
  }

  // Check for valid ASCII characters (0-127)
  const invalidChars = code.split('').filter(char => char.charCodeAt(0) > 127)
  
  if (invalidChars.length > 0) {
    return { 
      isValid: false, 
      error: `Contains invalid characters: ${invalidChars.join(', ')}`
    }
  }

  return { isValid: true }
}

/**
 * Format barcode for display
 */
export function formatBarcodeForDisplay(barcode: string): string {
  if (!barcode) return ''
  
  // For CODE128, we can display as-is since it's human readable
  return barcode.trim()
}

/**
 * Check if barcode needs regeneration
 */
export function needsBarcodeRegeneration(
  sku: string, 
  currentBarcode: string, 
  originalSku?: string
): boolean {
  // No barcode exists
  if (!currentBarcode || currentBarcode.trim() === '') {
    return true
  }

  // SKU changed significantly
  if (originalSku && shouldUpdateBarcode(originalSku, sku, currentBarcode)) {
    return true
  }

  // Barcode is invalid
  const validation = validateBarcodeFormat(currentBarcode)
  if (!validation.isValid) {
    return true
  }

  return false
}

/**
 * Generate barcode options for product sizes
 */
export function generateSizeBarcodes(baseSku: string, sizes: string[]): Record<string, string> {
  if (!baseSku || !sizes.length) {
    return {}
  }

  const sizeBarcodes: Record<string, string> = {}

  sizes.forEach(size => {
    const sizeBarcode = generateBarcodeFromSKU(`${baseSku}-${size.toUpperCase()}`)
    if (sizeBarcode) {
      sizeBarcodes[size] = sizeBarcode
    }
  })

  return sizeBarcodes
}

/**
 * Barcode constants for CODE128
 */
export const BARCODE_CONFIG = {
  FORMAT: 'CODE128' as const,
  MAX_LENGTH: 80,
  MIN_LENGTH: 1,
  SUPPORTS_LETTERS: true,
  SUPPORTS_NUMBERS: true,
  SUPPORTS_SYMBOLS: true,
  DESCRIPTION: 'Universal format supporting letters, numbers & symbols'
} as const

/**
 * Default barcode generation settings
 */
export const DEFAULT_BARCODE_SETTINGS = {
  format: BARCODE_CONFIG.FORMAT,
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 12,
  margin: 10,
  background: '#ffffff',
  lineColor: '#000000'
} as const