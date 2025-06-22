import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ProductsSearchFilter from '@/components/admin/ProductsSearchFilter'
import ProductsData from '@/components/admin/ProductsData'
import {
  Package,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star
} from 'lucide-react'

// Enhanced Product Stats Component
async function ProductStats() {
  try {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      lowStockProducts,
      outOfStockProducts
    ] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { isActive: true } }),
      db.product.count({ where: { isActive: false } }),
      db.product.count({ where: { isFeatured: true, isActive: true } }),
      // Low stock: using a simple threshold for now, could be made more sophisticated
      db.product.count({
        where: {
          isActive: true,
          stockQuantity: { gt: 0, lte: 10 } // Products with 1-10 items
        }
      }),
      db.product.count({
        where: {
          stockQuantity: { lte: 0 }
        }
      })
    ])

    const stats = [
      {
        title: 'Total Products',
        value: totalProducts,
        icon: Package,
        color: 'blue',
        description: `${activeProducts} active, ${inactiveProducts} inactive`
      },
      {
        title: 'Active Products',
        value: activeProducts,
        icon: CheckCircle,
        color: 'green',
        description: 'Ready for sale'
      },
      {
        title: 'Featured Products',
        value: featuredProducts,
        icon: Star,
        color: 'purple',
        description: 'Highlighted products'
      },
      {
        title: 'Stock Alerts',
        value: lowStockProducts + outOfStockProducts,
        icon: AlertTriangle,
        color: outOfStockProducts > 0 ? 'red' : lowStockProducts > 0 ? 'orange' : 'green',
        description: `${lowStockProducts} low, ${outOfStockProducts} out`
      }
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-50' :
                  stat.color === 'green' ? 'bg-green-50' :
                  stat.color === 'purple' ? 'bg-purple-50' :
                  stat.color === 'orange' ? 'bg-orange-50' :
                  stat.color === 'red' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    stat.color === 'orange' ? 'text-orange-600' :
                    stat.color === 'red' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  } catch (error) {
    console.error('Error fetching product stats:', error)
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm">Error loading stats</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}

interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    status?: string
    stock?: string
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get categories with product counts for the search filter
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Get total product count for the search component
  const totalProducts = await db.product.count()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Products
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Manage your product inventory, pricing, and stock levels.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <Suspense fallback={
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }>
              <ProductStats />
            </Suspense>

            {/* Search and Filters */}
            <div className="mb-6">
              <ProductsSearchFilter 
                categories={categories}
                totalProducts={totalProducts}
              />
            </div>

            {/* Products Table */}
            <Suspense fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            }>
              <ProductsData 
                searchQuery={searchParams.search}
                categoryFilter={searchParams.category}
                statusFilter={searchParams.status}
                stockFilter={searchParams.stock}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}