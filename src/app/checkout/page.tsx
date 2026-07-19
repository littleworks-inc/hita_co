import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import CheckoutContent from '@/components/checkout/CheckoutContent'
import { getCustomerStoreSettings, getNavCategories } from '@/lib/store-settings'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Shared helper - same store settings query every customer page uses
async function getStoreSettings() {
  return getCustomerStoreSettings()
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