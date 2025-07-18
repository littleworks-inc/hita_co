// src/app/admin/barcode-printing/page.tsx
// ✅ NEW: Dedicated barcode printing page for admin

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminNavigation from '@/components/admin/AdminNavigation'
import AdminBarcodePrinting from '@/components/admin/AdminBarcodePrinting'
import { ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  sellingPriceUSD: number
  stockQuantity: number
  category: { name: string }
  requiresSizes: boolean
  productSizes?: Array<{
    id: string
    size: string
    sku: string
    stockQuantity: number
  }>
}

interface ApiResponse {
  products: Product[]
  categories: string[]
  stats: {
    totalProducts: number
    inStockProducts: number
    productsWithBarcodes: number
    categoriesCount: number
  }
}

export default function BarcodePrintingPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState<ApiResponse['stats'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/barcode-labels')
      if (!response.ok) {
        throw new Error('Failed to load products')
      }

      const data: ApiResponse = await response.json()
      setProducts(data.products)
      setCategories(data.categories)
      setStats(data.stats)

    } catch (err) {
      console.error('Error loading products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <main className="lg:pl-64">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              
              {/* Header */}
              <div className="border-b border-gray-200 pb-5 mb-6">
                <div className="flex items-center gap-4">
                  <Link href="/admin/products">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Products
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">
                      Barcode Label Printing
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Loading products...
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading Skeleton */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-6 rounded-lg border animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <main className="lg:pl-64">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              
              {/* Header */}
              <div className="border-b border-gray-200 pb-5 mb-6">
                <div className="flex items-center gap-4">
                  <Link href="/admin/products">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Products
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">
                      Barcode Label Printing
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Error loading products
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>

              <div className="mt-4">
                <Button onClick={loadProducts} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Success state - render the main component
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/admin/products">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Products
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">
                      Barcode Label Printing
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Select products and print professional barcode labels
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                {stats && (
                  <div className="hidden lg:flex items-center gap-6 text-sm text-gray-600">
                    <div className="text-center">
                      <div className="font-bold text-2xl text-gray-900">{stats.totalProducts}</div>
                      <div>Total Products</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl text-green-600">{stats.productsWithBarcodes}</div>
                      <div>With Barcodes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl text-blue-600">{stats.inStockProducts}</div>
                      <div>In Stock</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <AdminBarcodePrinting 
              products={products}
              mode="batch"
            />
          </div>
        </div>
      </main>
    </div>
  )
}