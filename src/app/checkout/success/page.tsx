// ✅ FIXED: /src/app/checkout/success/page.tsx
// Fixed getStoreSettings transformation

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import { getNavCategories } from '@/lib/store-settings'
import OrderConfirmation from '@/components/checkout/OrderConfirmation'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

// ✅ FIXED: Get store settings with proper transformation
async function getStoreSettings() {
  try {
    const settings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    if (!settings) {
      return null
    }

    // ✅ Transform Prisma result to match component interface
    return {
      id: settings.id,
      storeName: settings.storeName,
      tagline: settings.tagline,
      logo: settings.logo,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      // Convert null to undefined for TypeScript compatibility
      disableShoppingCart: settings.disableShoppingCart ?? undefined,
      catalogModeSettings: settings.catalogModeSettings ?? undefined,
    }
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return null
  }
}

// Get order details by order number
async function getOrderByNumber(orderNumber: string) {
  if (!orderNumber) return null
  
  try {
    const order = await db.order.findFirst({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                category: {
                  select: {
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    return order
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return null
  }
}

// Generate metadata for success page
export async function generateMetadata({ searchParams }: { searchParams: { orderNumber?: string } }): Promise<Metadata> {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  
  return {
    title: `Order Confirmed - ${storeName}`,
    description: `Your order has been successfully placed with ${storeName}. Thank you for your purchase!`,
    robots: 'noindex, nofollow' // Order confirmation pages shouldn't be indexed
  }
}

interface CheckoutSuccessPageProps {
  searchParams: {
    orderNumber?: string
  }
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { orderNumber } = searchParams
  
  // Get store settings and order data
  const [storeSettings, orderRaw, navCategories] = await Promise.all([
    getStoreSettings(),
    orderNumber ? getOrderByNumber(orderNumber) : null,
    getNavCategories()
  ])

  // If no order number provided or order not found, show 404
  if (!orderNumber || !orderRaw) {
    notFound()
  }

  // ✅ Transform order data to match OrderConfirmation interface
  const order = {
    ...orderRaw,
    createdAt: orderRaw.createdAt.toISOString(), // Convert Date to string
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} initialCategories={navCategories} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrderConfirmation order={order} storeSettings={storeSettings} />
      </main>
    </div>
  )
}