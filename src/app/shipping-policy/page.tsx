// src/app/shipping-policy/page.tsx
// Shipping policy page - pulls live rates from shipping zones where available

import Link from 'next/link'
import { db } from '@/lib/db'
import { getCustomerStoreSettings } from '@/lib/store-settings'
import PolicyPageShell from '@/components/customer/PolicyPageShell'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'
  return {
    title: `Shipping Policy - ${storeName}`,
    description: `Shipping rates, processing times, and delivery estimates for ${storeName} orders within the United States.`
  }
}

async function getShippingZones() {
  try {
    return await db.shippingZone.findMany({
      where: { isActive: true },
      include: {
        shippingRates: {
          where: { isActive: true },
          orderBy: { flatRate: 'asc' }
        }
      },
      orderBy: { isDefault: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching shipping zones:', error)
    return []
  }
}

export default async function ShippingPolicyPage() {
  const [settings, zones] = await Promise.all([
    getCustomerStoreSettings(),
    getShippingZones()
  ])
  const storeName = settings?.storeName || 'Hita&Co'
  const zonesWithRates = zones.filter(zone => zone.shippingRates.length > 0)

  return (
    <PolicyPageShell
      title="Shipping Policy"
      subtitle={`How ${storeName} orders are processed, shipped, and delivered`}
    >
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Order Processing</h2>
        <p className="text-gray-600 leading-relaxed">
          Orders are processed within 1–3 business days. During festive seasons and
          sale periods, processing may take slightly longer — we will let you know if
          your order is delayed. You will receive a confirmation once your order has
          been placed and again when it ships.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Shipping Within the USA</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We ship across the United States. Delivery estimates begin once your order
          has shipped, not when it is placed. Rural addresses may take a little longer.
        </p>

        {zonesWithRates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Zone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Rate</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Free Shipping</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Estimated Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {zonesWithRates.map(zone =>
                  zone.shippingRates.map(rate => (
                    <tr key={rate.id}>
                      <td className="px-4 py-3 text-gray-700">{zone.name}</td>
                      <td className="px-4 py-3 text-gray-700">${rate.flatRate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {rate.freeShippingThreshold
                          ? `Orders over $${rate.freeShippingThreshold.toFixed(0)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{rate.estimatedDays || 'Varies'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 leading-relaxed">
            Shipping cost is calculated at checkout based on your delivery address and
            shown before you place your order.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Tracking Your Order</h2>
        <p className="text-gray-600 leading-relaxed">
          Once your order ships, we will share tracking details so you can follow your
          package to your door. If your tracking has not updated for several days, please{' '}
          <Link href="/contact" className="text-purple-600 hover:text-purple-700 underline">
            contact us
          </Link>{' '}
          and we will look into it right away.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Lost or Damaged Packages</h2>
        <p className="text-gray-600 leading-relaxed">
          If your order arrives damaged or does not arrive at all, reach out within 7
          days of the delivery date (or expected delivery date) with your order number
          and photos of any damage. We will work with the carrier to resolve it and
          make things right.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Questions?</h2>
        <p className="text-gray-600 leading-relaxed">
          For anything shipping-related, please{' '}
          <Link href="/contact" className="text-purple-600 hover:text-purple-700 underline">
            get in touch
          </Link>
          {settings?.email ? (
            <> or email us at{' '}
              <a href={`mailto:${settings.email}`} className="text-purple-600 hover:text-purple-700 underline">
                {settings.email}
              </a>.
            </>
          ) : (
            '.'
          )}
        </p>
      </section>
    </PolicyPageShell>
  )
}
