// FIXED src/app/admin/shipping/page.tsx
// Updated to work with new explicit many-to-many relationship

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ShippingManagement from '@/components/admin/ShippingManagement'
import { Truck } from 'lucide-react'

export default async function AdminShippingPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get existing shipping zones with their rates and countries (FIXED)
  const shippingZones = await db.shippingZone.findMany({
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
      { isDefault: 'desc' }, // Default zones first
      { name: 'asc' }
    ]
  })

  // Get all countries that are not yet assigned to any shipping zone (FIXED)
  const unassignedCountries = await db.country.findMany({
    where: {
      countryZones: {
        none: {}
      }
    },
    orderBy: { name: 'asc' }
  })

  // Get all countries for zone management (FIXED)
  const allCountries = await db.country.findMany({
    orderBy: { name: 'asc' }
  })

  // Get store settings to check default shipping zone (FIXED)
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
            where: { isActive: true }
          }
        }
      }
    }
  })

  // Transform the data to match the expected format (FIXED)
  const transformedZones = shippingZones.map(zone => ({
    ...zone,
    countries: zone.zoneCountries.map(zc => zc.country)
  }))

  // Transform store settings default zone (FIXED)
  const transformedStoreSettings = storeSettings ? {
    ...storeSettings,
    defaultShippingZone: storeSettings.defaultShippingZone ? {
      ...storeSettings.defaultShippingZone,
      countries: storeSettings.defaultShippingZone.zoneCountries.map(zc => zc.country)
    } : null
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Shipping Management
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Configure shipping zones, rates, and delivery options for your customers worldwide.
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Management Component */}
            <ShippingManagement 
              initialZones={transformedZones}
              unassignedCountries={unassignedCountries}
              allCountries={allCountries}
              storeSettings={transformedStoreSettings}
            />
          </div>
        </div>
      </main>
    </div>
  )
}