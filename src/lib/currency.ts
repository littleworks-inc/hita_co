import { db } from '@/lib/db'

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

// Exchange rate interface
export interface ExchangeRate {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: number
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

// Create exchange rate table in database (add this to your schema)
/*
model ExchangeRate {
  id           String   @id @default(cuid())
  fromCurrency String   // Always USD as base
  toCurrency   String   // Target currency
  rate         Float    // Exchange rate
  lastUpdated  DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([fromCurrency, toCurrency])
  @@map("exchange_rates")
}
*/

// Get customer's location based on IP
export async function getCustomerLocation(request?: Request): Promise<{
  country: string
  currency: SupportedCurrency
  ip?: string
}> {
  try {
    let ip: string | undefined

    // Try to get IP from various headers
    if (request) {
      ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           undefined
    }

    // Fallback to a public IP detection service for development
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      const response = await fetch('https://api.ipify.org?format=json', { 
        next: { revalidate: 3600 } // Cache for 1 hour
      })
      const data = await response.json()
      ip = data.ip
    }

    // Get location data from IP
    const locationResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!locationResponse.ok) {
      throw new Error('Failed to fetch location')
    }

    const locationData = await locationResponse.json()

    if (locationData.status === 'success') {
      const countryCode = locationData.countryCode as string
      const currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD'

      return {
        country: countryCode,
        currency,
        ip
      }
    }

    throw new Error('Location detection failed')
  } catch (error) {
    console.error('Error detecting customer location:', error)
    // Fallback to US/USD
    return {
      country: 'US',
      currency: 'USD'
    }
  }
}

// Fetch live exchange rates
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    // You can also use Fixer.io, CurrencyLayer, or other services
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data = await response.json()
    return data.rates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    
    // Fallback to stored rates or default rates
    const fallbackRates = await getStoredExchangeRates()
    if (Object.keys(fallbackRates).length > 0) {
      return fallbackRates
    }

    // Ultimate fallback - approximate rates (you should update these periodically)
    return {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      CAD: 1.25,
      AUD: 1.35,
      JPY: 110,
      CNY: 6.45,
      INR: 75,
      SGD: 1.35,
      HKD: 7.8,
      AED: 3.67,
      CHF: 0.92,
      NOK: 8.5,
      SEK: 8.8,
      DKK: 6.4
    }
  }
}

// Get stored exchange rates from database
export async function getStoredExchangeRates(): Promise<Record<string, number>> {
  try {
    const rates = await db.exchangeRate.findMany({
      where: { fromCurrency: 'USD' }
    })

    const ratesMap: Record<string, number> = { USD: 1 } // Base currency

    rates.forEach(rate => {
      ratesMap[rate.toCurrency] = rate.rate
    })

    return ratesMap
  } catch (error) {
    console.error('Error getting stored exchange rates:', error)
    return {}
  }
}

// Update exchange rates in database
export async function updateExchangeRates(): Promise<void> {
  try {
    const rates = await fetchExchangeRates()

    for (const [currency, rate] of Object.entries(rates)) {
      if (currency === 'USD') continue // Skip base currency

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
  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, falling back to USD`)
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
  
  try {
    // Use Intl.NumberFormat for proper currency formatting
    const formatter = new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    })

    return formatter.format(price)
  } catch (error) {
    // Fallback to manual formatting
    const symbol = currencyInfo.symbol
    const formattedPrice = currency === 'JPY' 
      ? Math.round(price).toLocaleString()
      : price.toFixed(2)

    return `${symbol}${formattedPrice}`
  }
}

// Get user's preferred locale based on currency
export function getLocaleFromCurrency(currency: SupportedCurrency): string {
  const localeMap: Record<SupportedCurrency, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    CAD: 'en-CA',
    AUD: 'en-AU',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    INR: 'en-IN',
    SGD: 'en-SG',
    HKD: 'zh-HK',
    AED: 'ar-AE',
    CHF: 'de-CH',
    NOK: 'nb-NO',
    SEK: 'sv-SE',
    DKK: 'da-DK'
  }

  return localeMap[currency] || 'en-US'
}

// Convert and format price in one function
export function convertAndFormatPrice(
  priceUSD: number,
  targetCurrency: SupportedCurrency,
  exchangeRates: Record<string, number>,
  locale?: string
): string {
  const convertedPrice = convertPrice(priceUSD, targetCurrency, exchangeRates)
  const userLocale = locale || getLocaleFromCurrency(targetCurrency)
  return formatPriceWithCurrency(convertedPrice, targetCurrency, userLocale)
}

// Validate currency code
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return currency in SUPPORTED_CURRENCIES
}

// Get currency info
export function getCurrencyInfo(currency: SupportedCurrency) {
  return SUPPORTED_CURRENCIES[currency]
}