import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
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
    images: ['/og-image.jpg']
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
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
}

// Server-side function to get initial currency and rates (optional)
async function getInitialCurrencyData() {
  try {
    // You can fetch exchange rates server-side if needed
    // For now, we'll let the client handle it
    return {
      initialCurrency: 'USD' as const,
      initialRates: {}
    }
  } catch (error) {
    console.warn('Error fetching initial currency data:', error)
    return {
      initialCurrency: 'USD' as const,
      initialRates: {}
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get initial currency data (optional)
  const { initialCurrency, initialRates } = await getInitialCurrencyData()

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Prevent FOUC (Flash of Unstyled Content) */}
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
        {/* Fixed CurrencyProvider wrapper */}
        <CurrencyProvider 
          initialCurrency={initialCurrency}
          initialRates={initialRates}
        >
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
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