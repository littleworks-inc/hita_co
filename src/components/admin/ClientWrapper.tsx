'use client'

import { useEffect, useState } from 'react'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

interface ClientWrapperProps {
  children: React.ReactNode
  initialCurrency?: string
  initialRates?: Record<string, number>
}

export default function ClientWrapper({ 
  children, 
  initialCurrency = 'USD',
  initialRates = {} 
}: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prevent hydration mismatch by not rendering currency-dependent content until client-side
  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }

  return (
    <CurrencyProvider 
      initialCurrency={initialCurrency as any}
      initialRates={initialRates}
    >
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </CurrencyProvider>
  )
}