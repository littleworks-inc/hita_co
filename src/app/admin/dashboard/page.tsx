import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Globe,
  Store,
  ExternalLink,
  BarChart3
} from 'lucide-react'

// Dynamic Dashboard Stats Component
async function DashboardStats() {
  try {
    // Calculate date ranges for comparison
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [
      // Current period (last 30 days)
      currentStats,
      // Previous period (30-60 days ago) for comparison
      previousStats,
      // Product counts
      totalProducts,
      activeProducts,
      lowStockProducts,
      // Recent activity
      recentOrdersCount
    ] = await Promise.all([
      // Current period revenue and orders
      db.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          createdAt: { gte: thirtyDaysAgo, lte: now },
          status: { not: 'CANCELLED' }
        }
      }),
      // Previous period for comparison
      db.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: { not: 'CANCELLED' }
        }
      }),
      // Product statistics
      db.product.count(),
      db.product.count({ where: { isActive: true } }),
      // Use proper low stock logic: check against each product's own lowStockAlert
      db.$queryRaw`
        SELECT COUNT(*)::int as count 
        FROM products 
        WHERE "isActive" = true 
        AND "stockQuantity" <= "lowStockAlert"
      `.then((result: any) => result[0]?.count || 0),
      // Recent orders (last 7 days)
      db.order.count({
        where: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          status: { not: 'CANCELLED' }
        }
      })
    ])

    // Calculate changes
    const currentRevenue = currentStats._sum.total || 0
    const previousRevenue = previousStats._sum.total || 0
    const currentOrders = currentStats._count || 0
    const previousOrders = previousStats._count || 0

    // Debug logging
    console.log('Dashboard Debug:', {
      currentStats,
      previousStats,
      totalProducts,
      activeProducts,
      lowStockProducts,
      currentRevenue,
      currentOrders
    })

    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const ordersChange = previousOrders > 0 
      ? ((currentOrders - previousOrders) / previousOrders) * 100 
      : 0

    const productChange = totalProducts > 0 ? `${activeProducts} active` : 'Add products'

    // Determine if this is a fresh system
    const isFreshSystem = totalProducts === 0 || (currentRevenue === 0 && currentOrders === 0)

    const stats = [
      {
        title: 'Total Revenue',
        value: formatPrice(currentRevenue),
        change: revenueChange !== 0 ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%` : isFreshSystem ? 'Start selling' : 'No change',
        changeType: revenueChange > 0 ? 'positive' : revenueChange < 0 ? 'negative' : 'neutral',
        icon: DollarSign,
        isEmpty: currentRevenue === 0,
        actionText: 'View Store',
        actionLink: '/'
      },
      {
        title: 'Total Orders',
        value: currentOrders.toString(), // Fix: Ensure it's a string
        change: ordersChange !== 0 ? `${ordersChange > 0 ? '+' : ''}${ordersChange.toFixed(1)}%` : isFreshSystem ? 'Share your store' : 'No change',
        changeType: ordersChange > 0 ? 'positive' : ordersChange < 0 ? 'negative' : 'neutral',
        icon: ShoppingCart,
        isEmpty: currentOrders === 0,
        actionText: 'View Products',
        actionLink: '/admin/products'
      },
      {
        title: 'Products',
        value: totalProducts.toString(), // Fix: Ensure it's a string
        change: productChange,
        changeType: totalProducts > 0 ? 'positive' : 'neutral',
        icon: Package,
        isEmpty: totalProducts === 0,
        actionText: 'Add Product',
        actionLink: '/admin/products/new'
      },
      {
        title: 'Stock Status',
        value: totalProducts > 0 ? (lowStockProducts === 0 ? 'All Good' : `${lowStockProducts} Alert${lowStockProducts !== 1 ? 's' : ''}`) : 'No Products',
        change: lowStockProducts > 0 ? 'Needs attention' : totalProducts > 0 ? 'Well stocked' : 'Add inventory',
        changeType: lowStockProducts > 0 ? 'negative' : totalProducts > 0 ? 'positive' : 'neutral',
        icon: AlertTriangle,
        isEmpty: totalProducts === 0,
        actionText: lowStockProducts > 0 ? 'View Alerts' : totalProducts === 0 ? 'Add Product' : 'Manage Stock',
        actionLink: lowStockProducts > 0 ? '/admin/products?filter=low-stock' : totalProducts === 0 ? '/admin/products/new' : '/admin/products'
      }
    ]

    return (
      <div className="space-y-6">
        {/* Empty State Banner for Fresh System */}
        {isFreshSystem && (
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 text-center">
              {totalProducts === 0 ? (
                <>
                  <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to Hita&Co Admin Dashboard!
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Let's get started by adding your first product to the catalog.
                  </p>
                  <Link href="/admin/products/new">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Product
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Products Ready! Time to Start Selling
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    You have {totalProducts} products in your catalog. Share your store to start getting orders!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/">
                      <Button className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        View Your Store
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/admin/analytics">
                      <Button variant="outline" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        View Analytics
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${
                    stat.changeType === 'positive' ? 'bg-green-50' :
                    stat.changeType === 'negative' ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {stat.changeType === 'positive' && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                        {stat.changeType === 'negative' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                        <span className={`text-xs font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' :
                          stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      {stat.isEmpty && stat.actionText && (
                        <Link href={stat.actionLink || '#'}>
                          <Button size="sm" variant="outline" className="text-xs h-6">
                            {stat.actionText}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                {/* Subtle background decoration */}
                <div className="absolute -right-4 -bottom-4 opacity-5">
                  <Icon className="h-16 w-16" />
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Error loading dashboard statistics</p>
        </CardContent>
      </Card>
    )
  }
}

// Dynamic Recent Orders Component
async function RecentOrders() {
  try {
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    })

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Recent Orders
          </CardTitle>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No orders yet</p>
                <Link href="/">
                  <Button size="sm" className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" />
                    Share Your Store
                  </Button>
                </Link>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center">Error loading recent orders</p>
        </CardContent>
      </Card>
    )
  }
}

