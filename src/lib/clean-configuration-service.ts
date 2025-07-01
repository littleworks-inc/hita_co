// =====================================
// src/lib/clean-configuration-service.ts
// Clean Configuration Service - No Business Assumptions
// =====================================

import { db } from '@/lib/db'

interface CleanConfigurationValue {
  placeholder: string
  description: string
}

interface CleanProductConfiguration {
  originalPrice: CleanConfigurationValue
  quantity: CleanConfigurationValue
  gstPercentage: CleanConfigurationValue
  shippingCost: CleanConfigurationValue
  conversionCharges: CleanConfigurationValue
  additionalExpenses: CleanConfigurationValue
  profitMargin: CleanConfigurationValue
  discountPercentage: CleanConfigurationValue
  lowStockAlert: CleanConfigurationValue
}

class CleanConfigurationService {
  private static instance: CleanConfigurationService

  private constructor() {}

  static getInstance(): CleanConfigurationService {
    if (!CleanConfigurationService.instance) {
      CleanConfigurationService.instance = new CleanConfigurationService()
    }
    return CleanConfigurationService.instance
  }

  /**
   * Get clean, descriptive placeholders with no business assumptions
   */
  async getCleanProductConfiguration(context?: {
    countryId?: string
    categoryId?: string
  }): Promise<CleanProductConfiguration> {
    
    // Get country for currency context only
    let currencySymbol = '$'
    let currencyCode = 'USD'
    
    if (context?.countryId) {
      try {
        const country = await db.country.findUnique({
          where: { id: context.countryId },
          select: { currency: true, currencySymbol: true }
        })
        if (country) {
          currencySymbol = country.currencySymbol
          currencyCode = country.currency
        }
      } catch (error) {
        // Fallback to USD if country not found
      }
    }

    return {
      originalPrice: {
        placeholder: `Enter original price (${currencySymbol})`,
        description: 'The price you paid for this product'
      },
      
      quantity: {
        placeholder: 'Enter quantity purchased',
        description: 'Number of pieces you bought'
      },
      
      gstPercentage: {
        placeholder: 'Enter tax/GST percentage',
        description: 'Tax rate applicable to this product (if any)'
      },
      
      shippingCost: {
        placeholder: `Enter shipping cost (${currencySymbol})`,
        description: 'Cost to ship this product to you'
      },
      
      conversionCharges: {
        placeholder: `Enter conversion charges (${currencySymbol})`,
        description: 'Currency conversion or payment processing fees'
      },
      
      additionalExpenses: {
        placeholder: `Enter additional expenses (${currencySymbol})`,
        description: 'Customs, duties, or other additional costs'
      },
      
      profitMargin: {
        placeholder: 'Enter profit margin percentage',
        description: 'Your desired profit margin for this product'
      },
      
      discountPercentage: {
        placeholder: 'Enter discount percentage',
        description: 'Discount to offer customers (optional)'
      },
      
      lowStockAlert: {
        placeholder: 'Enter low stock alert threshold',
        description: 'Alert when inventory falls below this number'
      }
    }
  }

  /**
   * Get currency information for display purposes only
   */
  async getCurrencyInfo(countryId: string): Promise<{
    currency: string
    currencySymbol: string
    exchangeRate: number | null
  }> {
    try {
      const country = await db.country.findUnique({
        where: { id: countryId },
        select: { 
          currency: true, 
          currencySymbol: true, 
          exchangeRate: true 
        }
      })
      
      return country || {
        currency: 'USD',
        currencySymbol: '$',
        exchangeRate: 1
      }
    } catch (error) {
      return {
        currency: 'USD',
        currencySymbol: '$',
        exchangeRate: 1
      }
    }
  }
}

// Export singleton instance
export const cleanConfigurationService = CleanConfigurationService.getInstance()

// Utility hook for React components
export const useCleanConfiguration = () => {
  return {
    getConfiguration: cleanConfigurationService.getCleanProductConfiguration.bind(cleanConfigurationService),
    getCurrencyInfo: cleanConfigurationService.getCurrencyInfo.bind(cleanConfigurationService)
  }
}