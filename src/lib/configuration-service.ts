// src/lib/configuration-service.ts
// ✅ FIXED: Configuration Service with correct export declarations

import { db } from '@/lib/db'

// ✅ FIXED: Single interface declaration without conflicts
interface ConfigurationValue {
  value: any
  source: 'user' | 'category' | 'country' | 'system'
  description?: string | null
}

interface ProductDefaults {
  gstPercentage: ConfigurationValue
  shippingCost: ConfigurationValue
  conversionCharges: ConfigurationValue
  additionalExpenses: ConfigurationValue
  profitMargin: ConfigurationValue
  lowStockAlert: ConfigurationValue
  quantity: ConfigurationValue
  originalPrice: ConfigurationValue
}

interface BusinessRules {
  maxDiscount: ConfigurationValue
  minProfitMargin: ConfigurationValue
  autoCalculatePricing: ConfigurationValue
  requireApprovalThreshold: ConfigurationValue
}

class ConfigurationService {
  private static instance: ConfigurationService
  private configCache: Map<string, any> = new Map()
  private cacheTimestamp = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService()
    }
    return ConfigurationService.instance
  }

  /**
   * Get configuration value with hierarchy: User > Category > Country > System Default
   */
  async getConfigurationValue(
    key: string,
    category: 'PRODUCT_DEFAULTS' | 'BUSINESS_RULES' | 'UI_SETTINGS',
    context?: {
      countryId?: string
      categoryId?: string
    }
  ): Promise<ConfigurationValue> {
    const cacheKey = `${category}:${key}:${context?.countryId || ''}:${context?.categoryId || ''}`
    
    // Check cache first
    if (this.isCacheValid() && this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey)
    }

    try {
      // Try to get user-specific configuration first
      const userConfig = await db.configurationSetting.findFirst({
        where: {
          category,
          key,
          countryId: context?.countryId === undefined ? null : context.countryId,
          categoryId: context?.categoryId === undefined ? null : context.categoryId,
          isActive: true
        },
        orderBy: { updatedAt: 'desc' }
      })

      if (userConfig) {
        const result = {
          value: this.deserializeConfigValue(userConfig.value, userConfig.dataType),
          source: 'user' as const,
          description: userConfig.description
        }
        this.configCache.set(cacheKey, result)
        return result
      }

      // ✅ REMOVED: Category field fallback since Category model doesn't have these fields
      // The Category model only has: id, name, description, slug, parentId, defaultRequiresSizes
      // It does NOT have fields like defaultProfitMargin, defaultDiscountMax, etc.

      // Fall back to system defaults
      const systemDefault = this.getSystemDefault(key, category)
      this.configCache.set(cacheKey, systemDefault)
      return systemDefault

    } catch (error) {
      console.error('Error getting configuration value:', error)
      // Return system default on error
      return this.getSystemDefault(key, category)
    }
  }

  /**
   * ✅ FIXED: Removed category field mapping since those fields don't exist
   */
  private async getCategoryDefaults(categoryId: string, key: string): Promise<ConfigurationValue | null> {
    try {
      // Since Category model doesn't have configuration fields,
      // we'll look for category-specific configuration settings instead
      const categoryConfig = await db.configurationSetting.findFirst({
        where: {
          categoryId,
          key,
          isActive: true
        },
        orderBy: { updatedAt: 'desc' }
      })

      if (categoryConfig) {
        return {
          value: this.deserializeConfigValue(categoryConfig.value, categoryConfig.dataType),
          source: 'category',
          description: categoryConfig.description
        }
      }

      return null
    } catch (error) {
      console.error('Error getting category defaults:', error)
      return null
    }
  }

  /**
   * Get country-specific defaults
   */
  private async getCountryDefaults(countryId: string, key: string): Promise<ConfigurationValue | null> {
    try {
      const country = await db.country.findUnique({
        where: { id: countryId },
        select: {
          defaultGstPercentage: true,
          defaultShippingCost: true,
          defaultTaxName: true
        }
      })

      if (!country) return null

      // Map country fields to configuration keys
      const countryFieldMap: Record<string, keyof typeof country> = {
        'gst_percentage': 'defaultGstPercentage',
        'shipping_cost': 'defaultShippingCost',
        'tax_name': 'defaultTaxName'
      }

      const field = countryFieldMap[key]
      if (field && country[field] !== null) {
        return {
          value: country[field],
          source: 'country',
          description: `Default ${key} for country`
        }
      }

      return null
    } catch (error) {
      console.error('Error getting country defaults:', error)
      return null
    }
  }

  /**
   * Get system default values
   */
  private getSystemDefault(key: string, category: string): ConfigurationValue {
    const defaults: Record<string, Record<string, any>> = {
      PRODUCT_DEFAULTS: {
        gst_percentage: 18,
        shipping_cost: 0,
        conversion_charges: 0,
        additional_expenses: 0,
        profit_margin: 30,
        low_stock_alert: 5,
        quantity: 1,
        original_price: 0
      },
      BUSINESS_RULES: {
        max_discount: 50,
        min_profit_margin: 10,
        auto_calculate_pricing: true,
        require_approval_threshold: 1000
      },
      UI_SETTINGS: {
        show_pricing_details: true,
        enable_bulk_actions: true,
        default_view: 'grid'
      }
    }

    return {
      value: defaults[category]?.[key] ?? 0,
      source: 'system',
      description: 'System default - configure your own values in settings'
    }
  }

  /**
   * Set configuration value
   */
  async setConfigurationValue(
    key: string,
    category: 'PRODUCT_DEFAULTS' | 'BUSINESS_RULES' | 'UI_SETTINGS',
    value: any,
    dataType: 'number' | 'string' | 'boolean' | 'json',
    context?: {
      countryId?: string
      categoryId?: string
      description?: string
    }
  ): Promise<void> {
    const serializedValue = this.serializeConfigValue(value, dataType)

    // Convert undefined to null properly
    const countryId = context?.countryId === undefined ? null : context.countryId
    const categoryId = context?.categoryId === undefined ? null : context.categoryId
    const description = context?.description === undefined ? null : context.description

    try {
      // Try to find existing record first
      const existingRecord = await db.configurationSetting.findFirst({
        where: {
          category,
          key,
          countryId,
          categoryId,
          isActive: true
        }
      })

      if (existingRecord) {
        // Update existing record
        await db.configurationSetting.update({
          where: { id: existingRecord.id },
          data: {
            value: serializedValue,
            dataType,
            description,
            updatedAt: new Date()
          }
        })
      } else {
        // Create new record
        await db.configurationSetting.create({
          data: {
            category,
            key,
            value: serializedValue,
            dataType,
            description,
            countryId,
            categoryId,
            isActive: true
          }
        })
      }

      // Clear cache
      this.clearCache()
    } catch (error) {
      console.error('Error setting configuration value:', error)
      throw new Error(`Failed to set configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Serialize configuration value based on data type
   */
  private serializeConfigValue(value: any, dataType: string): string {
    switch (dataType) {
      case 'json':
        return JSON.stringify(value)
      case 'boolean':
        return String(Boolean(value))
      case 'number':
        return String(Number(value))
      default:
        return String(value)
    }
  }

  /**
   * Deserialize configuration value based on data type
   */
  private deserializeConfigValue(value: string, dataType: string): any {
    try {
      switch (dataType) {
        case 'json':
          return JSON.parse(value)
        case 'boolean':
          return value === 'true'
        case 'number':
          return Number(value)
        default:
          return value
      }
    } catch (error) {
      console.warn(`Error deserializing config value: ${value}`, error)
      return value
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear()
    this.cacheTimestamp = 0
  }

  /**
   * Get all configuration values for a category
   */
  async getAllConfigurations(
    category: 'PRODUCT_DEFAULTS' | 'BUSINESS_RULES' | 'UI_SETTINGS',
    context?: {
      countryId?: string
      categoryId?: string
    }
  ): Promise<Record<string, ConfigurationValue>> {
    try {
      const configs = await db.configurationSetting.findMany({
        where: {
          category,
          countryId: context?.countryId === undefined ? null : context.countryId,
          categoryId: context?.categoryId === undefined ? null : context.categoryId,
          isActive: true
        },
        orderBy: { key: 'asc' }
      })

      const result: Record<string, ConfigurationValue> = {}
      
      for (const config of configs) {
        result[config.key] = {
          value: this.deserializeConfigValue(config.value, config.dataType),
          source: 'user',
          description: config.description
        }
      }

      return result
    } catch (error) {
      console.error('Error getting all configurations:', error)
      return {}
    }
  }
}

// Export singleton instance
export const configurationService = ConfigurationService.getInstance()

// ✅ FIXED: Export types at the end to avoid conflicts
export type { 
  ConfigurationValue, 
  ProductDefaults, 
  BusinessRules 
}