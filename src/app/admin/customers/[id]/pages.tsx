import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Label } from '@/components/ui'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Eye,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface CustomerDetailPageProps {
  params: {
    id: string
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const CUSTOMER_STATUS_COLORS = {
  active: { bg: 'bg-green-100 text-green-800', icon: UserCheck },
  at_risk: { bg: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  inactive: { bg: 'bg-red-100 text-red-800', icon: UserX }
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // The customer ID is actually the email (lowercased)
  const customerEmail = decodeURIComponent(params.id)

  // Fetch all orders for this customer
  const orders = await db.order.findMany({
    where: {
      customerEmail: {
        equals: customerEmail,
        mode: 'insensitive'
      }
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              sku: true,
              sellingPriceUSD: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (orders.length === 0) {
    notFound()
  }

  // Aggregate customer data from orders
  const customer = {
    name: orders[0].customerName,
    email: orders[0].customerEmail,
    phone: orders[0].customerPhone,
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
    averageOrderValue: orders.reduce((sum, order) => sum + order.total, 0) / orders.length,
    firstOrderDate: orders[orders.length - 1].createdAt,
    lastOrderDate: orders[0].createdAt,
    orders: orders
  }

  // Determine customer status
  const daysSinceLastOrder = Math.floor((new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
  let customerStatus: 'active' | 'at_risk' | 'inactive' = 'active'
  if (daysSinceLastOrder > 365) {
    customerStatus = 'inactive'
  } else if (daysSinceLastOrder > 90) {
    customerStatus = 'at_risk'
  }

  // Get most recent shipping address
  const latestOrder = orders[0]
  const shippingAddress = latestOrder.shippingAddress as any

  const getStatusBadge = (status: string) => {
    const colorClass = ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-100 text-gray-800'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getCustomerStatusBadge = (status: 'active' | 'at_risk' | 'inactive') => {
    const config = CUSTOMER_STATUS_COLORS[status]
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Link href="/admin/customers">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Customers
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {customer.name}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    {getCustomerStatusBadge(customerStatus)}
                    <span className="text-sm text-gray-500">
                      Customer since {formatDate(customer.firstOrderDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Customer Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-1">
                          {getCustomerStatusBadge(customerStatus)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900">{customer.email}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <div className="mt-1 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900">{customer.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Most Recent Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {shippingAddress ? (
                      <div className="text-sm text-gray-900">
                        <p>{shippingAddress.street}</p>
                        {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
                        <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                        <p>{shippingAddress.country}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No shipping address available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Order History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                              {getStatusBadge(order.status)}
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(order.total)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                  {item.product.images[0] && (
                                    <img 
                                      src={item.product.images[0]} 
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                              <span className="text-sm text-gray-600">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Customer Analytics */}
              <div className="space-y-6">
                {/* Customer Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Customer Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Orders</label>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{customer.totalOrders}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Spent</label>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Average Order Value</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(customer.averageOrderValue)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Customer Since</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(customer.firstOrderDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Order</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(customer.lastOrderDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {daysSinceLastOrder} days ago
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Customer Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Customer Type</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {customer.totalOrders === 1 ? 'New Customer' : 
                         customer.totalOrders < 5 ? 'Regular Customer' : 'VIP Customer'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Purchase Frequency</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {customer.totalOrders > 1 ? 
                          `${Math.round((customer.totalOrders - 1) / Math.max(1, Math.floor((customer.lastOrderDate.getTime() - customer.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30))))} orders per month` :
                          'First-time customer'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Preferred Products</label>
                      <div className="mt-1">
                        {customer.orders.slice(0, 3).map((order, index) => (
                          <div key={index} className="text-xs text-gray-600 mb-1">
                            • {order.items[0]?.product?.name || 'Unknown product'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}