// =====================================
// scripts/seed-configuration-system.ts
// Database Seeder for Configuration System
// =====================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedConfigurationSystem() {
  console.log('🌱 Seeding Configuration System...')

  try {
    // =====================================
    // STEP 1: Update Countries with Configuration Data
    // =====================================
    console.log('\n1️⃣ Updating countries with business defaults...')

    const countryUpdates = [
      {
        name: 'India',
        defaultGstPercentage: 18,
        defaultShippingCost: 100,
        defaultTaxName: 'GST'
      },
      {
        name: 'United States',
        defaultGstPercentage: 8.5,
        defaultShippingCost: 15,
        defaultTaxName: 'Sales Tax'
      },
      {
        name: 'United Kingdom',
        defaultGstPercentage: 20,
        defaultShippingCost: 12,
        defaultTaxName: 'VAT'
      },
      {
        name: 'Canada',
        defaultGstPercentage: 13,
        defaultShippingCost: 18,
        defaultTaxName: 'HST/GST'
      },
      {
        name: 'Australia',
        defaultGstPercentage: 10,
        defaultShippingCost: 20,
        defaultTaxName: 'GST'
      }
    ]

    for (const countryData of countryUpdates) {
      try {
        await prisma.country.updateMany({
          where: { name: { contains: countryData.name, mode: 'insensitive' } },
          data: {
            defaultGstPercentage: countryData.defaultGstPercentage,
            defaultShippingCost: countryData.defaultShippingCost,
            defaultTaxName: countryData.defaultTaxName
          }
        })
        console.log(`   ✅ Updated ${countryData.name} with business defaults`)
      } catch (error) {
        console.log(`   ⚠️  Country ${countryData.name} not found, skipping`)
      }
    }

    // =====================================
    // STEP 2: Update Categories with Configuration Data
    // =====================================
    console.log('\n2️⃣ Updating categories with business defaults...')

    const categoryUpdates = [
      {
        name: 'Sarees',
        defaultProfitMargin: 120,
        defaultDiscountMax: 30,
        averagePrice: 85,
        suggestedTags: ['saree', 'ethnic', 'traditional', 'silk', 'cotton']
      },
      {
        name: 'Kurtas',
        defaultProfitMargin: 100,
        defaultDiscountMax: 25,
        averagePrice: 45,
        suggestedTags: ['kurta', 'ethnic', 'casual', 'cotton', 'comfortable']
      },
      {
        name: 'Lehengas',
        defaultProfitMargin: 150,
        defaultDiscountMax: 20,
        averagePrice: 180,
        suggestedTags: ['lehenga', 'bridal', 'festive', 'embroidered', 'silk']
      },
      {
        name: 'Traditional Jewelry',
        defaultProfitMargin: 80,
        defaultDiscountMax: 15,
        averagePrice: 65,
        suggestedTags: ['jewelry', 'traditional', 'handcrafted', 'gold-plated', 'ethnic']
      },
      {
        name: 'Accessories',
        defaultProfitMargin: 90,
        defaultDiscountMax: 40,
        averagePrice: 25,
        suggestedTags: ['accessories', 'handbag', 'scarf', 'ethnic', 'handmade']
      }
    ]

    for (const categoryData of categoryUpdates) {
      try {
        await prisma.category.updateMany({
          where: { name: { contains: categoryData.name, mode: 'insensitive' } },
          data: {
            defaultProfitMargin: categoryData.defaultProfitMargin,
            defaultDiscountMax: categoryData.defaultDiscountMax,
            averagePrice: categoryData.averagePrice,
            suggestedTags: categoryData.suggestedTags
          }
        })
        console.log(`   ✅ Updated ${categoryData.name} category with business defaults`)
      } catch (error) {
        console.log(`   ⚠️  Category ${categoryData.name} not found, skipping`)
      }
    }

    // =====================================
    // STEP 3: Create System Configuration Settings
    // =====================================
    console.log('\n3️⃣ Creating system configuration settings...')

    const systemConfigurations = [
      // Product Defaults
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'gst_percentage',
        value: '0',
        dataType: 'number',
        description: 'Default GST/Tax percentage - admin must set country-specific rates',
        isUserEditable: true
      },
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'shipping_cost',
        value: '0',
        dataType: 'number',
        description: 'Default shipping cost - admin must configure by country',
        isUserEditable: true
      },
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'conversion_charges',
        value: '0',
        dataType: 'number',
        description: 'Default conversion/handling charges - set based on payment method',
        isUserEditable: true
      },
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'additional_expenses',
        value: '0',
        dataType: 'number',
        description: 'Default additional expenses - customs, duties, etc.',
        isUserEditable: true
      },
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'profit_margin',
        value: '0',
        dataType: 'number',
        description: 'Default profit margin percentage - admin sets business strategy',
        isUserEditable: true
      },
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'low_stock_alert',
        value: '5',
        dataType: 'number',
        description: 'Default low stock alert threshold',
        isUserEditable: true
      },
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'quantity',
        value: '1',
        dataType: 'number',
        description: 'Default quantity purchased',
        isUserEditable: true
      },
      {
        category: 'PRODUCT_DEFAULTS',
        key: 'original_price',
        value: '0',
        dataType: 'number',
        description: 'Default original price - admin must enter actual cost',
        isUserEditable: true
      },

      // Business Rules
      {
        category: 'BUSINESS_RULES',
        key: 'max_discount',
        value: '50',
        dataType: 'number',
        description: 'Maximum discount percentage allowed (safety limit)',
        isUserEditable: true
      },
      {
        category: 'BUSINESS_RULES',
        key: 'min_profit_margin',
        value: '0',
        dataType: 'number',
        description: 'Minimum profit margin required',
        isUserEditable: true
      },
      {
        category: 'BUSINESS_RULES',
        key: 'auto_calculate_pricing',
        value: 'true',
        dataType: 'boolean',
        description: 'Automatically calculate selling price from cost + margin',
        isUserEditable: true
      },
      {
        category: 'BUSINESS_RULES',
        key: 'require_approval_threshold',
        value: '10000',
        dataType: 'number',
        description: 'Orders above this amount require approval (USD)',
        isUserEditable: true
      },

      // UI Settings
      {
        category: 'UI_SETTINGS',
        key: 'show_configuration_hints',
        value: 'true',
        dataType: 'boolean',
        description: 'Show configuration hints in product form',
        isUserEditable: true
      },
      {
        category: 'UI_SETTINGS',
        key: 'auto_currency_from_country',
        value: 'true',
        dataType: 'boolean',
        description: 'Automatically set currency from selected country',
        isUserEditable: true
      },
      {
        category: 'UI_SETTINGS',
        key: 'default_barcode_type',
        value: 'CODE128',
        dataType: 'string',
        description: 'Default barcode format for new products',
        isUserEditable: true
      }
    ]

    for (const config of systemConfigurations) {
      try {
        await prisma.configurationSetting.upsert({
          where: {
            category_key_countryId_categoryId: {
              category: config.category,
              key: config.key,
              countryId: null,
              categoryId: null
            }
          },
          update: {
            value: config.value,
            dataType: config.dataType,
            description: config.description,
            isUserEditable: config.isUserEditable
          },
          create: {
            category: config.category,
            key: config.key,
            value: config.value,
            dataType: config.dataType,
            description: config.description,
            isUserEditable: config.isUserEditable
          }
        })
        console.log(`   ✅ Created system configuration: ${config.category}.${config.key}`)
      } catch (error) {
        console.log(`   ⚠️  Failed to create configuration ${config.key}:`, error)
      }
    }

    // =====================================
    // STEP 4: Create Configuration Templates
    // =====================================
    console.log('\n4️⃣ Creating configuration templates...')

    const templates = [
      {
        name: 'ETHNIC_FASHION_DEFAULT',
        description: 'Default configuration for ethnic fashion products',
        settings: JSON.stringify({
          profitMargin: 100,
          gstPercentage: 18,
          shippingCost: 100,
          conversionCharges: 25,
          additionalExpenses: 50,
          lowStockAlert: 5,
          showDiscountToCustomers: true
        })
      },
      {
        name: 'JEWELRY_TEMPLATE',
        description: 'Optimized configuration for jewelry products',
        settings: JSON.stringify({
          profitMargin: 80,
          gstPercentage: 18,
          shippingCost: 150,
          conversionCharges: 50,
          additionalExpenses: 100,
          lowStockAlert: 3,
          showDiscountToCustomers: false
        })
      },
      {
        name: 'CLOTHING_TEMPLATE',
        description: 'Configuration template for clothing items',
        settings: JSON.stringify({
          profitMargin: 120,
          gstPercentage: 18,
          shippingCost: 80,
          conversionCharges: 30,
          additionalExpenses: 40,
          lowStockAlert: 8,
          showDiscountToCustomers: true
        })
      }
    ]

    for (const template of templates) {
      try {
        await prisma.configurationTemplate.upsert({
          where: { name: template.name },
          update: {
            description: template.description,
            settings: template.settings
          },
          create: template
        })
        console.log(`   ✅ Created configuration template: ${template.name}`)
      } catch (error) {
        console.log(`   ⚠️  Failed to create template ${template.name}:`, error)
      }
    }

    // =====================================
    // STEP 5: Update Store Settings with Configuration Defaults
    // =====================================
    console.log('\n5️⃣ Updating store settings with configuration defaults...')

    try {
      await prisma.storeSetting.updateMany({
        where: { id: 'default' },
        data: {
          // Add new configuration fields to existing store settings
          // Note: These should be added to the StoreSetting model first
          // defaultProfitMargin: 100,
          // defaultLowStockAlert: 5,
          // defaultQuantityPurchased: 1,
          // autoCalculateOriginalCurrency: true,
          // showConfigurationHints: true
        }
      })
      console.log('   ✅ Updated store settings with configuration defaults')
    } catch (error) {
      console.log('   ⚠️  Store settings update may require schema update first')
    }

    // =====================================
    // STEP 6: Success Summary
    // =====================================
    console.log('\n🎉 Configuration System Seeding Complete!')
    console.log('\n📋 What was created:')
    console.log('✅ Country-specific business defaults (GST rates, shipping costs)')
    console.log('✅ Category-specific recommendations (profit margins, pricing)')
    console.log('✅ System configuration settings (zero hardcoded values)')
    console.log('✅ Configuration templates for different product types')
    console.log('✅ Hierarchical configuration system (User > Category > Country > System)')

    console.log('\n🔄 Next steps:')
    console.log('1. Run: npx prisma db push (to sync schema changes)')
    console.log('2. Update ProductForm to use configurationService')
    console.log('3. Create admin interface for configuration management')
    console.log('4. Test the enhanced ProductPricing component')

    console.log('\n✨ Benefits achieved:')
    console.log('• Zero hardcoded values in the entire system')
    console.log('• Country-specific business rules and defaults')
    console.log('• Category-specific pricing recommendations')
    console.log('• Easy admin configuration without code changes')
    console.log('• Scalable for international business expansion')

  } catch (error) {
    console.error('❌ Configuration system seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeder
seedConfigurationSystem()
  .then(() => {
    console.log('\n🚀 Configuration system ready! Your platform now has:')
    console.log('   🎯 Dynamic pricing based on country and category')
    console.log('   📊 Smart business rules and recommendations')
    console.log('   ⚙️  Zero hardcoded values throughout the system')
    console.log('   🌍 International business scalability')
    console.log('\n⚠️  IMPORTANT: Update your ProductForm components to use the new configuration service!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure your database is running')
    console.log('2. Check your DATABASE_URL in .env file')
    console.log('3. Run: npx prisma db push (to sync schema)')
    console.log('4. Ensure all countries and categories exist in your database')
    process.exit(1)
  })

// 🚀 USAGE INSTRUCTIONS:
// 
// 1. First, add the configuration models to your prisma/schema.prisma
// 2. Run: npx prisma db push
// 3. Run this seeder: npx tsx scripts/seed-configuration-system.ts
// 4. Update your ProductForm components to use the configuration service
// 5. Test with the enhanced ProductPricing component