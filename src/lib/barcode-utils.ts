// ✅ FIXED: src/lib/discount-utils.ts - Matching Admin Preview Logic

export interface DiscountProduct {
  sellingPriceUSD: number
  discountPercentage: number
  showDiscountToCustomers: boolean
}

export interface DiscountCalculation {
  originalPrice: number
  discountedPrice: number
  savings: number
  discountPercent: number
  hasDiscount: boolean
  shouldShowDiscount: boolean
}

/**
 * Calculate discount information for a product
 * ✅ FIXED: This now matches the admin preview logic exactly
 */
export function calculateDiscountInfo(product: DiscountProduct): DiscountCalculation {
  const hasDiscount = product.discountPercentage > 0
  const shouldShowDiscount = hasDiscount && product.showDiscountToCustomers
  
  if (!hasDiscount) {
    // No discount - everything is the same
    return {
      originalPrice: product.sellingPriceUSD,
      discountedPrice: product.sellingPriceUSD,
      savings: 0,
      discountPercent: 0,
      hasDiscount: false,
      shouldShowDiscount: false
    }
  }

  // ✅ CRITICAL FIX: When there's a discount, the sellingPriceUSD is treated as the "original price"
  // The customer actually pays LESS than sellingPriceUSD
  const originalPrice = product.sellingPriceUSD  // This becomes the crossed-out price
  const discountedPrice = originalPrice * (1 - product.discountPercentage / 100)  // This is what customer pays
  const savings = originalPrice - discountedPrice
  
  return {
    originalPrice,      // $107.11 (crossed out)
    discountedPrice,    // $85.69 (what customer pays - shown in green/red)
    savings,            // $21.42
    discountPercent: product.discountPercentage,  // 20
    hasDiscount: true,
    shouldShowDiscount
  }
}

/**
 * Calculate selling price with discount applied
 */
export function calculateSellingPriceWithDiscount(
  basePrice: number, 
  discountPercentage: number
): number {
  if (discountPercentage <= 0) return basePrice
  return basePrice * (1 - discountPercentage / 100)
}

/**
 * Calculate original price from discounted price (for admin calculations)
 */
export function calculateOriginalFromDiscounted(
  discountedPrice: number, 
  discountPercentage: number
): number {
  if (discountPercentage <= 0) return discountedPrice
  return discountedPrice / (1 - discountPercentage / 100)
}

/**
 * Validate discount percentage
 */
export function validateDiscountPercentage(discount: number): {
  isValid: boolean
  error?: string
} {
  if (discount < 0) {
    return { isValid: false, error: 'Discount cannot be negative' }
  }
  if (discount >= 100) {
    return { isValid: false, error: 'Discount cannot be 100% or more' }
  }
  return { isValid: true }
}

/**
 * Format discount percentage for display
 */
export function formatDiscountPercent(discount: number): string {
  return `${Math.round(discount)}%`
}

/**
 * Check if product has active discount for customers
 */
export function hasActiveCustomerDiscount(product: DiscountProduct): boolean {
  return product.discountPercentage > 0 && product.showDiscountToCustomers
}

/**
 * Calculate bulk discount for multiple items
 */
export function calculateBulkDiscount(
  items: Array<{ price: number; quantity: number; discountPercent: number }>
): {
  subtotal: number
  totalSavings: number
  finalTotal: number
} {
  let subtotal = 0
  let totalSavings = 0
  
  items.forEach(item => {
    const itemTotal = item.price * item.quantity
    const discountedPrice = item.price * (1 - item.discountPercent / 100)
    const discountedTotal = discountedPrice * item.quantity
    const itemSavings = itemTotal - discountedTotal
    
    subtotal += discountedTotal  // Use discounted total
    totalSavings += itemSavings
  })
  
  return {
    subtotal,
    totalSavings,
    finalTotal: subtotal
  }
}

/**
 * Generate discount summary text
 */
export function generateDiscountSummary(discount: DiscountCalculation): string {
  if (!discount.shouldShowDiscount) {
    return ''
  }
  
  return `Save ${formatDiscountPercent(discount.discountPercent)} • Original price was $${discount.originalPrice.toFixed(2)}`
}

/**
 * Check if discount is significant enough to highlight
 */
export function isSignificantDiscount(discountPercent: number, threshold = 10): boolean {
  return discountPercent >= threshold
}

/**
 * Calculate discount tier (for different UI treatments)
 */
export function getDiscountTier(discountPercent: number): 'low' | 'medium' | 'high' | 'mega' {
  if (discountPercent < 10) return 'low'
  if (discountPercent < 25) return 'medium'
  if (discountPercent < 50) return 'high'
  return 'mega'
}

/**
 * Generate discount badge color based on percentage
 */
export function getDiscountBadgeColor(discountPercent: number): {
  bg: string
  text: string
  border: string
} {
  const tier = getDiscountTier(discountPercent)
  
  const colors = {
    low: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    medium: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
    high: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
    mega: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' }
  }
  
  return colors[tier]
}

// 🚀 EXAMPLE WITH YOUR DATA:
/*
const product = {
  sellingPriceUSD: 107.11,    // This is the "original price" for display
  discountPercentage: 20,
  showDiscountToCustomers: true
}

const discountInfo = calculateDiscountInfo(product)
// Result: {
//   originalPrice: 107.11,    // ← Crossed out price
//   discountedPrice: 85.69,   // ← What customer actually pays  
//   savings: 21.42,
//   discountPercent: 20,
//   hasDiscount: true,
//   shouldShowDiscount: true
// }

// Customer sees: ~~$107.11~~ $85.69 (20% OFF) You save $21.42
*/