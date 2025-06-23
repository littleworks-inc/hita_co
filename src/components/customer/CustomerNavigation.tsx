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
  Heart,
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
}

interface CustomerNavigationProps {
  storeSettings: StoreSettings | null
}

export default function CustomerNavigation({ storeSettings }: CustomerNavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Cart integration
  const { totalItems, totalPriceUSD, toggleCart, isClient } = useCart()
  const { formatPrice } = useCurrency()

  // Fetch categories for navigation
  useEffect(() => {
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
  }, [])

  const storeName = storeSettings?.storeName || 'Hita&Co'
  const primaryColor = storeSettings?.primaryColor || '#1f2937'
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4">
        <p className="text-sm font-medium">
          ✨ Free shipping on orders over $100 | Authentic handcrafted products
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                {logo ? (
                  <Image
                    src={logo}
                    alt={storeName}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {storeName.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
                  {storeSettings?.tagline && (
                    <p className="text-xs text-gray-500">{storeSettings.tagline}</p>
                  )}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    item.current
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                {showSearch ? (
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-64 px-4 py-2 border border-gray-300 rounded-l-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* Currency Selector */}
              <CurrencySelector className="hidden sm:block" />

              {/* Wishlist */}
              <button className="text-gray-700 hover:text-red-500 transition-colors relative">
                <Heart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>

              {/* Enhanced Cart Button with live count and price */}
              <button 
                onClick={toggleCart}
                className="text-gray-700 hover:text-purple-600 transition-colors relative group"
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
                  <div className="absolute right-0 top-8 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-50">
                    {totalItems} item{totalItems !== 1 ? 's' : ''} • {formatPrice(totalPriceUSD)}
                  </div>
                )}
              </button>

              {/* User Account */}
              <button className="text-gray-700 hover:text-purple-600 transition-colors">
                <User className="h-6 w-6" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-700 hover:text-purple-600"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>

              {/* Mobile Navigation Links */}
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Cart Summary */}
              {isClient && totalItems > 0 && (
                <button
                  onClick={() => {
                    toggleCart()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 text-purple-600 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    <span>Shopping Cart</span>
                  </div>
                  <div className="text-sm">
                    {totalItems} item{totalItems !== 1 ? 's' : ''} • {formatPrice(totalPriceUSD)}
                  </div>
                </button>
              )}

              {/* Mobile Currency Selector */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="px-4 text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  Currency
                </h3>
                <div className="px-4">
                  <CurrencySelector showName={true} />
                </div>
              </div>

              {/* Mobile Categories */}
              {categories.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="px-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Categories
                  </h3>
                  <div className="mt-2 space-y-1">
                    {categories.slice(0, 5).map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors"
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

      {/* Categories Navigation Bar (Desktop) */}
      {categories.length > 0 && (
        <div className="hidden md:block bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8 py-3 overflow-x-auto">
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Shop by Category:
              </span>
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors whitespace-nowrap"
                >
                  {category.name}
                </Link>
              ))}
              {categories.length > 6 && (
                <Link
                  href="/categories"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                >
                  View All →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}