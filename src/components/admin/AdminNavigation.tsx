// Updated src/components/admin/AdminNavigation.tsx - ADD SHIPPING MENU ITEM

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import ThemeToggle from '@/components/ThemeToggle'
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
  Truck // ✅ NEW - Shipping icon
} from 'lucide-react'

// ✅ UPDATED NAVIGATION ARRAY - Add shipping menu item
const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Building2 },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Shipping', href: '/admin/shipping', icon: Truck }, // ✅ NEW - Shipping menu item
  { name: 'Exhibitions', href: '/admin/exhibitions', icon: Calendar },
  { name: 'Social Media', href: '/admin/social', icon: Share2 },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

interface StoreSettings {
  storeName: string
  logo?: string | null
  primaryColor?: string
}

function getCompanyInitials(companyName: string): string {
  return companyName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3)
}

export default function AdminNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'LittleWorks Inc', // Updated default as per user request
    primaryColor: '#1f2937'
  })

  // Fetch store settings on component mount
  useEffect(() => {
    async function fetchStoreSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        
        if (data.success && data.storeSettings) {
          setStoreSettings(data.storeSettings)
        }
      } catch (error) {
        console.error('Failed to fetch store settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoreSettings()
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/admin/login')
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {/* Company Logo/Icon */}
              {storeSettings.logo ? (
                <img
                  src={storeSettings.logo}
                  alt={storeSettings.storeName}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: storeSettings.primaryColor }}
                >
                  {getCompanyInitials(storeSettings.storeName)}
                </div>
              )}
              
              {/* Company Name */}
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isLoading ? 'Loading...' : storeSettings.storeName}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Admin Panel
                </p>
              </div>
            </div>
            
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />
          </div>
          
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive 
                        ? 'text-gray-500 dark:text-gray-400' 
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="flex-shrink-0 px-2 pb-2">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        {/* Mobile menu header */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-4 py-2 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile logo */}
            {storeSettings.logo ? (
              <img
                src={storeSettings.logo}
                alt={storeSettings.storeName}
                className="h-6 w-6 rounded object-cover"
              />
            ) : (
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: storeSettings.primaryColor }}
              >
                {getCompanyInitials(storeSettings.storeName)}
              </div>
            )}
            
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {isLoading ? 'Loading...' : storeSettings.storeName}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile theme toggle */}
            <ThemeToggle size="sm" showTooltip={false} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-gray-900">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </Button>
              </div>
              
              {/* Mobile menu header */}
              <div className="flex flex-shrink-0 items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {/* Mobile menu logo */}
                  {storeSettings.logo ? (
                    <img
                      src={storeSettings.logo}
                      alt={storeSettings.storeName}
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: storeSettings.primaryColor }}
                    >
                      {getCompanyInitials(storeSettings.storeName)}
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                      {isLoading ? 'Loading...' : storeSettings.storeName}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Admin Panel
                    </p>
                  </div>
                </div>
                <ThemeToggle size="sm" />
              </div>
              
              {/* Mobile menu navigation */}
              <div className="mt-5 h-0 flex-1 overflow-y-auto">
                <nav className="space-y-1 px-2">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            isActive 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                          }`}
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Mobile logout */}
              <div className="flex-shrink-0 px-2 pb-4">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="group flex w-full items-center px-2 py-2 text-base font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}