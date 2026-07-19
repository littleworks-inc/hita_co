// ✅ UPDATED: src/components/customer/CustomerNavigation.tsx - CATALOG/ECOMMERCE TOGGLE SUPPORT

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Search,
  Menu,
  X,
  ShoppingBag,
  User,
  ChevronDown,
  Home,
  Package
} from 'lucide-react'
import CurrencySelector from '@/components/customer/CurrencySelector'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'

interface Category {
  id: string
  name: string
  slug: string
  children?: Category[]
}

interface StoreSettings {
  id: string
  storeName: string
  tagline: string | null
  logo: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  disableShoppingCart?: boolean // ✅ NEW - Catalog mode toggle
  catalogModeSettings?: string  // ✅ NEW - Contact settings
}

interface CustomerNavigationProps {
  storeSettings: StoreSettings | null
  initialCategories?: Category[]
}

export default function CustomerNavigation({ storeSettings, initialCategories }: CustomerNavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])

  // Cart integration (✅ PRESERVED - Existing functionality)
  const { totalItems, totalPriceUSD, toggleCart, isClient } = useCart()
  const { formatPrice } = useCurrency()

  // ✅ NEW - Determine business mode
  const isECommerceMode = !storeSettings?.disableShoppingCart
  const showCartFeatures = isECommerceMode // Hide cart when in catalog mode

  // Fallback path: only used on the rare page that doesn't pass
  // initialCategories from the server (avoids a client round trip + flash
  // in the mobile menu's category list on every other page).
  useEffect(() => {
    if (initialCategories) return

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [initialCategories])

  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || '#7c3aed'
  const logo = storeSettings?.logo

  const mainNavigation = [
    { name: 'Home', href: '/', current: pathname === '/' },
    { name: 'All Products', href: '/products', current: pathname === '/products' },
    { name: 'Categories', href: '/categories', current: pathname.startsWith('/categories') },
    { name: 'About', href: '/about', current: pathname === '/about' },
    { name: 'Contact', href: '/contact', current: pathname === '/contact' }
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <>
      {/* Top Banner (✅ UNCHANGED) */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4">
        <p className="text-sm font-medium">
          ✨ Authentic Indian ethnic wear for women | Shipped across the USA
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo (✅ UNCHANGED) */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                {logo ? (
                  <Image
                    src={logo}
                    alt={storeName}
                    width={40}
                    height={40}
                    className="h-10 w-auto"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {storeName.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {storeName}
                  </h1>
                  {storeSettings?.tagline && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {storeSettings.tagline}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links (✅ UNCHANGED) */}
            <div className="hidden md:flex space-x-8">
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    item.current
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Search (✅ UNCHANGED) */}
              <div className="relative">
                {showSearch ? (
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-l-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 text-white px-4 py-2 rounded-r-full hover:bg-purple-700 transition-colors"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSearch(false)}
                      className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* Currency Selector (✅ UNCHANGED) */}
              <CurrencySelector className="hidden sm:block" />

              {/* ✅ CONDITIONAL: Cart Button - Only show in eCommerce mode */}
              {showCartFeatures && (
                <button 
                  onClick={toggleCart}
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative group"
                >
                  <ShoppingBag className="h-6 w-6" />
                  {/* Cart count badge */}
                  {isClient && totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                  
                  {/* Cart preview tooltip */}
                  {isClient && totalItems > 0 && (
                    <div className="absolute right-0 top-8 invisible group-hover:visible bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded py-2 px-3 whitespace-nowrap z-50">
                      {totalItems} item{totalItems !== 1 ? 's' : ''} • {formatPrice(totalPriceUSD)}
                    </div>
                  )}
                </button>
              )}

              {/* Account/order questions - no customer account system exists;
                  route to Contact so the icon isn't a dead click */}
              <Link
                href="/contact"
                aria-label="Order questions or contact us"
                className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <User className="h-6 w-6" />
              </Link>

              {/* Mobile menu button (✅ UNCHANGED) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (✅ ENHANCED with conditional cart features) */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40">
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Search (✅ UNCHANGED with dark mode) */}
              <form onSubmit={handleSearch} className="flex mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>

              {/* Mobile Navigation Links (✅ UNCHANGED with dark mode) */}
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Action Items */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {/* ✅ CONDITIONAL: Cart Summary for Mobile - Only show in eCommerce mode */}
                {showCartFeatures && isClient && totalItems > 0 && (
                  <button
                    onClick={() => {
                      toggleCart()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      <span className="font-medium">View Cart</span>
                    </div>
                    <span className="text-sm">
                      {totalItems} item{totalItems !== 1 ? 's' : ''} • {formatPrice(totalPriceUSD)}
                    </span>
                  </button>
                )}

                {/* ✅ CONDITIONAL: Business Mode Indicator for Mobile */}
                {!showCartFeatures && (
                  <div className="flex items-center justify-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      <span className="font-medium">Catalog Mode</span>
                    </div>
                  </div>
                )}

                {/* Mobile Currency & Theme Controls */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Mobile Currency Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Currency
                    </label>
                    <CurrencySelector showName={true} />
                  </div>
                </div>
              </div>

              {/* Mobile Categories (✅ UNCHANGED with dark mode) */}
              {categories.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}