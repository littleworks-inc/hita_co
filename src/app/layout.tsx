// src/app/layout.tsx
// =====================================
// 🔧 COMPLETE ROOT LAYOUT WITH TOAST PROVIDER - SCHEMA CORRECTED
// Updated to match exact StoreSetting model fields only
// =====================================

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalLayoutWrapper from '@/components/ConditionalLayoutWrapper'
import { ToastProvider, ToastViewport } from '@/components/ui'
import { db } from '@/lib/db'
import { SupportedCurrency, isValidCurrency } from '@/lib/currency'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'Hita&Co - Premium Artisan Products',
    template: '%s | Hita&Co'
  },
  description: 'Discover unique artisan products from skilled craftsmen around the world. Premium quality, authentic craftsmanship.',
  keywords: ['artisan', 'handmade', 'crafts', 'premium', 'authentic', 'traditional'],
  authors: [{ name: 'Hita&Co Team' }],
  creator: 'Hita&Co',
  publisher: 'Hita&Co',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Hita&Co',
    title: 'Hita&Co - Premium Artisan Products',
    description: 'Discover unique artisan products from skilled craftsmen around the world.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hita&Co Premium Artisan Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hita&Co - Premium Artisan Products',
    description: 'Discover unique artisan products from skilled craftsmen around the world.',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f23' },
  ],
}

// ✅ CORRECTED: Get store settings with ONLY fields that exist in StoreSetting model
async function getStoreSettings() {
  try {
    // ✅ FIXED: Use correct table name 'storeSetting' (singular)
    const settings = await db.storeSetting.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
    
    if (!settings) {
      console.warn('No store settings found in database')
      return null
    }

    // ✅ CORRECTED: Return ONLY fields that exist in your StoreSetting schema
    return {
      // Basic store information
      id: settings.id,
      storeName: settings.storeName,
      tagline: settings.tagline,
      logo: settings.logo,
      favicon: settings.favicon,
      
      // Colors
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      
      // Contact information  
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      
      // Localization
      currency: settings.currency,
      timezone: settings.timezone,
      
      // Social media (only the ones that exist in schema)
      instagram: settings.instagram,
      facebook: settings.facebook,
      pinterest: settings.pinterest,
      twitter: settings.twitter,
      
      // AI integration fields
      aiProvider: settings.aiProvider,
      aiApiKey: settings.aiApiKey,
      aiModel: settings.aiModel,
      
      // Return policy fields
      returnsEnabled: settings.returnsEnabled ?? false,
      returnPeriodDays: settings.returnPeriodDays ?? 30,
      returnPolicyUrl: settings.returnPolicyUrl,
      hasRestockingFee: settings.hasRestockingFee ?? false,
      restockingFeePercentage: settings.restockingFeePercentage ?? 0,
      returnPolicyDescription: settings.returnPolicyDescription,
      noReturnsReason: settings.noReturnsReason,
      
      // eCommerce/Catalog mode toggles
      disableShoppingCart: settings.disableShoppingCart ?? undefined,
      catalogModeSettings: settings.catalogModeSettings ?? undefined,
      
      // System fields
      defaultShippingZoneId: settings.defaultShippingZoneId,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return null
  }
}

// ✅ FIXED: Get initial currency data with proper error handling
async function getInitialCurrencyData(): Promise<{
  initialCurrency: SupportedCurrency
  initialRates: Record<string, number>
}> {
  try {
    // Get admin-configured currency from database
    const storeSettings = await getStoreSettings()
    
    // Use admin currency with validation
    let initialCurrency: SupportedCurrency = 'USD' // fallback
    
    if (storeSettings?.currency && isValidCurrency(storeSettings.currency)) {
      initialCurrency = storeSettings.currency as SupportedCurrency
      console.log(`Using admin-configured currency: ${initialCurrency}`)
    } else {
      console.log('No admin currency found, using USD as fallback')
    }
    
    // Fetch exchange rates with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/currency/rates`, {
        next: { revalidate: 3600 },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const initialRates = response.ok ? await response.json() : {}
      
      return { initialCurrency, initialRates }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.warn('Failed to fetch exchange rates:', fetchError)
      return { 
        initialCurrency, 
        initialRates: {} 
      }
    }
  } catch (error) {
    console.error('Failed to fetch initial currency data:', error)
    return { 
      initialCurrency: 'USD' as SupportedCurrency, 
      initialRates: {} 
    }
  }
}

// Root layout component with error boundaries
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get initial data with error handling
  let currencyData
  try {
    currencyData = await getInitialCurrencyData()
  } catch (error) {
    console.error('Layout currency data error:', error)
    currencyData = { 
      initialCurrency: 'USD' as SupportedCurrency, 
      initialRates: {} 
    }
  }

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        
        {/* DNS Prefetch for external services */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        {/* Global Theme Provider */}
        <ThemeProvider>
          {/* Global Toast Provider */}
          <ToastProvider>
            {/* Conditional Layout Wrapper - handles different route contexts */}
            <ConditionalLayoutWrapper
              initialCurrency={currencyData.initialCurrency}
              initialRates={currencyData.initialRates}
            >
              {children}
            </ConditionalLayoutWrapper>
            
            {/* Toast Viewport - where toasts will be rendered */}
            <ToastViewport />
          </ToastProvider>
        </ThemeProvider>

        {/* Global Loading Indicator (optional) */}
        <div id="global-loading" className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 origin-left transition-transform duration-300 z-50" />
        
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
      </body>
    </html>
  )
}