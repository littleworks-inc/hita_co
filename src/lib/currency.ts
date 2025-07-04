// src/lib/currency.ts
// =====================================
// 🔧 FIXED: Currency System with Proper Database Error Handling
// Resolves "Cannot read properties of undefined" errors
// =====================================

import { PrismaClient } from '@prisma/client'

// Supported currencies with their display information
export const SUPPORTED_CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  SEK: { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  DKK: { name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
} as const

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES

// Country to currency mapping
export const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', JP: 'JPY', CN: 'CNY',
  IN: 'INR', SG: 'SGD', HK: 'HKD', AE: 'AED', CH: 'CHF', NO: 'NOK',
  SE: 'SEK', DK: 'DKK', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR',
  GR: 'EUR', LU: 'EUR', MT: 'EUR', CY: 'EUR', SK: 'EUR', SI: 'EUR',
  EE: 'EUR', LV: 'EUR', LT: 'EUR'
}

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  CAD: 1.25,
  AUD: 1.35,
  JPY: 110,
  CNY: 6.45,
  INR: 83.0,
  SGD: 1.35,
  HKD: 7.8,
  AED: 3.67,
  CHF: 0.92,
  NOK: 8.5,
  SEK: 8.8,
  DKK: 6.4
}

// 🔧 FIXED: Safe database client getter
function getDbClient(): PrismaClient | null {
  try {
    // Try to get the database client
    const { db } = require('@/lib/db')
    return db || null
  } catch (error) {
    console.warn('Database client not available:', error)
    return null
  }
}

// Check if a string is a valid currency
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return currency in SUPPORTED_CURRENCIES
}

// Get customer's location based on IP
export async function getCustomerLocation(request?: Request): Promise<{
  country: string
  currency: SupportedCurrency
  ip?: string
}> {
  try {
    // Try to get IP from request headers
    let ip = '127.0.0.1'
    
    if (request) {
      ip = request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           '127.0.0.1'
    }

    // For localhost/development, return default
    if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'US',
        currency: 'USD',
        ip
      }
    }

    // Try to get location from IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (response.ok) {
      const data = await response.json()
      const countryCode = data.countryCode || 'US'
      const currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD'
      
      return {
        country: countryCode,
        currency,
        ip
      }
    }
  } catch (error) {
    console.error('Error getting customer location:', error)
  }

  // Fallback to US/USD
  return {
    country: 'US',
    currency: 'USD'
  }
}

// Fetch live exchange rates from external API
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 }, // Cache for 1 hour
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.rates && typeof data.rates === 'object') {
      return data.rates
    } else {
      throw new Error('Invalid response format from exchange rate API')
    }
  } catch (error) {
    console.error('Error fetching live exchange rates:', error)
    
    // Try to get stored rates as fallback
    const storedRates = await getStoredExchangeRates()
    if (Object.keys(storedRates).length > 0) {
      console.log('Using stored exchange rates as fallback')
      return storedRates
    }

    // Ultimate fallback to static rates
    console.log('Using static fallback exchange rates')
    return FALLBACK_RATES
  }
}

// 🔧 FIXED: Get stored exchange rates from database with proper error handling
export async function getStoredExchangeRates(): Promise<Record<string, number>> {
  try {
    const db = getDbClient()
    
    // Check if db is available
    if (!db) {
      console.warn('Database client not available')
      return {}
    }

    // Test if the exchangeRate model exists and is accessible
    const rates = await db.exchangeRate.findMany({
      where: { fromCurrency: 'USD' }
    }).catch((error) => {
      console.warn('ExchangeRate table not accessible:', error.message)
      return []
    })

    const ratesMap: Record<string, number> = { USD: 1 } // Base currency

    if (Array.isArray(rates)) {
      rates.forEach(rate => {
        if (rate.toCurrency && typeof rate.rate === 'number') {
          ratesMap[rate.toCurrency] = rate.rate
        }
      })
    }

    return ratesMap
  } catch (error) {
    console.error('Error getting stored exchange rates:', error)
    return {}
  }
}

