import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import OrderConfirmation from '@/components/checkout/OrderConfirmation'

// Get store settings for branding
async function getStoreSettings() {
  return await db.storeSetting.findFirst({
    where: { id: 'default' }
  })
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
  const [storeSettings, order] = await Promise.all([
    getStoreSettings(),
    orderNumber ? getOrderByNumber(orderNumber) : null
  ])

  // If no order number provided or order not found, show 404
  if (!orderNumber || !order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={storeSettings} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrderConfirmation order={order} storeSettings={storeSettings} />
      </main>
    </div>
  )
}