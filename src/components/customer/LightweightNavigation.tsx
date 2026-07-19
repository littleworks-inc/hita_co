// components/customer/LightweightNavigation.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  User,
  ChevronDown
} from 'lucide-react'

interface StoreSettings {
  id: string
  storeName: string
  tagline: string | null
  logo: string | null
  primaryColor: string
  disableShoppingCart?: boolean
}

interface LightweightNavigationProps {
  storeSettings: StoreSettings | null
}

export default function LightweightNavigation({ storeSettings }: LightweightNavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showUtilities, setShowUtilities] = useState(false)

  const { totalItems, isClient } = useCart()
  const isECommerceMode = !storeSettings?.disableShoppingCart

  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'
  const logo = storeSettings?.logo

  // Simplified navigation - only essential items
  const mainNavigation = [
    { name: 'Home', href: '/', current: pathname === '/' },
    { name: 'Products', href: '/products', current: pathname === '/products' },
    { name: 'Categories', href: '/categories', current: pathname.startsWith('/categories') },
    { name: 'Contact', href: '/contact', current: pathname === '/contact' }
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
      setShowSearch(false)
    }
  }

  return (
    <>
      {/* Simplified Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-center py-1.5 px-4">
        <p className="text-sm">✨ Authentic Indian ethnic wear for women | Shipped across the USA</p>
      </div>

      {/* Lightweight Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            
            {/* Compact Logo */}
            <div className="flex items-center min-w-0">
              <Link href="/" className="flex items-center space-x-2">
                {logo ? (
                  <Image
                    src={logo}
                    alt={storeName}
                    width={32}
                    height={32}
                    className="h-8 w-auto"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {storeName.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {storeName}
                  </h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Simplified */}
            <div className="hidden md:flex items-center space-x-6">
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    item.current
                      ? 'text-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Compact Action Items */}
            <div className="flex items-center space-x-2">
              {/* Search Toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-700 hover:text-purple-600 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Cart - Only in eCommerce mode */}
              {isECommerceMode && (
                <Link
                  href="/cart"
                  className="p-2 text-gray-700 hover:text-purple-600 transition-colors relative"
                  aria-label="Shopping cart"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {isClient && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>
              )}

              {/* Utilities Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowUtilities(!showUtilities)}
                  className="p-2 text-gray-700 hover:text-purple-600 transition-colors flex items-center"
                  aria-label="User menu"
                >
                  <User className="h-5 w-5" />
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
                
                {showUtilities && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Order History
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-purple-600"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar - Expandable */}
          {showSearch && (
            <div className="border-t bg-gray-50 px-4 py-3">
              <form onSubmit={handleSearch} className="flex max-w-md mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700 transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-2 space-y-1">
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile-only links */}
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                My Account
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

// Key Improvements:
// 1. Reduced height from h-16 to h-12 (25% smaller)
// 2. Simplified navigation items (4 instead of 5+)
// 3. Removed unnecessary features (wishlist, theme, currency)
// 4. Compact cart badge (smaller, simpler)
// 5. Search behind toggle (saves space)
// 6. Utilities in dropdown (cleaner)
// 7. Smaller logo and text
// 8. Reduced padding/margins throughout
// 9. Single utility dropdown instead of multiple buttons
// 10. Mobile-first responsive design