// src/app/layout.tsx
// =====================================
// 🔧 FIXED: ROOT LAYOUT WITH CORRECT TABLE NAME
// Fixed the database table name from storeSettings to storeSetting
// =====================================

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalLayoutWrapper from '@/components/ConditionalLayoutWrapper'
import { db } from '@/lib/db'
import { SupportedCurrency, isValidCurrency, initializeExchangeRates } from '@/lib/currency'
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
  keywords: ['artisan', 'handmade', 'crafts', 'premium', 'unique', 'authentic'],
  authors: [{ name: 'Hita&Co' }],
  creator: 'Hita&Co',
  publisher: 'Hita&Co',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hita&Co Mobile',
    startupImage: [
      {
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
        url: '/icons/apple-touch-startup-image-640x1136.png'
      },
      {
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
        url: '/icons/apple-touch-startup-image-750x1334.png'
      },
      {
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
        url: '/icons/apple-touch-startup-image-828x1792.png'
      }
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#8b5cf6',
    'msapplication-config': '/browserconfig.xml'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8b5cf6' },
    { media: '(prefers-color-scheme: dark)', color: '#7c3aed' }
  ]
}

// ✅ FIXED: Get store settings with correct table name and error handling
async function getStoreSettings() {
  try {
    // ✅ CRITICAL FIX: Changed from db.storeSettings to db.storeSetting (singular)
    const settings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    if (!settings) {
      console.warn('No store settings found, using defaults')
      return null
    }

    return {
      id: settings.id,
      storeName: settings.storeName,
      tagline: settings.tagline,
      logo: settings.logo,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      instagram: settings.instagram,
      facebook: settings.facebook,
      pinterest: settings.pinterest,
      twitter: settings.twitter,
      currency: settings.currency,
      disableShoppingCart: settings.disableShoppingCart ?? undefined,
      catalogModeSettings: settings.catalogModeSettings ?? undefined,
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
    
    // Get exchange rates directly (no HTTP call needed in server component)
    const initialRates = await initializeExchangeRates()

    return { initialCurrency, initialRates }
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
        <meta name="apple-mobile-web-app-title" content="Hita&Co" />
        <meta name="application-name" content="Hita&Co" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <ConditionalLayoutWrapper 
            initialCurrency={currencyData.initialCurrency}
            initialRates={currencyData.initialRates}
          >
            {children}
          </ConditionalLayoutWrapper>
        </ThemeProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}