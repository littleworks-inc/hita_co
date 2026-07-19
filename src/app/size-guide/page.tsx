// src/app/size-guide/page.tsx
// Size guide with Indian-to-US size conversion and measuring instructions

import Link from 'next/link'
import { Ruler } from 'lucide-react'
import { getCustomerStoreSettings } from '@/lib/store-settings'
import PolicyPageShell from '@/components/customer/PolicyPageShell'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const settings = await getCustomerStoreSettings()
  const storeName = settings?.storeName || 'Hita&Co'
  return {
    title: `Size Guide - ${storeName}`,
    description: `Find your perfect fit: Indian to US size conversion charts and measuring tips for kurtas, sets, and ethnic wear at ${storeName}.`
  }
}

// Standard women's Indian ethnic wear measurements (garment sizes, inches)
const sizeChart = [
  { size: 'XS', bust: '34', waist: '28', hip: '36', usSize: '0–2' },
  { size: 'S', bust: '36', waist: '30', hip: '38', usSize: '4–6' },
  { size: 'M', bust: '38', waist: '32', hip: '40', usSize: '8–10' },
  { size: 'L', bust: '40', waist: '34', hip: '42', usSize: '12' },
  { size: 'XL', bust: '42', waist: '36', hip: '44', usSize: '14' },
  { size: 'XXL', bust: '44', waist: '38', hip: '46', usSize: '16' },
]

const measuringSteps = [
  {
    title: 'Bust',
    description:
      'Measure around the fullest part of your bust, keeping the tape level and snug but not tight.'
  },
  {
    title: 'Waist',
    description:
      'Measure around your natural waistline — the narrowest part of your torso, usually just above the belly button.'
  },
  {
    title: 'Hip',
    description:
      'Stand with feet together and measure around the fullest part of your hips.'
  },
  {
    title: 'Length',
    description:
      'For kurtas, measure from the highest point of your shoulder down to where you want the hem to fall.'
  },
]

export default async function SizeGuidePage() {
  return (
    <PolicyPageShell
      title="Size Guide"
      subtitle="Indian ethnic wear sizing with US size conversions — find your perfect fit"
    >
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Women&apos;s Size Chart</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Our garments follow standard Indian sizing, which runs differently from US
          sizing. Use the chart below to match your body measurements (in inches) to
          the right size. If a specific product lists its own measurements, those take
          priority over this chart.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg text-sm">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Size</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Bust (in)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Waist (in)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Hip (in)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Approx. US Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sizeChart.map(row => (
                <tr key={row.size} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.size}</td>
                  <td className="px-4 py-3 text-gray-700">{row.bust}</td>
                  <td className="px-4 py-3 text-gray-700">{row.waist}</td>
                  <td className="px-4 py-3 text-gray-700">{row.hip}</td>
                  <td className="px-4 py-3 text-gray-700">{row.usSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Measure</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Use a soft measuring tape over well-fitting undergarments or light clothing.
          If you are between sizes, we recommend sizing up — most Indian silhouettes
          look best with a little ease.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {measuringSteps.map(step => (
            <div key={step.title} className="flex gap-3 p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Ruler className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Fit Notes for Indian Wear</h2>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
          <li>
            <strong>Kurtas and kurta sets</strong> are designed with a relaxed fit
            through the waist. Choose your size based on your bust measurement.
          </li>
          <li>
            <strong>Anarkalis and flared styles</strong> fit closer at the bust and
            flare below — bust measurement matters most here too.
          </li>
          <li>
            <strong>Handcrafted pieces</strong> may vary by up to half an inch from the
            chart — this is normal for artisan-made garments.
          </li>
          <li>
            <strong>Dupattas and drapes</strong> are one-size and listed with their
            dimensions on the product page.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Still Unsure?</h2>
        <p className="text-gray-600 leading-relaxed">
          Send us your measurements and the item you are eyeing via our{' '}
          <Link href="/contact" className="text-purple-600 hover:text-purple-700 underline">
            contact page
          </Link>{' '}
          and we will happily recommend a size. You can also review our{' '}
          <Link href="/returns" className="text-purple-600 hover:text-purple-700 underline">
            sales policy
          </Link>{' '}
          before ordering.
        </p>
      </section>
    </PolicyPageShell>
  )
}
