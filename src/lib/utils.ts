import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price)
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
  
  // Step 2: If there's a discount, the user wants to offer that discount to customers
  // So we need to calculate what the "original price" should be so that after discount,
  // we still get a reasonable margin
  
  if (discountPercentage > 0) {
    // If user wants 10% discount, the displayed "original price" should be higher
    // so that after 10% discount, we get a good selling price
    // 
    // Logic: If final_price = original_price * (1 - discount/100)
    // Then: original_price = final_price / (1 - discount/100)
    // But we want to maintain our profit, so:
    const originalPriceForDisplay = basePriceWithProfit / (1 - discountPercentage / 100)
    const finalSellingPrice = originalPriceForDisplay * (1 - discountPercentage / 100)
    
    return finalSellingPrice  // This should equal basePriceWithProfit
  }
  
  // No discount, just return base price with profit
  return basePriceWithProfit
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}