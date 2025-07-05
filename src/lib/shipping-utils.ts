// COMPLETE FIXED src/lib/shipping-utils.ts
// Updated to work with new explicit many-to-many relationship

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'


// =================
// INTERFACES
// =================

export interface ShippingCalculationRequest {
  countryCode: string // 2-letter country code (US, CA, etc.)
  subtotalUSD: number // Order subtotal in USD
  currency?: string   // Customer's display currency
  items?: Array<{     // Optional: for future weight/item-based calculations
    productId: string
    quantity: number
    weight?: number
  }>
}

export interface ShippingCalculationResult {
  shippingCostUSD: number
  shippingCostFormatted: string
  isEligibleForFreeShipping: boolean
  freeShippingThreshold?: number
  remainingForFreeShipping?: number
  shippingZoneName: string
  estimatedDays?: string
  error?: string
}

export interface ShippingAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  apartment?: string
}

export interface ShippingZoneWithRates {
  id: string
  name: string
  isDefault: boolean
  countries: Array<{
    code: string
    name: string
  }>
  shippingRates: Array<{
    id: string
    name: string
    flatRate: number
    freeShippingThreshold: number | null
    estimatedDays: string | null
    isActive: boolean
  }>
}

/**
 * Safely parse shipping address from Prisma JsonValue
 * @param jsonValue - The JsonValue from Prisma (can be null, string, object, etc.)
 * @returns Parsed shipping address or null if invalid
 */
export function parseShippingAddress(jsonValue: Prisma.JsonValue): ShippingAddress | null {
  try {
    // Handle null or undefined
    if (jsonValue === null || jsonValue === undefined) {
      return null
    }

    // If it's already an object, validate and return it
    if (typeof jsonValue === 'object' && jsonValue !== null && !Array.isArray(jsonValue)) {
      const obj = jsonValue as any
      if (obj.street && obj.city && obj.state && obj.postalCode && obj.country) {
        return obj as ShippingAddress
      }
    }

    // If it's a string, try to parse it
    if (typeof jsonValue === 'string') {
      const parsed = JSON.parse(jsonValue)
      
      // Validate parsed object has required fields
      if (parsed && typeof parsed === 'object' && 
          parsed.street && parsed.city && parsed.state && 
          parsed.postalCode && parsed.country) {
        return parsed as ShippingAddress
      }
    }

    // Invalid format
    return null

  } catch (error) {
    console.error('Error parsing shipping address:', error)
    return null
  }
}

/**
 * Format shipping address for display
 * @param address - Shipping address object or null
 * @returns Formatted address string
 */
