// src/lib/utils.ts - UPDATED
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
}

// ✅ FIXED: Add proper currency validation and fallback
export function formatPrice(price: number, currency: string = "USD"): string {
  try {
    // ✅ FIX: Validate and sanitize currency code
    let sanitizedCurrency = currency

    // Handle symbol to code conversion
    const symbolToCode: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR', 
      '£': 'GBP',
      '₹': 'INR',
      '¥': 'JPY',
      'C$': 'CAD',
      'A$': 'AUD'
    }

    // If currency is a symbol, convert to code
    if (symbolToCode[currency]) {
      sanitizedCurrency = symbolToCode[currency]
    }

    // Validate currency code (must be 3 letters)
    if (!/^[A-Z]{3}$/.test(sanitizedCurrency)) {
      console.warn(`Invalid currency code: ${currency}, falling back to USD`)
      sanitizedCurrency = 'USD'
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: sanitizedCurrency,
      minimumFractionDigits: sanitizedCurrency === 'JPY' ? 0 : 2,
      maximumFractionDigits: sanitizedCurrency === 'JPY' ? 0 : 2,
    }).format(price)
  } catch (error) {
    console.warn(`Error formatting price with currency ${currency}:`, error)
    // Fallback to simple USD formatting
    return `$${price.toFixed(2)}`
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function generateSKU(productName: string): string {
  const prefix = "HC" // Hita&Co
  const timestamp = Date.now().toString().slice(-6)
  const nameCode = productName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
  
  return `${prefix}-${nameCode}-${timestamp}`
}

export function generateOrderNumber(): string {
  const prefix = "ORD"
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  
  return `${prefix}-${timestamp}-${random}`
}

export function calculateCostBreakdown(
  originalPrice: number,
  quantity: number,
  gstPercentage: number,
  shippingCost: number,
  conversionCharges: number,
  additionalExpenses: number,
  exchangeRate: number
) {
  const gstAmount = (originalPrice * gstPercentage) / 100
  const totalLocalCost = originalPrice + gstAmount + shippingCost + conversionCharges + additionalExpenses
  const costPriceUSD = totalLocalCost / exchangeRate
  const piecePriceUSD = costPriceUSD / quantity
  
  return {
    gstAmount,
    totalLocalCost,
    costPriceUSD,
    piecePriceUSD
  }
}

export function calculateSellingPrice(
  costPriceUSD: number,
  profitMargin: number,
  discountPercentage: number
) {
  // Step 1: Calculate base price with profit margin
  const basePriceWithProfit = costPriceUSD * (1 + profitMargin / 100)
  
  // Step 2: If there's a discount, the user wants to offer that discount
  // So the selling price should be AFTER applying the discount
  const sellingPriceUSD = basePriceWithProfit * (1 - discountPercentage / 100)
  
  return sellingPriceUSD
}