import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ProductsFilter from '@/components/admin/ProductsFilter'
import ProductsData from '@/components/admin/ProductsData'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Plus, Package, AlertTriangle, FileText, Eye, Archive, Star } from 'lucide-react'
import Link from 'next/link'

// Enhanced Product Stats with Draft System
async function ProductStats() {
  try {
    // Get comprehensive product statistics
    const [
      totalProducts,
      statusStats,
      stockStats,
      featuredCount
    ] = await Promise.all([
      // Total product count
      db.product.count(),
      
      // Status distribution
      db.product.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),
      
      // Stock statistics
      db.$queryRaw`
        SELECT 
          COUNT(CASE WHEN "stockQuantity" > "lowStockAlert" THEN 1 END) as in_stock,
          COUNT(CASE WHEN "stockQuantity" <= "lowStockAlert" AND "stockQuantity" > 0 THEN 1 END) as low_stock,
          COUNT(CASE WHEN "stockQuantity" = 0 THEN 1 END) as out_of_stock
        FROM products 
        WHERE status = 'PUBLISHED'
      `,
      
      // Featured products count
      db.product.count({
        where: {
          status: 'PUBLISHED',
          isFeatured: true
        }
      })
    ])

    // Process status stats
    const statusCounts = {
      DRAFT: 0,
      PUBLISHED: 0,
      ARCHIVED: 0
    }

    statusStats.forEach((stat: any) => {
      statusCounts[stat.status as keyof typeof statusCounts] = stat._count.status
    })

    // Process stock stats
    const stockData: any = Array.isArray(stockStats) ? stockStats[0] : stockStats
    const inStock = Number(stockData?.in_stock || 0)
    const lowStock = Number(stockData?.low_stock || 0)
    const outOfStock = Number(stockData?.out_of_stock || 0)

    const stats = [
      {
        title: 'Total Products',
        value: totalProducts.toLocaleString(),
        description: 'All products in system',
        icon: Package,
        color: 'blue'
      },
      {
        title: 'Draft Products',
        value: statusCounts.DRAFT.toLocaleString(),
        description: 'Being created or edited',
        icon: FileText,
        color: 'gray'
      },
      {
        title: 'Published Products',
        value: statusCounts.PUBLISHED.toLocaleString(),
        description: 'Live and visible to customers',
        icon: Eye,
        color: 'green'
      },
      {
        title: 'Archived Products',
        value: statusCounts.ARCHIVED.toLocaleString(),
        description: 'Hidden but preserved',
        icon: Archive,
        color: 'orange'
      },
      {
        title: 'Featured Products',
        value: featuredCount.toLocaleString(),
        description: 'Promoted on homepage',
        icon: Star,
        color: 'purple'
      },
      {
        title: 'Low Stock Alert',
        value: lowStock.toLocaleString(),
        description: 'Needs restocking soon',
        icon: AlertTriangle,
        color: 'red'
      }
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${
                  stat.color === 'blue' ? 'bg-blue-50' :
                  stat.color === 'green' ? 'bg-green-50' :
                  stat.color === 'purple' ? 'bg-purple-50' :
                  stat.color === 'orange' ? 'bg-orange-50' :
                  stat.color === 'red' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    stat.color === 'orange' ? 'text-orange-600' :
                    stat.color === 'red' ? 'text-red-600' :
                    'text-gray-600'
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

  // Get categories with product counts for the filter component
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

  // Get total product count for the filter component
  const totalProducts = await db.product.count()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header with Draft System Info */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Products
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Manage your product inventory with draft workflow. Create drafts, publish when ready, and archive old products.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Quick Action Buttons */}
                  <Link href="/admin/products/new">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </Link>
                  
                  {/* Draft Info Tooltip */}
                  <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                    <FileText className="h-3 w-3" />
                    <span>New products start as drafts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Statistics */}
            <Suspense fallback={
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }>
              <ProductStats />
            </Suspense>

            {/* Enhanced Filtering System */}
            <ProductsFilter 
              categories={categories}
              totalProducts={totalProducts}
            />

            {/* Products Data with Draft System Support */}
            <Suspense fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-10 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
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

            {/* Draft System Quick Help */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      Draft System Workflow
                    </h3>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Draft:</strong> Products being created or edited - not visible to customers</p>
                      <p><strong>Published:</strong> Live products visible to customers with full validation</p>
                      <p><strong>Archived:</strong> Hidden products preserved in system for reference</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}