export function formatShippingAddressDisplay(address: ShippingAddress | null): string {
  if (!address) {
    return 'No shipping address provided'
  }

  const parts = [
    address.street,
    address.apartment && `Apt ${address.apartment}`,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Validate shipping address completeness
 * @param address - Shipping address to validate
 * @returns Validation result
 */
export function validateShippingAddress(address: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!address) {
    errors.push('Shipping address is required')
    return { isValid: false, errors }
  }

  if (!address.street?.trim()) errors.push('Street address is required')
  if (!address.city?.trim()) errors.push('City is required')
  if (!address.state?.trim()) errors.push('State/Province is required')
  if (!address.postalCode?.trim()) errors.push('Postal code is required')
  if (!address.country?.trim()) errors.push('Country is required')

  return {
    isValid: errors.length === 0,
    errors
  }
}
// =================
// CORE FUNCTIONS (FIXED)
// =================

/**
 * Get shipping zone for a specific country (FIXED)
 */
export async function getShippingZoneForCountry(countryCode: string): Promise<ShippingZoneWithRates | null> {
  try {
    // Find country and its shipping zones (FIXED)
    const country = await db.country.findFirst({
      where: { 
        code: {
          equals: countryCode,
          mode: 'insensitive'
        }
      },
      include: {
        countryZones: {
          include: {
            shippingZone: {
              where: { isActive: true },
              include: {
                shippingRates: {
                  where: { isActive: true },
                  orderBy: { flatRate: 'asc' } // Cheapest first
                }
              }
            }
          }
        }
      }
    })

    if (!country || country.countryZones.length === 0) {
      // Fall back to default shipping zone
      const defaultZone = await getDefaultShippingZone()
      return defaultZone
    }

    // Return the first active shipping zone for this country (FIXED)
    const zoneRelation = country.countryZones[0]
    const zone = zoneRelation.shippingZone
    
    return {
      id: zone.id,
      name: zone.name,
      isDefault: zone.isDefault,
      countries: [{ code: country.code, name: country.name }],
      shippingRates: zone.shippingRates
    }

  } catch (error) {
    console.error('Error getting shipping zone for country:', error)
    return null
  }
}

/**
 * Get default shipping zone from store settings (FIXED)
 */
export async function getDefaultShippingZone(): Promise<ShippingZoneWithRates | null> {
  try {
    // Get store settings to find default shipping zone (FIXED)
    const storeSettings = await db.storeSetting.findFirst({
      where: { id: 'default' },
      include: {
        defaultShippingZone: {
          include: {
            zoneCountries: {
              include: {
                country: true
              }
            },
            shippingRates: {
              where: { isActive: true },
              orderBy: { flatRate: 'asc' }
            }
          }
        }
      }
    })

    if (storeSettings?.defaultShippingZone) {
      const zone = storeSettings.defaultShippingZone
      return {
        id: zone.id,
        name: zone.name,
        isDefault: zone.isDefault,
        countries: zone.zoneCountries.map(zc => ({
          code: zc.country.code,
          name: zc.country.name
        })),
        shippingRates: zone.shippingRates
      }
    }

    // If no default set, try to find any default zone (FIXED)
    const defaultZone = await db.shippingZone.findFirst({
      where: { 
        isDefault: true,
        isActive: true
      },
      include: {
        zoneCountries: {
          include: {
            country: true
          }
        },
        shippingRates: {
          where: { isActive: true },
          orderBy: { flatRate: 'asc' }
        }
      }
    })

    if (!defaultZone) {
      return null
    }

    return {
      id: defaultZone.id,
      name: defaultZone.name,
      isDefault: defaultZone.isDefault,
      countries: defaultZone.zoneCountries.map(zc => ({
        code: zc.country.code,
        name: zc.country.name
      })),
      shippingRates: defaultZone.shippingRates
    }

  } catch (error) {
    console.error('Error getting default shipping zone:', error)
    return null
  }
}

/**
 * Calculate shipping cost for an order
 */
export async function calculateShipping(request: ShippingCalculationRequest): Promise<ShippingCalculationResult> {
  try {
    // Input validation
    if (!request.countryCode || !request.subtotalUSD) {
      return {
        shippingCostUSD: 0,
        shippingCostFormatted: '$0.00',
        isEligibleForFreeShipping: false,
        shippingZoneName: 'Unknown',
        error: 'Invalid shipping calculation request'
      }
    }

    if (request.subtotalUSD < 0) {
      return {
        shippingCostUSD: 0,
        shippingCostFormatted: '$0.00',
        isEligibleForFreeShipping: false,
        shippingZoneName: 'Unknown',
        error: 'Invalid subtotal amount'
      }
    }

    // Get shipping zone for country
    const shippingZone = await getShippingZoneForCountry(request.countryCode)
    
    if (!shippingZone || shippingZone.shippingRates.length === 0) {
      // Fallback to hardcoded shipping for now
      console.warn(`No shipping rates found for country: ${request.countryCode}`)
      return {
        shippingCostUSD: 15, // Fallback rate
        shippingCostFormatted: '$15.00',
        isEligibleForFreeShipping: false,
        shippingZoneName: 'International (Fallback)',
        error: 'No shipping rates configured for this country'
      }
    }

    // Use the first (cheapest) active shipping rate
    const shippingRate = shippingZone.shippingRates[0]
    
    // Check for free shipping eligibility
    const freeShippingThreshold = shippingRate.freeShippingThreshold
    const isEligibleForFreeShipping = freeShippingThreshold !== null && 
                                    request.subtotalUSD >= freeShippingThreshold

    const shippingCost = isEligibleForFreeShipping ? 0 : shippingRate.flatRate
    
    // Calculate remaining amount for free shipping
    const remainingForFreeShipping = freeShippingThreshold && !isEligibleForFreeShipping
      ? freeShippingThreshold - request.subtotalUSD
      : undefined

    return {
      shippingCostUSD: shippingCost,
      shippingCostFormatted: formatCurrency(shippingCost, 'USD'),
      isEligibleForFreeShipping,
      freeShippingThreshold: freeShippingThreshold || undefined,
      remainingForFreeShipping: remainingForFreeShipping > 0 ? remainingForFreeShipping : undefined,
      shippingZoneName: shippingZone.name,
      estimatedDays: shippingRate.estimatedDays || undefined
    }

  } catch (error) {
    console.error('Error calculating shipping:', error)
    return {
      shippingCostUSD: 0,
      shippingCostFormatted: '$0.00',
      isEligibleForFreeShipping: false,
      shippingZoneName: 'Error',
      error: 'Failed to calculate shipping'
    }
  }
}

/**
 * Check if order qualifies for free shipping
 */
export async function checkFreeShippingEligibility(
  countryCode: string, 
  subtotalUSD: number
): Promise<{
  isEligible: boolean
  threshold?: number
  remaining?: number
  zoneName: string
}> {
  try {
    const shippingZone = await getShippingZoneForCountry(countryCode)
    
    if (!shippingZone || shippingZone.shippingRates.length === 0) {
      return {
        isEligible: false,
        zoneName: 'Unknown'
      }
    }

    const shippingRate = shippingZone.shippingRates[0]
    const threshold = shippingRate.freeShippingThreshold
    
    if (threshold === null) {
      return {
        isEligible: false,
        zoneName: shippingZone.name
      }
    }

    const isEligible = subtotalUSD >= threshold
    const remaining = isEligible ? 0 : threshold - subtotalUSD

    return {
      isEligible,
      threshold,
      remaining: remaining > 0 ? remaining : undefined,
      zoneName: shippingZone.name
    }

  } catch (error) {
    console.error('Error checking free shipping eligibility:', error)
    return {
      isEligible: false,
      zoneName: 'Error'
    }
  }
}

/**
 * Get all active shipping zones with their rates (for admin use) (FIXED)
 */
export async function getAllShippingZones(): Promise<ShippingZoneWithRates[]> {
  try {
    const zones = await db.shippingZone.findMany({
      where: { isActive: true },
      include: {
        zoneCountries: {
          include: {
            country: true
          },
          orderBy: {
            country: {
              name: 'asc'
            }
          }
        },
        shippingRates: {
          where: { isActive: true },
          orderBy: { flatRate: 'asc' }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      isDefault: zone.isDefault,
      countries: zone.zoneCountries.map(zc => ({
        code: zc.country.code,
        name: zc.country.name
      })),
      shippingRates: zone.shippingRates
    }))

  } catch (error) {
    console.error('Error getting all shipping zones:', error)
    return []
  }
}

/**
 * Detect country from IP address (placeholder for future implementation)
 */
export function detectCountryFromIP(ipAddress?: string): string {
  // Placeholder implementation - returns US as default
  // In a real implementation, you might use a service like:
  // - MaxMind GeoIP
  // - ipapi.co
  // - Cloudflare CF-IPCountry header
  
  if (!ipAddress) {
    return 'US' // Default to US
  }
  
  // Simple detection based on common patterns (very basic)
  if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('127.')) {
    return 'US' // Local/development
  }
  
  return 'US' // Default fallback
}

// =================
// UTILITY FUNCTIONS
// =================

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch (error) {
    // Fallback formatting
    return `$${amount.toFixed(2)}`
  }
}

