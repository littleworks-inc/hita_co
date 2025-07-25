// public/sw.js
// Service Worker for Hita&Co Mobile Apps - Offline support and caching

const CACHE_NAME = 'hitaco-mobile-v1'
const STATIC_CACHE_NAME = 'hitaco-static-v1'
const API_CACHE_NAME = 'hitaco-api-v1'

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/admin/mobile',
  '/admin/login',
  '/exhibition/login',
  '/manifest.json',
  // Add your CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/admin/dashboard/mobile-stats',
  '/api/admin/products',
  '/api/admin/categories',
  '/api/admin/suppliers',
  '/api/exhibitions'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Cache API endpoints
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching API endpoints')
        return Promise.all(
          API_ENDPOINTS.map(url => {
            return fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response.clone())
              }
            }).catch(() => {
              // Silently fail for API caching during install
              console.log('Service Worker: Could not cache API endpoint:', url)
            })
          })
        )
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete')
      self.skipWaiting()
    })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
      self.clients.claim()
    })
  )
})

// Fetch event - handle requests with cache-first or network-first strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle different types of requests
  if (request.method === 'GET') {
    
    // Static assets - Cache first
    if (isStaticAsset(url.pathname)) {
      event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME))
    }
    
    // API requests - Network first with fallback
    else if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirstStrategy(request, API_CACHE_NAME))
    }
    
    // Pages - Network first with cache fallback
    else {
      event.respondWith(networkFirstStrategy(request, STATIC_CACHE_NAME))
    }
  }
  
  // POST requests for offline POS system
  else if (request.method === 'POST' && url.pathname.includes('/sales')) {
    event.respondWith(handleOfflineSale(request))
  }
})

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url)
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
    
  } catch (error) {
    console.error('Service Worker: Cache-first strategy failed:', error)
    return new Response('Offline - Asset not available', { status: 503 })
  }
}

// Network-first strategy for dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      await cache.put(request, networkResponse.clone())
      console.log('Service Worker: Network response cached:', request.url)
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url)
    
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('Service Worker: Serving stale cache:', request.url)
      return cachedResponse
    }
    
    // Return offline fallback for API requests
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({
        error: 'Offline',
        message: 'This feature requires internet connection',
        offline: true
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    // Return offline page for navigation requests
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Hita&Co</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            }
            .offline-icon { 
              font-size: 64px; 
              margin-bottom: 20px; 
            }
            .retry-btn {
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱💫</div>
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button class="retry-btn" onclick="location.reload()">Retry</button>
        </body>
      </html>
    `, {
      status: 503,
      headers: {
        'Content-Type': 'text/html'
      }
    })
  }
}

// Handle offline sales - store in IndexedDB for later sync
async function handleOfflineSale(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      return networkResponse
    }
  } catch (error) {
    console.log('Service Worker: Sale request failed, storing offline')
  }
  
  // Store sale offline
  const saleData = await request.json()
  await storeOfflineSale(saleData)
  
  return new Response(JSON.stringify({
    success: true,
    offline: true,
    saleNumber: `OFFLINE-${Date.now()}`,
    message: 'Sale stored offline. Will sync when online.'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// Store offline sale in IndexedDB
async function storeOfflineSale(saleData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HitaCoOffline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['offline_sales'], 'readwrite')
      const store = transaction.objectStore('offline_sales')
      
      const sale = {
        ...saleData,
        timestamp: Date.now(),
        synced: false,
        offline_id: `offline_${Date.now()}`
      }
      
      store.add(sale)
      
      transaction.oncomplete = () => {
        console.log('Service Worker: Offline sale stored')
        resolve(sale)
      }
      transaction.onerror = () => reject(transaction.error)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('offline_sales')) {
        const store = db.createObjectStore('offline_sales', { keyPath: 'offline_id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('synced', 'synced', { unique: false })
      }
    }
  })
}

// Helper function to identify static assets
function isStaticAsset(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.ico']
  const staticPaths = ['/_next/static/', '/icons/', '/screenshots/']
  
  return staticExtensions.some(ext => pathname.endsWith(ext)) ||
         staticPaths.some(path => pathname.startsWith(path))
}

// Sync offline sales when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-sales') {
    event.waitUntil(syncOfflineSales())
  }
})

// Sync offline sales function
async function syncOfflineSales() {
  try {
    const db = await openOfflineDB()
    const transaction = db.transaction(['offline_sales'], 'readonly')
    const store = transaction.objectStore('offline_sales')
    const unsyncedSales = await getAllUnsyncedSales(store)
    
    for (const sale of unsyncedSales) {
      try {
        const response = await fetch(`/api/exhibitions/${sale.exhibitionId}/sales`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sale)
        })
        
        if (response.ok) {
          // Mark as synced
          const updateTransaction = db.transaction(['offline_sales'], 'readwrite')
          const updateStore = updateTransaction.objectStore('offline_sales')
          sale.synced = true
          await updateStore.put(sale)
          console.log('Service Worker: Offline sale synced:', sale.offline_id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync sale:', sale.offline_id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync failed:', error)
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HitaCoOffline', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function getAllUnsyncedSales(store) {
  return new Promise((resolve, reject) => {
    const request = store.index('synced').getAll(false)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Handle background sync registration
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REGISTER_SYNC') {
    self.registration.sync.register('sync-offline-sales')
      .then(() => {
        console.log('Service Worker: Background sync registered')
      })
      .catch((error) => {
        console.error('Service Worker: Background sync registration failed:', error)
      })
  }
})

console.log('Service Worker: Script loaded')