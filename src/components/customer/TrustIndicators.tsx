// ✅ NEW: src/components/customer/TrustIndicators.tsx - Dynamic shipping settings

import { db } from '@/lib/db'
import { Shield, Truck, RotateCcw } from 'lucide-react'

// Get shipping settings from database
async function getShippingSettings() {
  try {
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

    if (defaultZone && defaultZone.shippingRates.length > 0) {
      const rate = defaultZone.shippingRates[0]
      return {
        freeShippingThreshold: rate.freeShippingThreshold,
        flatRate: rate.flatRate,
        estimatedDays: rate.estimatedDays,
        zoneName: defaultZone.name
      }
    }

    // Fallback values if no shipping configured
    return {
      freeShippingThreshold: 100,
      flatRate: 7,
      estimatedDays: '5-7 business days',
      zoneName: 'Default'
    }
  } catch (error) {
    console.error('Error fetching shipping settings:', error)
    // Fallback values
    return {
      freeShippingThreshold: 100,
      flatRate: 7,
      estimatedDays: '5-7 business days',
      zoneName: 'Default'
    }
  }
}

export default async function TrustIndicators() {
  const shippingSettings = await getShippingSettings()

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
              {shippingSettings.freeShippingThreshold 
                ? `Orders over $${shippingSettings.freeShippingThreshold.toFixed(0)}`
                : `Starting at $${shippingSettings.flatRate.toFixed(0)}`
              }
              {shippingSettings.estimatedDays && (
                <span className="block text-sm mt-1">
                  {shippingSettings.estimatedDays}
                </span>
              )}
            </p>
          </div>

          {/* Easy Returns */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <RotateCcw className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Returns</h3>
            <p className="text-gray-600">30-day return policy for your peace of mind.</p>
          </div>
        </div>
      </div>
    </section>
  )
}