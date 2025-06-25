'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import ThemeToggle from '@/components/ThemeToggle' // ✅ NEW - Theme toggle for admin
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
  Share2
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Building2 },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Exhibitions', href: '/admin/exhibitions', icon: Calendar },
  { name: 'Social Media', href: '/admin/social', icon: Share2 },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            {/* Header with Theme Toggle */}
            <div className="flex flex-shrink-0 items-center justify-between px-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hita&Co</h1>
              {/* ✅ NEW - Theme toggle in admin sidebar */}
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
          </div>
          
          {/* Footer with Logout */}
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        {/* Mobile menu bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between transition-colors duration-300">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hita&Co</h1>
          <div className="flex items-center gap-2">
            {/* ✅ NEW - Mobile theme toggle */}
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hita&Co Admin</h1>
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
              <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <LogOut className="mr-3 h-5 w-5" />
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