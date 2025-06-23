import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { CartProvider } from '@/contexts/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'
import './globals.css'

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
    // In a real app, you might detect user's location and set initial currency
    // For now, we'll use USD as default
    const initialCurrency = 'USD'
    
    // Fetch initial exchange rates (you might want to cache these)
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/currency/rates`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    const initialRates = response.ok ? await response.json() : {}
    
    return { initialCurrency, initialRates }
  } catch (error) {
    console.warn('Failed to fetch initial currency data:', error)
    return { initialCurrency: 'USD', initialRates: {} }
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
        {/* Theme detection script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        {/* Enhanced Provider wrapper with Cart and Currency */}
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