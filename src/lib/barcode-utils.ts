// ✅ FIXED: src/lib/barcode-utils.ts - Add Missing shouldUpdateBarcode Function

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
 * Generate barcode from SKU for different formats
 */
export function generateBarcodeFromSKU(sku: string, format: string): string {
  if (!sku || sku.trim() === '') {
    return ''
  }

  const cleanSKU = sku.replace(/[^A-Z0-9]/g, '').toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  switch (format.toUpperCase()) {
    case 'UPC':
      // Generate 11 digits for UPC
      let upcBase = cleanSKU.replace(/[^0-9]/g, '')
      if (upcBase.length < 11) {
        upcBase = (upcBase + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 11).padStart(11, '0')
      } else {
        upcBase = upcBase.slice(0, 11)
      }
      return upcBase
      
    case 'EAN13':
      // Generate 12 digits for EAN13
      let eanBase = cleanSKU.replace(/[^0-9]/g, '')
      if (eanBase.length < 12) {
        eanBase = (eanBase + timestamp + randomSuffix).replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
      } else {
        eanBase = eanBase.slice(0, 12)
      }
      return eanBase
      
    case 'CODE39':
      // Use SKU directly (limited to valid CODE39 characters)
      return cleanSKU.replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '').slice(0, 20)
      
    case 'CODE128':
    default:
      // Most flexible - use SKU with timestamp
      return `${cleanSKU}-${timestamp}`.slice(0, 30)
  }
}

/**
 * Validate barcode format
 */
export function validateBarcodeFormat(code: string, format: string): { isValid: boolean; error?: string } {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  switch (format.toUpperCase()) {
    case 'UPC':
      const upcClean = code.replace(/[\s\-]/g, '')
      if (!/^\d+$/.test(upcClean)) {
        return { isValid: false, error: 'UPC must contain only numbers' }
      }
      if (upcClean.length !== 11 && upcClean.length !== 12) {
        return { isValid: false, error: 'UPC must be 11 or 12 digits' }
      }
      return { isValid: true }
      
    case 'EAN13':
      const eanClean = code.replace(/[\s\-]/g, '')
      if (!/^\d+$/.test(eanClean)) {
        return { isValid: false, error: 'EAN13 must contain only numbers' }
      }
      if (eanClean.length !== 12 && eanClean.length !== 13) {
        return { isValid: false, error: 'EAN13 must be 12 or 13 digits' }
      }
      return { isValid: true }
      
    case 'CODE39':
      if (!/^[A-Z0-9\-\.\ \$\/\+\%]*$/.test(code)) {
        return { isValid: false, error: 'CODE39 contains invalid characters' }
      }
      if (code.length > 43) {
        return { isValid: false, error: 'CODE39 too long (max 43 characters)' }
      }
      return { isValid: true }
      
    case 'CODE128':
      if (code.length > 80) {
        return { isValid: false, error: 'CODE128 too long (max 80 characters)' }
      }
      return { isValid: true }
      
    default:
      return { isValid: false, error: `Unknown barcode format: ${format}` }
  }
}