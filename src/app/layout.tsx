// src/app/layout.tsx
// =====================================
// 🔧 FIXED: ROOT LAYOUT WITH CORRECT TABLE NAME
// Fixed the database table name from storeSettings to storeSetting
// =====================================

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalLayoutWrapper from '@/components/ConditionalLayoutWrapper'
import SiteFooter from '@/components/customer/SiteFooter'
import { getCustomerStoreSettings } from '@/lib/store-settings'
import { SupportedCurrency, isValidCurrency, initializeExchangeRates } from '@/lib/currency'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

// Dynamic metadata - reads storeName/tagline/metaTitle/metaDescription/favicon
// from admin settings (StoreSetting) instead of hardcoding the brand name.
export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getCustomerStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Indian Ethnic Wear for Women in the USA'

  return {
    title: {
      default: storeSettings?.metaTitle || `${storeName} - ${tagline}`,
      template: `%s | ${storeName}`
    },
    description: storeSettings?.metaDescription || 'Authentic Indian ethnic wear for women, shipped within the USA. Handpicked kurtas, kurta sets, and festive wear with US-friendly sizing.',
    keywords: ['Indian ethnic wear USA', 'kurtas for women', 'kurta sets', 'Indian clothing USA', 'festive wear', 'ethnic wear online'],
    authors: [{ name: storeName }],
    creator: storeName,
    publisher: storeName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    manifest: '/manifest.json',
    icons: {
      icon: storeSettings?.favicon || '/favicon.ico'
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: `${storeName} Mobile`,
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Pinch-to-zoom must stay enabled: locking it out blocks anyone zooming in
  // on product photos or small text on mobile, a real accessibility issue.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8b5cf6' },
    { media: '(prefers-color-scheme: dark)', color: '#7c3aed' }
  ]
}

// Shared helper - same store settings query every customer page uses
async function getStoreSettings() {
  return getCustomerStoreSettings()
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
  let storeName = 'Hita&Co'
  try {
    const storeSettings = await getStoreSettings()
    storeName = storeSettings?.storeName || storeName
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
        <meta name="apple-mobile-web-app-title" content={storeName} />
        <meta name="application-name" content={storeName} />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Static icon assets (favicon itself comes from generateMetadata's `icons` field) */}
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
            footer={<SiteFooter />}
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