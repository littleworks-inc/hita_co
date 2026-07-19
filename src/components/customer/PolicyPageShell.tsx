// src/components/customer/PolicyPageShell.tsx
// Shared shell for policy/help pages: navigation, page header, and prose container

import { ReactNode } from 'react'
import CustomerNavigation from '@/components/customer/CustomerNavigation'
import { getCustomerStoreSettings } from '@/lib/store-settings'

interface PolicyPageShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default async function PolicyPageShell({ title, subtitle, children }: PolicyPageShellProps) {
  const settings = await getCustomerStoreSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation storeSettings={settings} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
}
