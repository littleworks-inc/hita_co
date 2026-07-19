// src/app/terms/page.tsx
// Terms of service for customer-facing store

import Link from 'next/link'
import { getCustomerStoreSettings } from '@/lib/store-settings'
import PolicyPageShell from '@/components/customer/PolicyPageShell'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'
  return {
    title: `Terms of Service - ${storeName}`,
    description: `Terms and conditions for shopping at ${storeName}.`
  }
}

export default async function TermsPage() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'

  return (
    <PolicyPageShell
      title="Terms of Service"
      subtitle={`The terms that apply when you shop at ${storeName}`}
    >
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">About These Terms</h2>
        <p className="text-gray-600 leading-relaxed">
          By using this website and placing an order with {storeName}, you agree to
          these terms. Please read them together with our{' '}
          <Link href="/shipping-policy" className="text-purple-600 hover:text-purple-700 underline">
            Shipping Policy
          </Link>
          ,{' '}
          <Link href="/returns" className="text-purple-600 hover:text-purple-700 underline">
            Sales Policy
          </Link>
          , and{' '}
          <Link href="/privacy-policy" className="text-purple-600 hover:text-purple-700 underline">
            Privacy Policy
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Products &amp; Pricing</h2>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
          <li>
            Many of our pieces are handcrafted. Small variations in color, weave, print,
            and embroidery are natural characteristics of handmade Indian wear, not defects.
          </li>
          <li>
            Colors may appear slightly different on screen depending on your display settings.
          </li>
          <li>
            Prices are listed in US dollars unless another currency is selected. We may
            change prices at any time, but changes will not affect orders already placed.
          </li>
          <li>
            Applicable sales tax, where required, is added at checkout.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Orders</h2>
        <p className="text-gray-600 leading-relaxed">
          Placing an order is an offer to purchase. We may cancel or refuse an order —
          for example, if an item is out of stock, a price was listed in error, or we
          cannot verify order details. If we cancel your order, you will receive a full
          refund of any amount paid.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Sizing</h2>
        <p className="text-gray-600 leading-relaxed">
          Indian garment sizing can differ from standard US sizing. Please review our{' '}
          <Link href="/size-guide" className="text-purple-600 hover:text-purple-700 underline">
            Size Guide
          </Link>{' '}
          and the measurements listed on each product before ordering.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Intellectual Property</h2>
        <p className="text-gray-600 leading-relaxed">
          All content on this site — including photos, product descriptions, and the{' '}
          {storeName} name and logo — belongs to {storeName} and may not be used
          without our written permission.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
        <p className="text-gray-600 leading-relaxed">
          To the fullest extent permitted by law, {storeName} is not liable for
          indirect or consequential damages arising from your use of this site or our
          products. Our total liability for any claim is limited to the amount you paid
          for the item(s) in question.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
        <p className="text-gray-600 leading-relaxed">
          Questions about these terms? Please{' '}
          <Link href="/contact" className="text-purple-600 hover:text-purple-700 underline">
            contact us
          </Link>
          {settings?.email ? (
            <> or email{' '}
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
