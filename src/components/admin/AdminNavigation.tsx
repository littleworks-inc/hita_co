// src/components/admin/AdminNavigation.tsx
// 🗑️ REMOVED: "Print Labels" menu item - barcode printing now handled within product pages

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Building2,
  FolderTree,
  Share2,
  Truck,
  ImageIcon
  // 🗑️ REMOVED: Printer icon - no longer needed
} from 'lucide-react'

// 🗑️ CLEANED NAVIGATION ARRAY - Removed Print Labels menu item
const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  // 🗑️ REMOVED: { name: 'Print Labels', href: '/admin/barcode-printing', icon: Printer },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Building2 },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Shipping', href: '/admin/shipping', icon: Truck },
  { name: 'Hero Slides', href: '/admin/hero-slides', icon: ImageIcon },
  { name: 'Exhibitions', href: '/admin/exhibitions', icon: Calendar },
  { name: 'Social Media', href: '/admin/social', icon: Share2 },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

interface StoreSettings {
  storeName: string
  logo?: string | null
  primaryColor?: string | null
  favicon?: string | null
}

export default function AdminNavigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'Hita&Co Admin'
  })
  const router = useRouter()
  const pathname = usePathname()

  // Load store settings
  useEffect(() => {
    loadStoreSettings()
  }, [])

  const loadStoreSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/store')
      if (response.ok) {
        const settings = await response.json()
        setStoreSettings(settings)
      }
    } catch (error) {
      console.error('Failed to load store settings:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {storeSettings.logo ? (
              <img 
                src={storeSettings.logo} 
                alt={storeSettings.storeName}
                className="h-8 w-8 rounded object-cover"
              />
            ) : (
              <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {storeSettings.storeName.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-semibold text-gray-900 truncate">
              {storeSettings.storeName}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
          {storeSettings.logo ? (
            <img 
              src={storeSettings.logo} 
              alt={storeSettings.storeName}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {storeSettings.storeName.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-semibold text-gray-900 truncate">
            {storeSettings.storeName}
          </span>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>

        <div className="flex items-center gap-3">
          {storeSettings.logo ? (
            <img 
              src={storeSettings.logo} 
              alt={storeSettings.storeName}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {storeSettings.storeName.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-semibold text-gray-900 truncate">
            {storeSettings.storeName}
          </span>
        </div>
      </div>
    </>
  )
}