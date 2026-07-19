// src/app/cart/page.tsx

import { Metadata } from 'next'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import CartPageContent from '@/components/cart/CartPageContent'
import { getCustomerStoreSettings, getNavCategories } from '@/lib/store-settings'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// Shared helper - same store settings query every customer page uses
async function getStoreSettings() {
  return getCustomerStoreSettings()
}

// Generate metadata for cart page
export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  
  return {
    title: `Shopping Cart - ${storeName}`,
    description: `Review your cart and proceed to checkout. Secure shopping with ${storeName}.`,
    robots: 'noindex, nofollow' // Cart pages typically shouldn't be indexed
  }
}

export default async function CartPage() {
  const [storeSettings, navCategories] = await Promise.all([
    getStoreSettings(),
    getNavCategories()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} initialCategories={navCategories} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CartPageContent />
      </main>
    </div>
  )
}