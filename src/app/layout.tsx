import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { CartProvider } from '@/contexts/CartContext'
import { ThemeProvider } from '@/contexts/ThemeContext' // ✅ NEW - Theme system
import CartDrawer from '@/components/cart/CartDrawer'
import './globals.css'
import { db } from '@/lib/db'  // ✅ ADD THIS
import { isValidCurrency, SupportedCurrency } from '@/lib/currency'  // ✅ ADD THIS


const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com'),
  title: {
    default: 'Hita&Co - Authentic Indian Ethnic Wear & Lifestyle',
    template: '%s | Hita&Co'
  },
  description: 'Discover our curated collection of authentic handcrafted Indian ethnic wear, jewelry, and lifestyle products. Each piece tells a story of tradition, artistry, and timeless elegance.',
  keywords: [
    'Indian ethnic wear',
    'handcrafted jewelry',
    'traditional clothing',
    'sarees',
    'authentic Indian products',
    'artisan made',
    'ethnic fashion',
    'Indian accessories',
    'handmade crafts',
    'cultural wear',
    'traditional Indian jewelry',
    'ethnic home decor'
  ],
  authors: [{ name: 'Hita&Co', url: 'https://hitaandco.com' }],
  creator: 'Hita&Co',
  publisher: 'Hita&Co',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Hita&Co - Authentic Indian Ethnic Wear & Lifestyle',
    description: 'Discover our curated collection of authentic handcrafted Indian ethnic wear, jewelry, and lifestyle products.',
    siteName: 'Hita&Co',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hita&Co - Authentic Indian Products'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hita&Co - Authentic Indian Ethnic Wear & Lifestyle',
    description: 'Discover our curated collection of authentic handcrafted Indian ethnic wear, jewelry, and lifestyle products.',
    images: ['/twitter-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  }
}

// Get initial currency and exchange rates (server-side)
async function getInitialCurrencyData() {
  try {
    // 🎯 Read from admin settings (database)
    const storeSettings = await db.storeSetting.findFirst({
      where: { id: 'default' },
      select: { currency: true }
    })
    
    // ✅ Use admin currency with validation
    const adminCurrency = storeSettings?.currency || 'USD'
    const initialCurrency = isValidCurrency(adminCurrency) 
      ? adminCurrency as SupportedCurrency 
      : 'USD'
    
    // Fetch rates
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/currency/rates`)
    const initialRates = response.ok ? await response.json() : {}
    
    return { initialCurrency, initialRates }
  } catch (error) {
    return { initialCurrency: 'USD' as SupportedCurrency, initialRates: {} }
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Get initial currency data for SSR
  const { initialCurrency, initialRates } = await getInitialCurrencyData()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ ENHANCED - Better theme detection script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Prevent flash of wrong theme
                  var savedTheme = null;
                  var systemPrefersDark = false;
                  
                  try {
                    savedTheme = localStorage.getItem('theme-mode');
                  } catch (e) {
                    // localStorage might not be available
                  }
                  
                  try {
                    systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  } catch (e) {
                    // matchMedia might not be available
                  }
                  
                  // Apply theme immediately
                  if (savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark) || (!savedTheme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (error) {
                  // Fallback to light theme - don't log errors during hydration
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        {/* ✅ ENHANCED - Multi-provider wrapper with Theme system */}
        <ThemeProvider>
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
              
              {/* Global Cart Drawer - Available on all pages */}
              <CartDrawer />
            </CartProvider>
          </CurrencyProvider>
        </ThemeProvider>
        
        {/* Analytics scripts would go here */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
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
          </>
        )}
      </body>
    </html>
  )
}