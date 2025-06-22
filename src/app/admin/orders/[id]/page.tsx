const getStatusBaimport { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import OrderStatusManager from '@/components/admin/OrderStatusManager'
import { Card, CardContent, CardHeader, CardTitle, Button, Label } from '@/components/ui'
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Calendar,
  Printer,
  Download
} from 'lucide-react'
import Link from 'next/link'

// Simple date formatting function
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800'
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Fetch order with all related data
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      orderItems: {
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
    }
  })

  if (!order) {
    notFound()
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const colorClass = ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-100 text-gray-800'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const colorClass = PAYMENT_STATUS_COLORS[status as keyof typeof PAYMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {status}
      </span>
    )
  }

  const shippingAddress = order.shippingAddress as any

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Order {order.orderNumber}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                    <span className="text-sm text-gray-500 capitalize">
                      {order.source.toLowerCase()} order
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Order
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Order Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product.images[0] && (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-600">
                                Qty: {item.quantity}
                              </span>
                              <span className="text-sm text-gray-600">
                                Unit Price: {formatCurrency(item.unitPrice, order.currency)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(item.totalPrice, order.currency)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Order Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatCurrency(order.subtotal, order.currency)}</span>
                      </div>
                      {order.tax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span>{formatCurrency(order.tax, order.currency)}</span>
                        </div>
                      )}
                      {order.shipping > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span>{formatCurrency(order.shipping, order.currency)}</span>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(order.discount, order.currency)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200"></div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(order.total, order.currency)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                        <p className="mt-1 text-sm text-gray-900">{order.customerName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{order.customerEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{order.customerPhone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
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
                      <p className="text-sm text-gray-500">No shipping address provided</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Management */}
              <div className="space-y-6">
                {/* Order Status Management */}
                <OrderStatusManager order={order} />

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Order Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(new Date(order.createdAt))}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Order Source</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {order.source.toLowerCase()}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Payment Status</label>
                      <div className="mt-1">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tracking Number</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">
                          {order.trackingNumber}
                        </p>
                      </div>
                    )}

                    {order.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Notes</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDateTime(new Date(order.updatedAt))}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Amount</label>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatCurrency(order.total, order.currency)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Currency</label>
                      <p className="mt-1 text-sm text-gray-900">{order.currency}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Payment Status</label>
                      <div className="mt-1">
                        {getPaymentStatusBadge(order.paymentStatus)}
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