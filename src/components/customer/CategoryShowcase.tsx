'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Package,
  Sparkles,
  Grid3X3
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  products: Array<{
    id: string
    images: string[]
  }>
  _count: {
    products: number
  }
}

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/customer/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.slice(0, 6)) // Show only first 6 categories
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 aspect-square rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Grid3X3 className="h-6 w-6 text-purple-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <Grid3X3 className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our carefully curated collections of authentic Indian products
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category, index) => {
            const hasProductImage = category.products.length > 0 && category.products[0].images.length > 0
            const productImage = hasProductImage ? category.products[0].images[0] : null

            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                {/* Category Card */}
                <div className="aspect-square relative">
                  {/* Background Image or Gradient */}
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getGradientForIndex(index)} flex items-center justify-center`}>
                      <Package className="h-24 w-24 text-white/80" />
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-300"></div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    {/* Product Count Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                        {category._count.products} items
                      </span>
                    </div>

                    {/* Category Info */}
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-300 transition-colors">
                        {category.name}
                      </h3>
                      
                      {category.description && (
                        <p className="text-white/90 text-sm mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          {category.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                        <span>Shop Collection</span>
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Sparkle Effect */}
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* View All Categories Button */}
        <div className="text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <Grid3X3 className="h-5 w-5" />
            View All Categories
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Helper function to get gradient colors for categories
function getGradientForIndex(index: number): string {
  const gradients = [
    'from-purple-600 to-pink-600',
    'from-blue-600 to-purple-600',
    'from-green-600 to-blue-600',
    'from-yellow-600 to-orange-600',
    'from-pink-600 to-red-600',
    'from-indigo-600 to-purple-600'
  ]
  return gradients[index % gradients.length]
}