// Dynamic Low Stock Alert Component
async function LowStockAlert() {
  try {
    // Get detailed inventory information
    const [allProducts, lowStockProducts] = await Promise.all([
      // Get all products with their stock info
      db.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockAlert: true,
          isActive: true
        }
      }),
      // Get products that are actually low on stock
      db.$queryRaw`
        SELECT p.id, p.name, p.sku, p."stockQuantity", p."lowStockAlert"
        FROM products p
        WHERE p."isActive" = true 
        AND p."stockQuantity" <= p."lowStockAlert"
        ORDER BY p."stockQuantity" ASC
        LIMIT 5
      ` as Array<{
        id: string
        name: string
        sku: string
        stockQuantity: number
        lowStockAlert: number
      }>
    ])

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Inventory Status
          </CardTitle>
          <Link href="/admin/products">
            <Button variant="outline" size="sm">Manage Products</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Debug Info - Show actual database state */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
              <strong>Debug Info:</strong><br/>
              Total products in DB: {allProducts.length}<br/>
              Low stock alerts: {lowStockProducts.length}<br/>
              {allProducts.length > 0 && (
                <>
                  Products: {allProducts.map(p => `${p.name} (${p.stockQuantity}/${p.lowStockAlert})`).join(', ')}
                </>
              )}
            </div>

            {allProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No products found</p>
                <p className="text-sm text-gray-500 mb-4">Add your first product to start tracking inventory</p>
                <Link href="/admin/products/new">
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Add Product
                  </Button>
                </Link>
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">All {allProducts.length} product{allProducts.length !== 1 ? 's' : ''} well stocked!</p>
                <p className="text-sm text-gray-500">No inventory alerts</p>
                <div className="mt-4 space-y-2">
                  {allProducts.map(product => (
                    <div key={product.id} className="text-xs text-gray-600 flex justify-between">
                      <span>{product.name}</span>
                      <span>{product.stockQuantity} units (alert at {product.lowStockAlert})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-orange-600 font-medium mb-3">
                  {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} need{lowStockProducts.length === 1 ? 's' : ''} restocking
                </div>
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        {product.stockQuantity} left (alert at {product.lowStockAlert})
                      </p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.stockQuantity === 0 ? 'bg-red-100 text-red-800' :
                        product.stockQuantity <= Math.floor(product.lowStockAlert / 2) ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stockQuantity === 0 ? 'Out of Stock' :
                         product.stockQuantity <= Math.floor(product.lowStockAlert / 2) ? 'Critical' : 'Low Stock'}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Error fetching inventory status:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center space-y-2">
            <p>Error loading inventory status</p>
            <p className="text-xs">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }
}

// Quick Actions Component
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/admin/products/new">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </Link>
        <Link href="/admin/exhibitions/new">
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Create Exhibition
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </Link>
        <Link href="/">
          <Button className="w-full justify-start" variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            View Store
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboard() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-b border-gray-200 pb-5 mb-6">
              <h1 className="text-3xl font-bold leading-6 text-gray-900">
                Dashboard
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                Welcome back! Here's what's happening with your store.
              </p>
            </div>

            <div className="space-y-6">
              {/* Dynamic Stats */}
              <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }>
                <DashboardStats />
              </Suspense>

              {/* Main Content Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <Suspense fallback={
                    <Card>
                      <CardContent className="p-6">
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  }>
                    <RecentOrders />
                  </Suspense>
                </div>

                <div className="space-y-6">
                  <Suspense fallback={
                    <Card>
                      <CardContent className="p-6">
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  }>
                    <LowStockAlert />
                  </Suspense>

                  <QuickActions />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}