/**
 * Convert USD amount to another currency (placeholder)
 */
export async function convertCurrency(
  amountUSD: number, 
  targetCurrency: string
): Promise<number> {
  if (targetCurrency === 'USD') {
    return amountUSD
  }

  try {
    // Get exchange rate from database
    const exchangeRate = await db.exchangeRate.findFirst({
      where: {
        fromCurrency: 'USD',
        toCurrency: targetCurrency
      },
      orderBy: { lastUpdated: 'desc' }
    })

    if (!exchangeRate) {
      console.warn(`No exchange rate found for USD to ${targetCurrency}`)
      return amountUSD // Return USD amount as fallback
    }

    return amountUSD * exchangeRate.rate

  } catch (error) {
    console.error('Error converting currency:', error)
    return amountUSD
  }
}

/**
 * Get supported countries for shipping (FIXED)
 */
export async function getSupportedShippingCountries(): Promise<Array<{
  code: string
  name: string
  zoneName: string
}>> {
  try {
    const zones = await db.shippingZone.findMany({
      where: { isActive: true },
      include: {
        zoneCountries: {
          include: {
            country: true
          },
          orderBy: {
            country: {
              name: 'asc'
            }
          }
        }
      }
    })

    const countries: Array<{
      code: string
      name: string
      zoneName: string
    }> = []

    zones.forEach(zone => {
      zone.zoneCountries.forEach(zc => {
        countries.push({
          code: zc.country.code,
          name: zc.country.name,
          zoneName: zone.name
        })
      })
    })

    // Remove duplicates and sort
    const uniqueCountries = countries.filter((country, index, self) => 
      index === self.findIndex(c => c.code === country.code)
    )

    return uniqueCountries.sort((a, b) => a.name.localeCompare(b.name))

  } catch (error) {
    console.error('Error getting supported shipping countries:', error)
    return []
  }
}

// =================
// VALIDATION HELPERS
// =================

/**
 * Validate country code format
 */
export function isValidCountryCode(countryCode: string): boolean {
  return typeof countryCode === 'string' && 
         countryCode.length === 2 && 
         /^[A-Z]{2}$/.test(countryCode.toUpperCase())
}

/**
 * Validate shipping calculation request
 */
export function validateShippingRequest(request: ShippingCalculationRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!request.countryCode) {
    errors.push('Country code is required')
  } else if (!isValidCountryCode(request.countryCode)) {
    errors.push('Invalid country code format (must be 2-letter code like US, CA)')
  }

  if (typeof request.subtotalUSD !== 'number') {
    errors.push('Subtotal must be a number')
  } else if (request.subtotalUSD < 0) {
    errors.push('Subtotal cannot be negative')
  }

  if (request.currency && typeof request.currency !== 'string') {
    errors.push('Currency must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}