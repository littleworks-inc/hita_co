// src/app/layout.tsx
// =====================================
// 🔧 FIXED ROOT LAYOUT
// Conditional currency context to prevent infinite loops on exhibition pages
// =====================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalLayoutWrapper from '@/components/ConditionalLayoutWrapper'
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
}

// ✅ FIXED: Get store settings directly from database
async function getStoreSettings() {
  try {
    const settings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    if (!settings) {
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

// ✅ FIXED: Simplified currency data fetching - only for customer pages
async function getInitialCurrencyData(): Promise<{
  initialCurrency: SupportedCurrency
  initialRates: Record<string, number>
}> {
  try {
    // Get admin settings for currency preference
    const storeSettings = await getStoreSettings()
    
    // Use admin currency with validation
    let initialCurrency: SupportedCurrency = 'USD'
    
    if (storeSettings?.currency && isValidCurrency(storeSettings.currency)) {
      initialCurrency = storeSettings.currency as SupportedCurrency
    }
    
    // Skip currency fetching to avoid loops - let client handle it
    return { initialCurrency, initialRates: {} }
  } catch (error) {
    console.warn('Error getting initial currency data:', error)
    return { initialCurrency: 'USD' as SupportedCurrency, initialRates: {} }
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Get initial currency data (will be ignored for exhibition/admin routes)
  const { initialCurrency, initialRates } = await getInitialCurrencyData()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme detection script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = null;
                  var systemPrefersDark = false;
                  
                  try {
                    savedTheme = localStorage.getItem('theme-mode');
                  } catch (e) {}
                  
                  try {
                    systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  } catch (e) {}
                  
                  if (savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark) || (!savedTheme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (error) {
                  // Fallback to light theme
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        {/* Theme Provider - Always available */}
        <ThemeProvider>
          {/* Conditional Context Wrapper - Excludes exhibition/admin routes */}
          <ConditionalLayoutWrapper
            initialCurrency={initialCurrency}
            initialRates={initialRates}
          >
            {children}
          </ConditionalLayoutWrapper>
        </ThemeProvider>
        
        {/* Analytics - Production only */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}