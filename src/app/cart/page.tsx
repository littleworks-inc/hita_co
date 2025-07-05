// ✅ FIXED: /src/app/cart/page.tsx
// Fix the type mismatch between Prisma model and component interface

import { Metadata } from 'next'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import CartPageContent from '@/components/cart/CartPageContent'

// ✅ FIXED: Type-safe interface that matches both Prisma and component needs
interface StoreSettings {
  id: string
  storeName: string
  tagline: string | null
  logo: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  disableShoppingCart?: boolean // Allow undefined, not null
  catalogModeSettings?: string
}

// Get store settings for branding
async function getStoreSettings(): Promise<StoreSettings | null> {
  const settings = await db.storeSetting.findFirst({
    where: { id: 'default' }
  })

  if (!settings) {
    return null
  }

  // ✅ FIXED: Transform Prisma result to match component interface
  return {
    id: settings.id,
    storeName: settings.storeName,
    tagline: settings.tagline,
    logo: settings.logo,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
    // ✅ CRITICAL FIX: Convert null to undefined for TypeScript compatibility
    disableShoppingCart: settings.disableShoppingCart ?? undefined,
    catalogModeSettings: settings.catalogModeSettings ?? undefined,
  }
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

// ✅ ALTERNATIVE APPROACH: Update component interfaces to accept null
// If you prefer to update the component interfaces instead, 
// change all StoreSettings interfaces to use:
// disableShoppingCart?: boolean | null
// catalogModeSettings?: string | null

// ✅ RECOMMENDED: Use the transformation approach above
// This maintains clean component interfaces while handling Prisma's null values