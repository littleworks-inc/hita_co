// src/app/layout.tsx
// =====================================
// 🔧 COMPLETE ROOT LAYOUT WITH PWA SUPPORT
// Includes mobile app configuration, PWA manifest, and service worker registration
// =====================================

import type { Metadata, Viewport } from 'next'
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

// ✅ FIXED: Get store settings directly from database
async function getStoreSettings() {
  try {
    const settings = await db.storeSettings.findFirst()

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
        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        
        {/* Apple PWA Configuration */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hita&Co Mobile" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        {/* Microsoft PWA Configuration */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Hita&Co" />
        
        {/* Prevent zoom on form focus */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
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
        
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('📱 Service Worker registered successfully:', registration.scope);
                      
                      // Register for background sync
                      if ('sync' in window.ServiceWorkerRegistration.prototype) {
                        navigator.serviceWorker.ready.then(function(registration) {
                          return registration.sync.register('sync-offline-sales');
                        }).catch(function(error) {
                          console.warn('Background sync registration failed:', error);
                        });
                      }
                    })
                    .catch(function(error) {
                      console.warn('Service Worker registration failed:', error);
                    });
                });
                
                // Handle PWA installation prompt
                let deferredPrompt;
                window.addEventListener('beforeinstallprompt', (e) => {
                  console.log('📱 PWA install prompt available');
                  e.preventDefault();
                  deferredPrompt = e;
                  
                  // Show custom install button if you have one
                  const installButton = document.getElementById('pwa-install-button');
                  if (installButton) {
                    installButton.style.display = 'block';
                    installButton.addEventListener('click', () => {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                          console.log('📱 PWA installed');
                        }
                        deferredPrompt = null;
                      });
                    });
                  }
                });
                
                // Detect if app was launched as PWA
                window.addEventListener('load', () => {
                  if (window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true) {
                    console.log('📱 App launched as PWA');
                    document.body.classList.add('pwa-mode');
                  }
                });
              }
            `,
          }}
        />

        {/* Preload critical resources */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
        
        {/* PWA Installation Banner (Hidden by default) */}
        <div id="pwa-install-banner" style={{ display: 'none' }} className="fixed bottom-4 left-4 right-4 z-50 bg-purple-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Install Hita&Co App</h3>
              <p className="text-xs opacity-90">Get the full mobile experience</p>
            </div>
            <div className="flex items-center gap-2">
              <button id="pwa-install-button" className="bg-white text-purple-600 px-3 py-1 rounded text-xs font-medium">
                Install
              </button>
              <button id="pwa-dismiss-button" className="text-white opacity-70 text-lg leading-none" onclick="document.getElementById('pwa-install-banner').style.display='none'">
                ×
              </button>
            </div>
          </div>
        </div>
        
        {/* Offline Indicator */}
        <div id="offline-indicator" style={{ display: 'none' }} className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm">
          📶 You're offline. Some features may be limited.
        </div>
        
        {/* Online Indicator (shows briefly when coming back online) */}
        <div id="online-indicator" style={{ display: 'none' }} className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white text-center py-2 text-sm">
          ✅ You're back online. Syncing data...
        </div>
        
        {/* Network Status Detection */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function updateOnlineStatus() {
                const offlineIndicator = document.getElementById('offline-indicator');
                const onlineIndicator = document.getElementById('online-indicator');
                
                if (navigator.onLine) {
                  if (offlineIndicator) offlineIndicator.style.display = 'none';
                  if (onlineIndicator) {
                    onlineIndicator.style.display = 'block';
                    setTimeout(() => {
                      onlineIndicator.style.display = 'none';
                    }, 3000);
                  }
                  
                  // Trigger sync when back online
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                      if (registration.sync) {
                        registration.sync.register('sync-offline-sales');
                      }
                    });
                  }
                } else {
                  if (offlineIndicator) offlineIndicator.style.display = 'block';
                  if (onlineIndicator) onlineIndicator.style.display = 'none';
                }
              }
              
              window.addEventListener('online', updateOnlineStatus);
              window.addEventListener('offline', updateOnlineStatus);
              
              // Initial check
              document.addEventListener('DOMContentLoaded', updateOnlineStatus);
            `,
          }}
        />
        
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
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href
                  });
                `,
              }}
            />
          </>
        )}
        
        {/* Performance Monitoring */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Monitor performance for mobile experience
              if ('performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                      const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                      if (loadTime > 3000) {
                        console.warn('⚠️ Slow loading detected:', loadTime + 'ms');
                      }
                    }
                  }, 0);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}