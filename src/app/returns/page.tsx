// src/app/returns/page.tsx
// Returns & exchanges policy - driven by return settings configured in admin

import Link from 'next/link'
import { getCustomerStoreSettings } from '@/lib/store-settings'
import PolicyPageShell from '@/components/customer/PolicyPageShell'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'
  return {
    title: `Sales & Returns Policy - ${storeName}`,
    description: `Sales and returns policy for ${storeName}.`
  }
}

export default async function ReturnsPage() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'
  const returnsEnabled = settings?.returnsEnabled ?? true
  const returnDays = settings?.returnPeriodDays || 30
  const hasRestockingFee = settings?.hasRestockingFee || false
  const restockingFee = settings?.restockingFeePercentage || 0

  return (
    <PolicyPageShell
      title={returnsEnabled ? 'Returns & Exchanges' : 'Sales Policy'}
      subtitle={
        returnsEnabled
          ? `We want you to love what you ordered from ${storeName}`
          : `Our current policy on returns at ${storeName}`
      }
    >
      {returnsEnabled ? (
        <>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Return Window</h2>
            <p className="text-gray-600 leading-relaxed">
              You may return eligible items within <strong>{returnDays} days</strong> of
              delivery. To be eligible, items must be unworn, unwashed, and in their
              original condition with all tags attached.
              {hasRestockingFee && restockingFee > 0 && (
                <> A {restockingFee}% restocking fee applies to returns.</>
              )}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What Cannot Be Returned</h2>
            <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
              <li>Items marked as final sale or purchased at clearance prices</li>
              <li>Items that have been worn, washed, altered, or damaged after delivery</li>
              <li>Items without original tags</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Start a Return</h2>
            <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
              <li>
                <Link href="/contact" className="text-purple-600 hover:text-purple-700 underline">
                  Contact us
                </Link>{' '}
                with your order number and the item(s) you would like to return.
              </li>
              <li>We will confirm eligibility and share the return address and instructions.</li>
              <li>Ship the item back to us. Return shipping is paid by the customer unless the item arrived damaged or incorrect.</li>
              <li>Once we receive and inspect the item, your refund is issued to your original payment method. Please allow 5–10 business days for it to appear.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Exchanges</h2>
            <p className="text-gray-600 leading-relaxed">
              Need a different size? Sizes for Indian wear can differ from standard US
              sizing — check our{' '}
              <Link href="/size-guide" className="text-purple-600 hover:text-purple-700 underline">
                Size Guide
              </Link>{' '}
              before ordering. If a size does not work out, contact us and we will
              arrange an exchange, subject to availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Damaged or Incorrect Items</h2>
            <p className="text-gray-600 leading-relaxed">
              If you received a damaged or incorrect item, contact us within 7 days of
              delivery with photos and your order number. We will replace the item or
              issue a full refund, including shipping, at no cost to you.
            </p>
          </section>
        </>
      ) : (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">All Sales Final</h2>
          <p className="text-gray-600 leading-relaxed">
            {settings?.noReturnsReason ||
              'We are currently unable to accept returns. Please review sizing and product details carefully before ordering.'}{' '}
            If your item arrives damaged or incorrect, please{' '}
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 underline">
              contact us
            </Link>{' '}
            within 7 days of delivery and we will make it right.
          </p>
        </section>
      )}
    </PolicyPageShell>
  )
}
