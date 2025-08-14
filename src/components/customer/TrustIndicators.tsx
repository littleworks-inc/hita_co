// ✅ ENHANCED: src/components/customer/TrustIndicators.tsx - Dynamic shipping + return policy

import { db } from '@/lib/db'
import { Shield, Truck, RotateCcw, AlertCircle } from 'lucide-react'

// Get shipping and store settings from database
// ✅ FIXED: TrustIndicators shipping settings with proper null handling

// Get shipping and store settings from database
async function getStoreAndShippingSettings() {
  try {
    // Get store settings for return policy
    const storeSettings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    // Get default shipping zone with rates
    const defaultZone = await db.shippingZone.findFirst({
      where: { 
        isDefault: true,
        isActive: true 
      },
      include: {
        shippingRates: {
          where: { isActive: true },
          orderBy: { flatRate: 'asc' }
        }
      }
    })

    let shippingSettings = {
      freeShippingThreshold: null as number | null,  // ✅ Allow null values
      flatRate: 7,
      estimatedDays: '5-7 business days' as string | null,
      zoneName: 'Default'
    }

    if (defaultZone && defaultZone.shippingRates.length > 0) {
      const rate = defaultZone.shippingRates[0]
      shippingSettings = {
        freeShippingThreshold: rate.freeShippingThreshold,  // ✅ Can be null
        flatRate: rate.flatRate,
        estimatedDays: rate.estimatedDays,  // ✅ Can be null
        zoneName: defaultZone.name
      }
    }

    // Return policy settings (with fallbacks)
    const returnPolicy = {
      returnsEnabled: storeSettings?.returnsEnabled ?? true,
      returnPeriodDays: storeSettings?.returnPeriodDays || 30,
      returnPolicyUrl: storeSettings?.returnPolicyUrl || null,
      hasRestockingFee: storeSettings?.hasRestockingFee || false,
      restockingFeePercentage: storeSettings?.restockingFeePercentage || 0,
      noReturnsReason: storeSettings?.noReturnsReason || null
    }

    return {
      shipping: shippingSettings,
      returns: returnPolicy
    }
  } catch (error) {
    console.error('Error fetching store and shipping settings:', error)
    // Fallback values
    return {
      shipping: {
        freeShippingThreshold: null as number | null,  // ✅ Consistent null handling
        flatRate: 7,
        estimatedDays: '5-7 business days' as string | null,
        zoneName: 'Default'
      },
      returns: {
        returnsEnabled: true,  // ✅ ADDED: Missing property
        returnPeriodDays: 30,
        returnPolicyUrl: null,
        hasRestockingFee: false,
        restockingFeePercentage: 0,
        noReturnsReason: null  // ✅ ADDED: Missing property
      }
    }
  }
}

export default async function TrustIndicators() {
  const settings = await getStoreAndShippingSettings()

  return (
    <section className="py-12 bg-white border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Secure Payment */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payment</h3>
            <p className="text-gray-600">100% protected with bank-level security encryption.</p>
          </div>

          {/* Dynamic Free Shipping */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Shipping</h3>
            <p className="text-gray-600">
              {/* ✅ FIXED: Handle null freeShippingThreshold */}
              {settings.shipping.freeShippingThreshold 
                ? `Orders over $${settings.shipping.freeShippingThreshold.toFixed(0)}`
                : `Starting at $${settings.shipping.flatRate.toFixed(0)}`
              }
              {settings.shipping.estimatedDays && (
                <span className="block text-sm mt-1">
                  {settings.shipping.estimatedDays}
                </span>
              )}
            </p>
          </div>

          {/* Dynamic Returns Policy */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
              settings.returns.returnsEnabled ? 'bg-purple-100' : 'bg-red-100'
            }`}>
              {settings.returns.returnsEnabled ? (
                <RotateCcw className="h-6 w-6 text-purple-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Returns</h3>
            <p className="text-gray-600">
              {settings.returns.returnsEnabled ? (
                <>
                  {settings.returns.returnPeriodDays}-day hassle-free returns
                  {settings.returns.hasRestockingFee && (
                    <span className="block text-sm mt-1">
                      {settings.returns.restockingFeePercentage}% restocking fee applies
                    </span>
                  )}
                </>
              ) : (
                <>
                  All sales final
                  {settings.returns.noReturnsReason && (
                    <span className="block text-sm mt-1">
                      {settings.returns.noReturnsReason}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}