// 🔧 FIXED: Update exchange rates in database with proper error handling
export async function updateExchangeRates(): Promise<void> {
  try {
    const db = getDbClient()
    
    // Check if db is available
    if (!db) {
      console.warn('Database client not available, skipping rate update')
      return
    }

    const rates = await fetchExchangeRates()

    if (!rates || Object.keys(rates).length === 0) {
      console.warn('No exchange rates to update')
      return
    }

    for (const [currency, rate] of Object.entries(rates)) {
      if (currency === 'USD') continue // Skip base currency
      if (typeof rate !== 'number' || rate <= 0) continue // Skip invalid rates

      try {
        // 🔧 FIXED: Additional safety check before upsert
        if (!db.exchangeRate) {
          console.warn('ExchangeRate model not available')
          break
        }

        await db.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency: {
              fromCurrency: 'USD',
              toCurrency: currency
            }
          },
          update: {
            rate,
            lastUpdated: new Date()
          },
          create: {
            fromCurrency: 'USD',
            toCurrency: currency,
            rate,
            lastUpdated: new Date()
          }
        })
      } catch (upsertError) {
        console.error(`Error updating rate for ${currency}:`, upsertError)
        // Continue with other currencies even if one fails
      }
    }

    console.log('Exchange rates updated successfully')
  } catch (error) {
    console.error('Error updating exchange rates:', error)
  }
}

// Convert price from USD to target currency
export function convertPrice(
  priceUSD: number, 
  targetCurrency: SupportedCurrency, 
  exchangeRates: Record<string, number>
): number {
  if (targetCurrency === 'USD') {
    return priceUSD
  }

  const rate = exchangeRates[targetCurrency]
  if (!rate || typeof rate !== 'number' || rate <= 0) {
    console.warn(`Invalid exchange rate for ${targetCurrency}, falling back to USD`)
    return priceUSD
  }

  return priceUSD * rate
}

// Format price with currency symbol and locale
export function formatPriceWithCurrency(
  price: number, 
  currency: SupportedCurrency,
  locale?: string
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency]
  
  if (!currencyInfo) {
    console.warn(`Unknown currency: ${currency}`)
    return `$${price.toFixed(2)}`
  }
  
  try {
    // Use Intl.NumberFormat for proper currency formatting
    const formatter = new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2
    })
    
    return formatter.format(price)
  } catch (error) {
    console.warn(`Error formatting currency ${currency}:`, error)
    // Fallback to simple formatting
    return `${currencyInfo.symbol}${price.toFixed(currency === 'JPY' ? 0 : 2)}`
  }
}

// Convert and format price in one function
export function convertAndFormatPrice(
  priceUSD: number, 
  targetCurrency: SupportedCurrency, 
  exchangeRates: Record<string, number>,
  locale?: string
): string {
  const convertedPrice = convertPrice(priceUSD, targetCurrency, exchangeRates)
  return formatPriceWithCurrency(convertedPrice, targetCurrency, locale)
}

// Get all available currencies as an array
export function getAvailableCurrencies() {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code: code as SupportedCurrency,
    ...info
  }))
}

// 🔧 FIXED: Initialize exchange rates (call this when the app starts)
export async function initializeExchangeRates(): Promise<Record<string, number>> {
  try {
    // First try to get stored rates
    let rates = await getStoredExchangeRates()
    
    // If no stored rates, fetch fresh ones
    if (Object.keys(rates).length <= 1) { // Only USD means no stored rates
      console.log('No stored rates found, fetching fresh rates...')
      rates = await fetchExchangeRates()
      
      // Update database in background (don't wait for it)
      updateExchangeRates().catch(error => {
        console.error('Background rate update failed:', error)
      })
    }

    // If still no rates, use fallback
    if (Object.keys(rates).length <= 1) {
      console.log('Using fallback exchange rates')
      rates = FALLBACK_RATES
    }

    return rates
  } catch (error) {
    console.error('Error initializing exchange rates:', error)
    return FALLBACK_RATES
  }
}

// Validate currency code
export function validateCurrency(currency: unknown): SupportedCurrency {
  if (typeof currency === 'string' && isValidCurrency(currency)) {
    return currency
  }
  return 'USD' // Default fallback
}