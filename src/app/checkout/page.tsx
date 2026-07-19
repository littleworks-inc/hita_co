import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import CheckoutContent from '@/components/checkout/CheckoutContent'
import { getNavCategories } from '@/lib/store-settings'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Get store settings for branding
async function getStoreSettings() {
  try {
    const settings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    if (!settings) {
      return null
    }

    // Transform to match CustomerNavigation interface
    return {
      id: settings.id,
      storeName: settings.storeName,
      tagline: settings.tagline,
      logo: settings.logo,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      disableShoppingCart: settings.disableShoppingCart ?? undefined,
      catalogModeSettings: settings.catalogModeSettings ?? undefined,
    }
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return null
  }
}

// Generate metadata for checkout page
export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  
  return {
    title: `Checkout - ${storeName}`,
    description: `Secure checkout process for ${storeName}. Complete your purchase safely and securely.`,
    robots: 'noindex, nofollow' // Checkout pages shouldn't be indexed
  }
}

export default async function CheckoutPage() {
  const [storeSettings, navCategories] = await Promise.all([
    getStoreSettings(),
    getNavCategories()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} initialCategories={navCategories} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CheckoutContent />
      </main>
    </div>
  )
}