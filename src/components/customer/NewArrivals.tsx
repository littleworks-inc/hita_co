// src/components/customer/NewArrivals.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Calendar, Clock } from 'lucide-react'
import ProductCard from '@/components/customer/ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  sellingPriceUSD: number
  originalPrice: number | null
  discountPercentage: number | null
  images: string[]
  shortDescription?: string
  category: { name: string; slug: string }
  country: { name: string; currency: string }
  stockQuantity: number
  lowStockAlert: number
  requiresSizes: boolean
  status: string
  isFeatured: boolean
  createdAt: string
  productSizes?: Array<{
    size: string
    stockQuantity: number
    isActive: boolean
  }>
}

interface StoreSettings {
  storeName: string
  primaryColor?: string
  disableShoppingCart?: boolean
}

interface NewArrivalsProps {
  storeSettings: StoreSettings | null
}

export default function NewArrivals({ storeSettings }: NewArrivalsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNewArrivals()
  }, [])

  const fetchNewArrivals = async () => {
    try {
      const response = await fetch('/api/products?sort=newest&limit=8&status=PUBLISHED')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        setError('Failed to load new arrivals')
      }
    } catch (error) {
      console.error('Error fetching new arrivals:', error)
      setError('Failed to load new arrivals')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || products.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            New Arrivals
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fresh Arrivals Coming Soon
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're constantly adding new products to our collection. Check back soon for the latest arrivals at {storeSettings?.storeName || 'our store'}!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
          >
            Browse All Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    )
  }

  const displayProducts = products.slice(0, 8)

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            New Arrivals
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fresh Off the Collection
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our latest additions - handpicked pieces that just arrived at {storeSettings?.storeName || 'our store'}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {displayProducts.map((product) => (
            <div key={product.id} className="group">
              <ProductCard 
                product={product} 
                storeSettings={storeSettings}
              />
              {/* New Badge */}
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  New
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
          >
            View All New Arrivals
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// src/components/customer/EnhancedFeaturedProducts.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Star, Crown, TrendingUp } from 'lucide-react'
import ProductCard from '@/components/customer/ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  sellingPriceUSD: number
  originalPrice: number | null
  discountPercentage: number | null
  images: string[]
  shortDescription?: string
  category: { name: string; slug: string }
  country: { name: string; currency: string }
  stockQuantity: number
  lowStockAlert: number
  requiresSizes: boolean
  status: string
  isFeatured: boolean
  createdAt: string
  productSizes?: Array<{
    size: string
    stockQuantity: number
    isActive: boolean
  }>
}

interface StoreSettings {
  storeName: string
  primaryColor?: string
  disableShoppingCart?: boolean
}

interface EnhancedFeaturedProductsProps {
  storeSettings: StoreSettings | null
}

export default function EnhancedFeaturedProducts({ storeSettings }: EnhancedFeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=8&status=PUBLISHED')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        setError('Failed to load featured products')
      }
    } catch (error) {
      console.error('Error fetching featured products:', error)
      setError('Failed to load featured products')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl shadow-sm h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || products.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            Featured Collection
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Curating Our Best
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're handpicking the finest products for our featured collection. Stay tuned for exceptional pieces at {storeSettings?.storeName || 'our store'}!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Browse All Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    )
  }

  const displayProducts = products.slice(0, 8)

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            Featured Collection
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Staff Picks & Customer Favorites
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Handpicked by our team and loved by customers - discover the best of {storeSettings?.storeName || 'our collection'}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {displayProducts.map((product, index) => (
            <div key={product.id} className="group relative">
              <ProductCard 
                product={product} 
                storeSettings={storeSettings}
              />
              {/* Featured Badge */}
              <div className="absolute -top-3 -right-3 z-10">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-full shadow-lg">
                  <Crown className="h-4 w-4" />
                </div>
              </div>
              {/* Rank Badge for Top 3 */}
              {index < 3 && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                    #{index + 1}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            View All Featured Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}