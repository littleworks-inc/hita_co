import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import CheckoutContent from '@/components/checkout/CheckoutContent'

// Get store settings for branding
async function getStoreSettings() {
  return await db.storeSettings.findFirst({
    where: { id: 'default' }
  })
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
  const storeSettings = await getStoreSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CheckoutContent />
      </main>
    </div>
  )
}