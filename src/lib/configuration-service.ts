// =====================================
// src/lib/configuration-service.ts
// Configuration Service - Dynamic Configuration Management
// =====================================

import { db } from '@/lib/db'

export interface ConfigurationValue {
  value: any
  source: 'user' | 'category' | 'country' | 'system'
  description?: string
}

export interface ProductDefaults {
  gstPercentage: ConfigurationValue
  shippingCost: ConfigurationValue
  conversionCharges: ConfigurationValue
  additionalExpenses: ConfigurationValue
  profitMargin: ConfigurationValue
  lowStockAlert: ConfigurationValue
  quantity: ConfigurationValue
  originalPrice: ConfigurationValue
}

export interface BusinessRules {
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
          countryId: context?.countryId,
          categoryId: context?.categoryId,
          isActive: true
        }
      })

      if (userConfig) {
        const value = this.parseConfigValue(userConfig.value, userConfig.dataType)
        const result = {
          value,
          source: 'user' as const,
          description: userConfig.description
        }
        this.configCache.set(cacheKey, result)
        return result
      }

      // Fall back to category-specific defaults
      if (context?.categoryId) {
        const categoryDefaults = await this.getCategoryDefaults(context.categoryId, key)
        if (categoryDefaults) {
          this.configCache.set(cacheKey, categoryDefaults)
          return categoryDefaults
        }
      }

      // Fall back to country-specific defaults
      if (context?.countryId) {
        const countryDefaults = await this.getCountryDefaults(context.countryId, key)
        if (countryDefaults) {
          this.configCache.set(cacheKey, countryDefaults)
          return countryDefaults
        }
      }

      // Fall back to system defaults
      const systemDefault = this.getSystemDefault(key)
      this.configCache.set(cacheKey, systemDefault)
      return systemDefault

    } catch (error) {
      console.error('Configuration service error:', error)
      const fallback = this.getSystemDefault(key)
      this.configCache.set(cacheKey, fallback)
      return fallback
    }
  }

  /**
   * Get all product defaults for a specific context
   */
  async getProductDefaults(context?: {
    countryId?: string
    categoryId?: string
  }): Promise<ProductDefaults> {
    const [
      gstPercentage,
      shippingCost,
      conversionCharges,
      additionalExpenses,
      profitMargin,
      lowStockAlert,
      quantity,
      originalPrice
    ] = await Promise.all([
      this.getConfigurationValue('gst_percentage', 'PRODUCT_DEFAULTS', context),
      this.getConfigurationValue('shipping_cost', 'PRODUCT_DEFAULTS', context),
      this.getConfigurationValue('conversion_charges', 'PRODUCT_DEFAULTS', context),
      this.getConfigurationValue('additional_expenses', 'PRODUCT_DEFAULTS', context),
      this.getConfigurationValue('profit_margin', 'PRODUCT_DEFAULTS', context),
      this.getConfigurationValue('low_stock_alert', 'PRODUCT_DEFAULTS', context),
      this.getConfigurationValue('quantity', 'PRODUCT_DEFAULTS', context),
      this.getConfigurationValue('original_price', 'PRODUCT_DEFAULTS', context)
    ])

    return {
      gstPercentage,
      shippingCost,
      conversionCharges,
      additionalExpenses,
      profitMargin,
      lowStockAlert,
      quantity,
      originalPrice
    }
  }

  /**
   * Get category-specific defaults
   */
  private async getCategoryDefaults(categoryId: string, key: string): Promise<ConfigurationValue | null> {
    const category = await db.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) return null

    // Map category fields to configuration keys
    const categoryFieldMap: Record<string, keyof typeof category> = {
      'profit_margin': 'defaultProfitMargin',
      'discount_max': 'defaultDiscountMax',
      'average_price': 'averagePrice'
    }

    const field = categoryFieldMap[key]
    if (field && category[field] !== null) {
      return {
        value: category[field],
        source: 'category',
        description: `Default for ${category.name} category`
      }
    }

    return null
  }

  /**
   * Get country-specific defaults
   */
  private async getCountryDefaults(countryId: string, key: string): Promise<ConfigurationValue | null> {
    const country = await db.country.findUnique({
      where: { id: countryId }
    })

    if (!country) return null

    // Map country fields to configuration keys
    const countryFieldMap: Record<string, keyof typeof country> = {
      'gst_percentage': 'defaultGstPercentage',
      'shipping_cost': 'defaultShippingCost'
    }

    const field = countryFieldMap[key]
    if (field && country[field] !== null) {
      return {
        value: country[field],
        source: 'country',
        description: `Default for ${country.name}`
      }
    }

    return null
  }

  /**
   * System defaults - no hardcoded values, all zero/empty
   */
  private getSystemDefault(key: string): ConfigurationValue {
    const systemDefaults: Record<string, any> = {
      // Product defaults - all start at zero, admin must set their own values
      'gst_percentage': 0,
      'shipping_cost': 0,
      'conversion_charges': 0,
      'additional_expenses': 0,
      'profit_margin': 0,
      'low_stock_alert': 0,
      'quantity': 1, // Minimum viable default
      'original_price': 0,
      
      // Business rules
      'max_discount': 50, // Maximum 50% discount for safety
      'min_profit_margin': 0,
      'auto_calculate_pricing': true,
      'require_approval_threshold': 10000, // Orders over $10,000 need approval
      
      // UI settings
      'show_configuration_hints': true,
      'auto_currency_from_country': true
    }

    return {
      value: systemDefaults[key] ?? 0,
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

    await db.configurationSetting.upsert({
      where: {
        category_key_countryId_categoryId: {
          category,
          key,
          countryId: context?.countryId || null,
          categoryId: context?.categoryId || null
        }
      },
      update: {
        value: serializedValue,
        dataType,
        description: context?.description,
        updatedAt: new Date()
      },
      create: {
        category,
        key,
        value: serializedValue,
        dataType,
        description: context?.description,
        countryId: context?.countryId,
        categoryId: context?.categoryId
      }
    })

    // Clear cache
    this.clearCache()
  }

  /**
   * Get placeholder text for input fields
   */
  async getPlaceholderText(
    key: string,
    context?: {
      countryId?: string
      categoryId?: string
    }
  ): Promise<string> {
    const config = await this.getConfigurationValue(key, 'PRODUCT_DEFAULTS', context)
    
    if (config.value === 0 || config.value === null) {
      return 'Not set - configure in settings'
    }
    
    const sourceLabel = {
      'user': 'Your setting',
      'category': 'Category default',
      'country': 'Country default',
      'system': 'System default'
    }[config.source]
    
    return `${config.value} (${sourceLabel})`
  }

  /**
   * Cache management
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL
  }

  private clearCache(): void {
    this.configCache.clear()
    this.cacheTimestamp = 0
  }

  /**
   * Value parsing and serialization
   */
  private parseConfigValue(value: string, dataType: string): any {
    switch (dataType) {
      case 'number':
        return parseFloat(value) || 0
      case 'boolean':
        return value === 'true'
      case 'json':
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      default:
        return value
    }
  }

  private serializeConfigValue(value: any, dataType: string): string {
    switch (dataType) {
      case 'json':
        return JSON.stringify(value)
      case 'boolean':
        return value ? 'true' : 'false'
      default:
        return String(value)
    }
  }
}

// Export singleton instance
export const configurationService = ConfigurationService.getInstance()

// Utility functions for React components
export const useConfiguration = () => {
  return {
    getProductDefaults: configurationService.getProductDefaults.bind(configurationService),
    getConfigurationValue: configurationService.getConfigurationValue.bind(configurationService),
    getPlaceholderText: configurationService.getPlaceholderText.bind(configurationService),
    setConfigurationValue: configurationService.setConfigurationValue.bind(configurationService)
  }
}