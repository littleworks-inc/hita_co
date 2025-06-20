import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ProductsSearchFilter from '@/components/admin/ProductsSearchFilter'
import ProductsTable from '@/components/admin/ProductsTable'
import {
  Package,
  Plus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// Quick Stats Component
async function ProductStats() {
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    featuredProducts
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.product.count({
      where: {
        stockQuantity: {
          lte: db.product.fields.lowStockAlert
        }
      }
    }),
    db.product.count({ where: { isFeatured: true } })
  ])

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Active Products',
      value: activeProducts,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Low Stock',
      value: lowStockProducts,
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      title: 'Featured',
      value: featuredProducts,
      icon: Package,
      color: 'purple'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 text-${stat.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Products Data Component
async function ProductsData({ searchQuery, categoryFilter }: { 
  searchQuery?: string
  categoryFilter?: string 
}) {
  const whereClause: any = {}
  
  if (searchQuery) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { sku: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } }
    ]
  }
  
  if (categoryFilter) {
    whereClause.categoryId = categoryFilter
  }

  const products = await db.product.findMany({
    where: whereClause,
    include: {
      category: true,
      country: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <ProductsTable 
      products={products}
      searchQuery={searchQuery}
      categoryFilter={categoryFilter}
    />
  )
}

interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get categories for the search filter
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' }
  })

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
                
                <Link href="/admin/products/new">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <Suspense fallback={<div>Loading stats...</div>}>
              <ProductStats />
            </Suspense>

            {/* Search and Filters */}
            <div className="mb-6">
              <ProductsSearchFilter 
                categories={categories}
                initialSearch={searchParams.search}
                initialCategory={searchParams.category}
              />
            </div>

            {/* Products Table */}
            <Suspense fallback={<div>Loading products...</div>}>
              <ProductsData 
                searchQuery={searchParams.search}
                categoryFilter={searchParams.category}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}