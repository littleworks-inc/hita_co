// src/components/customer/EnhancedFeaturedProducts.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Star, Crown, TrendingUp } from 'lucide-react'
import ProductCard from '@/components/customer/ProductCard'

interface Product {
  id: string
  sku: string
  name: string
  shortDescription?: string | null
  images: string[]
  sellingPriceUSD: number
  discountPercentage: number
  showDiscountToCustomers: boolean
  stockQuantity: number
  isFeatured: boolean
  category: {
    id: string
    name: string
    slug: string
  }
  country: {
    id: string
    name: string
    currency: string
    currencySymbol: string
  }
}

interface StoreSettings {
  storeName: string
  primaryColor?: string
  disableShoppingCart?: boolean
}

interface EnhancedFeaturedProductsProps {
  storeSettings: StoreSettings | null | undefined
}

export default function EnhancedFeaturedProducts({ storeSettings }: EnhancedFeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('⭐ EnhancedFeaturedProducts component mounted')
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      console.log('⭐ Fetching featured products...')
      // Updated API call to match the actual API structure
      const response = await fetch('/api/products?featured=true&limit=8')
      console.log('⭐ Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('⭐ Raw API response:', data)
        
        // Handle both possible response structures
        const products = data.products || data || []
        console.log('⭐ Extracted products:', products)
        
        // Filter for published products and exclude out of stock items
        const availableProducts = products.filter((product: any) => {
          const isPublished = product.status === 'PUBLISHED' || !product.status
          const hasStock = product.stockQuantity > 0
          console.log(`⭐ Product ${product.name}: Published=${isPublished}, Stock=${product.stockQuantity}, HasStock=${hasStock}`)
          return isPublished && hasStock
        })
        console.log('⭐ Available featured products (in stock only):', availableProducts)
        
        setProducts(availableProducts)
      } else {
        console.error('⭐ Failed to fetch featured products:', response.statusText)
        setError('Failed to load featured products')
      }
    } catch (error) {
      console.error('⭐ Error fetching featured products:', error)
      setError('Failed to load featured products')
    } finally {
      setLoading(false)
    }
  }

  console.log('⭐ EnhancedFeaturedProducts render - products count:', products.length, 'loading:', loading, 'error:', error)

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
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            Featured Collection
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Curating Our Best
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're handpicking the finest products for our featured collection. Stay tuned for exceptional pieces at {storeSettings?.storeName || 'our store'}!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
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
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            Featured Collection ⭐
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
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
                storeSettings={storeSettings || undefined}
              />
              {/* Featured Badge */}
              <div className="absolute -top-3 -right-3 z-10">
                <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-2 rounded-full shadow-lg">
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            View All Featured Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}