// src/app/privacy-policy/page.tsx
// Privacy policy for customer-facing store

import Link from 'next/link'
import { getCustomerStoreSettings } from '@/lib/store-settings'
import PolicyPageShell from '@/components/customer/PolicyPageShell'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'
  return {
    title: `Privacy Policy - ${storeName}`,
    description: `How ${storeName} collects, uses, and protects your personal information.`
  }
}

export default async function PrivacyPolicyPage() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'

  return (
    <PolicyPageShell
      title="Privacy Policy"
      subtitle={`How ${storeName} handles your personal information`}
    >
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          When you shop with us or contact us, we may collect:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
          <li>Your name, email address, phone number, and shipping/billing address when you place an order</li>
          <li>Order history and items in your cart</li>
          <li>Messages you send us through the contact form</li>
          <li>Basic technical information such as browser type and pages visited, used to keep the site working well</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
          <li>To process and deliver your orders and send order updates</li>
          <li>To respond to your questions and requests</li>
          <li>To improve our products, website, and customer experience</li>
          <li>To comply with legal obligations, such as tax and accounting requirements</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">What We Do Not Do</h2>
        <p className="text-gray-600 leading-relaxed">
          We do not sell your personal information. We only share it with service
          providers who help us run the store — such as shipping carriers and payment
          processors — and only as needed to fulfill your order.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Cookies</h2>
        <p className="text-gray-600 leading-relaxed">
          We use cookies and similar technologies to keep your cart working, remember
          your preferences (such as currency), and understand how the site is used. You
          can disable cookies in your browser, but parts of the site — like the
          shopping cart — may not work without them.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h2>
        <p className="text-gray-600 leading-relaxed">
          Your data is transmitted over encrypted connections and stored securely. We
          retain order information for as long as needed for legal, tax, and customer
          service purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Choices</h2>
        <p className="text-gray-600 leading-relaxed">
          You may request a copy of the personal information we hold about you, ask us
          to correct it, or ask us to delete it (subject to records we are legally
          required to keep). To make a request,{' '}
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

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          We may update this policy as the store evolves. The latest version will
          always be available on this page.
        </p>
      </section>
    </PolicyPageShell>
  )
}
