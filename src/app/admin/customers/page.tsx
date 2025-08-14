import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import CustomersTable from '@/components/admin/CustomersTable'
import { Card, CardContent } from '@/components/ui'
import { RefreshCw } from 'lucide-react'

// Server component to fetch initial customer data
async function CustomersData() {
  try {
    // Get all orders to aggregate customer data
    const allOrders = await db.order.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sellingPriceUSD: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Aggregate customer data
    const customerMap = new Map()

    allOrders.forEach(order => {
      const customerKey = order.customerEmail.toLowerCase()
      
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
          orders: [],
          status: 'active'
        })
      }

      const customer = customerMap.get(customerKey)
      customer.totalOrders += 1
      customer.totalSpent += order.total
      customer.orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length
      })

      // Update dates
      if (order.createdAt < customer.firstOrderDate) {
        customer.firstOrderDate = order.createdAt
      }
      if (order.createdAt > customer.lastOrderDate) {
        customer.lastOrderDate = order.createdAt
      }

      // Update name/phone if more recent order has different info
      if (order.createdAt === customer.lastOrderDate) {
        customer.name = order.customerName
        customer.phone = order.customerPhone
      }
    })

    // Convert to array and calculate additional metrics
    let customers = Array.from(customerMap.values()).map(customer => {
      customer.averageOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0
      
      // Determine customer status based on last order date
      const daysSinceLastOrder = Math.floor((new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceLastOrder > 365) {
        customer.status = 'inactive'
      } else if (daysSinceLastOrder > 90) {
        customer.status = 'at_risk'
      } else {
        customer.status = 'active'
      }

      return customer
    })

    // Sort by last order date (most recent first)
    customers.sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime())

    // Take first 10 for initial load
    const paginatedCustomers = customers.slice(0, 10)

    // Calculate statistics
    const stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      atRiskCustomers: customers.filter(c => c.status === 'at_risk').length,
      inactiveCustomers: customers.filter(c => c.status === 'inactive').length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      averageCustomerValue: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0,
      repeatCustomers: customers.filter(c => c.totalOrders > 1).length,
      newCustomersThisMonth: customers.filter(c => {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return c.firstOrderDate > monthAgo
      }).length
    }

    const initialData = {
      customers: paginatedCustomers,
      pagination: {
        page: 1,
        limit: 10,
        total: customers.length,
        pages: Math.ceil(customers.length / 10)
      },
      stats
    }

    return <CustomersTable initialData={initialData} />
    
  } catch (error) {
    console.error('Error fetching customers:', error)
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            Error loading customers. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }
}

// Loading component
function CustomersLoading() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function CustomersPage() {
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
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Customers Management
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Manage customer relationships, track purchasing behavior, and analyze customer lifetime value.
                  </p>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <Suspense fallback={<CustomersLoading />}>
              <CustomersData />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}