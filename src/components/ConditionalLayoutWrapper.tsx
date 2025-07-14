// src/components/ConditionalLayoutWrapper.tsx
// =====================================
// 🔧 CONDITIONAL LAYOUT WRAPPER
// Excludes exhibition routes from CurrencyProvider to prevent infinite loops
// Only applies currency context to customer-facing pages
// =====================================

'use client'

import { usePathname } from 'next/navigation'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { CartProvider } from '@/contexts/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'
import { SupportedCurrency } from '@/lib/currency'
import { ReactNode } from 'react'

interface ConditionalLayoutWrapperProps {
  children: ReactNode
  initialCurrency: SupportedCurrency
  initialRates: Record<string, number>
}

export default function ConditionalLayoutWrapper({
  children,
  initialCurrency,
  initialRates
}: ConditionalLayoutWrapperProps) {
  const pathname = usePathname()
  
  // Define routes that should NOT use CurrencyProvider/CartProvider
  const excludedRoutes = [
    '/exhibition/', // Exhibition portal routes (but not login)
    '/admin/',      // Admin routes (but not login)
    '/api'         // API routes
  ]
  
  // Special handling for login pages - they need basic layout but no contexts
  const isLoginPage = pathname === '/exhibition/login' || pathname === '/admin/login'
  
  // Check if current route should be excluded (but not login pages)
  const isExcludedRoute = excludedRoutes.some(route => pathname.startsWith(route)) && !isLoginPage
  
  // If it's a login page, provide basic layout without contexts
  if (isLoginPage) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }
  
  // If it's an excluded route, don't wrap with CurrencyProvider/CartProvider
  if (isExcludedRoute) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }
  
  // For customer-facing pages, use full context providers
  return (
    <CurrencyProvider 
      initialCurrency={initialCurrency}
      initialRates={initialRates}
    >
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
        
        {/* Cart Drawer - Only available on customer pages */}
        <CartDrawer />
      </CartProvider>
    </CurrencyProvider>
  )
}