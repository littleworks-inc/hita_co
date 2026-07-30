// src/app/layout.tsx
// =====================================
// 🔧 FIXED: ROOT LAYOUT WITH CORRECT TABLE NAME
// Fixed the database table name from storeSettings to storeSetting
// =====================================

import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalLayoutWrapper from '@/components/ConditionalLayoutWrapper'
import SiteFooter from '@/components/customer/SiteFooter'
import { getCustomerStoreSettings } from '@/lib/store-settings'
import { SupportedCurrency, isValidCurrency, initializeExchangeRates } from '@/lib/currency'
import { DEFAULT_PRIMARY_COLOR, DEFAULT_ACCENT_COLOR } from '@/lib/brand'
import { hexToHslString, readableForeground } from '@/lib/color-utils'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

// Dynamic metadata - reads storeName/tagline/metaTitle/metaDescription/favicon
// from admin settings (StoreSetting) instead of hardcoding the brand name.
export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getCustomerStoreSettings()
  const storeName = storeSettings?.storeName || 'Hita&Co'
  const tagline = storeSettings?.tagline || 'Indian Ethnic Wear for Women in the USA'
  const primaryHex = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR

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
      'msapplication-TileColor': primaryHex,
      'msapplication-config': '/browserconfig.xml'
    }
  }
}

// Dynamic viewport - themeColor reflects the admin's configured brand color
// instead of a hardcoded purple (dark mode is forced off site-wide, but both
// media queries are kept for OS-level chrome like Android's browser bar tint).
export async function generateViewport(): Promise<Viewport> {
  const storeSettings = await getCustomerStoreSettings()
  const primaryHex = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR

  return {
    width: 'device-width',
    initialScale: 1,
    // Pinch-to-zoom must stay enabled: locking it out blocks anyone zooming in
    // on product photos or small text on mobile, a real accessibility issue.
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: primaryHex },
      { media: '(prefers-color-scheme: dark)', color: primaryHex }
    ]
  }
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
  let primaryHex = DEFAULT_PRIMARY_COLOR
  let accentHex = DEFAULT_ACCENT_COLOR
  try {
    const storeSettings = await getStoreSettings()
    storeName = storeSettings?.storeName || storeName
    primaryHex = storeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR
    accentHex = storeSettings?.accentColor || DEFAULT_ACCENT_COLOR
    currencyData = await getInitialCurrencyData()
  } catch (error) {
    console.error('Layout currency data error:', error)
    currencyData = {
      initialCurrency: 'USD' as SupportedCurrency,
      initialRates: {}
    }
  }

  const primaryHsl = hexToHslString(primaryHex)
  const accentHsl = hexToHslString(accentHex)
  const primaryForeground = readableForeground(primaryHex)
  const accentForeground = readableForeground(accentHex)

  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <head>
        {/* Brand colors from admin settings (StoreSetting.primaryColor/accentColor),
            overriding globals.css's stock shadcn :root variables so every shadcn
            primitive (Button, Input, Badge) picks up the real brand color. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${primaryHsl};
                --primary-foreground: ${primaryForeground};
                --accent: ${accentHsl};
                --accent-foreground: ${accentForeground};
                --ring: ${primaryHsl};
              }
            `,
          }}
        />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content={primaryHex} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={storeName} />
        <meta name="application-name" content={storeName} />
        <meta name="msapplication-TileColor" content={primaryHex} />
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