import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { getCustomerLocation, getStoredExchangeRates } from '@/lib/currency'
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
    images: ['/og-image.jpg'],
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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#7c3aed' },
    ],
  },
  manifest: '/site.webmanifest',
  category: 'shopping',
  classification: 'ecommerce',
  verification: {
    // Add these when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: '/',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Hita&Co',
    'application-name': 'Hita&Co',
    'msapplication-TileColor': '#7c3aed',
    'theme-color': '#7c3aed',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get initial currency and exchange rates for the provider
  const [location, exchangeRates] = await Promise.all([
    getCustomerLocation(),
    getStoredExchangeRates()
  ])

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for likely external resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//api.exchangerate-api.com" />
        <link rel="dns-prefetch" href="//ip-api.com" />
        
        {/* Schema.org markup for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Hita&Co',
              description: 'Authentic Indian Ethnic Wear & Lifestyle',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com',
              logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hitaandco.com'}/logo.png`,
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service'
              },
              sameAs: [
                'https://www.facebook.com/hitaandco',
                'https://www.instagram.com/hitaandco',
                'https://www.pinterest.com/hitaandco'
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-purple-600 text-white px-4 py-2 z-50"
        >
          Skip to main content
        </a>
        
        <CurrencyProvider 
          initialCurrency={location.currency}
          initialRates={exchangeRates}
        >
          {children}
        </CurrencyProvider>
        
        {/* Web Vitals and Analytics can be added here */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics - Add your GA4 tracking ID */}
            {/*
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
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
            */}
          </>
        )}
      </body>
    </html>
  )
}