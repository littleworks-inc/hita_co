import { Metadata } from 'next'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import CartPageContent from '@/components/cart/CartPageContent'

// Get store settings for branding
async function getStoreSettings() {
  return await db.storeSetting.findFirst({
    where: { id: 'default' }
  })
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
  const storeSettings = await getStoreSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CartPageContent />
      </main>
    </div>
  )
}