import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ProductsSearchFilter from '@/components/admin/ProductsSearchFilter'
import ProductImage from '@/components/admin/ProductImage'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Products Table Component
async function ProductsTable({ searchQuery, categoryFilter }: { 
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          All Products ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || categoryFilter 
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first product."
              }
            </p>
            <div className="mt-6">
              <Link href="/admin/products/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ProductImage 
                            images={product.images}
                            name={product.name}
                            className="h-12 w-12"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.category.name}</div>
                      <div className="text-sm text-gray-500">{product.country.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(product.sellingPriceUSD)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Cost: {formatPrice(product.costPriceUSD)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {product.stockQuantity} units
                        </div>
                        {product.stockQuantity <= product.lowStockAlert && (
                          <AlertTriangle className="ml-2 h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      {product.stockQuantity <= product.lowStockAlert && (
                        <div className="text-xs text-orange-600">
                          Low stock
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </span>
                      {product.isFeatured && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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
        stockQuantity: { lte: db.product.fields.lowStockAlert }
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
                
                {/* Search and Filter Controls */}
                <ProductsSearchFilter categories={categories} />
              </div>
            </div>

            {/* Quick Stats */}
            <Suspense fallback={<div>Loading stats...</div>}>
              <ProductStats />
            </Suspense>

            {/* Products Table */}
            <Suspense fallback={<div>Loading products...</div>}>
              <ProductsTable 
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