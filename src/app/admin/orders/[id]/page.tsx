import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import Link from 'next/link'
import { formatPrice, formatDate } from '@/lib/utils'
import {
  Package,
  User,
  CreditCard,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

async function getOrder(id: string) {
  try {
    const order = await db.order.findUnique({
      where: { id },
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
      }
    })

    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

function getStatusBadge(status: string) {
  const statusConfig = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    CONFIRMED: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
    PROCESSING: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
    SHIPPED: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Truck },
    DELIVERED: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    CANCELLED: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    REFUNDED: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </Badge>
  )
}

function getPaymentStatusBadge(status: string) {
  const statusConfig = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    PAID: { color: 'bg-green-100 text-green-800 border-green-200' },
    FAILED: { color: 'bg-red-100 text-red-800 border-red-200' },
    REFUNDED: { color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

  return (
    <Badge variant="outline" className={config.color}>
      {status}
    </Badge>
  )
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  const order = await getOrder(params.id)

  if (!order) {
    notFound()
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
                <div className="flex items-center gap-4">
                  <Link href="/admin/orders">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Orders
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">
                      Order #{order.orderNumber}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Created on {formatDateTime(new Date(order.createdAt))}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Order
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
                      Order Items ({order.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                              {item.product.images[0] && (
                                <img 
                                  src={item.product.images[0]} 
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                              <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                              {item.sizeLabel && (
  <p className="text-sm text-gray-500">Size: {item.sizeLabel}</p>
)}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatPrice(item.unitPrice)} × {item.quantity}
                            </p>
                            <p className="text-sm text-gray-500">
                              Total: {formatPrice(item.total)}
                            </p>
                          </div>
                        </div>
                      ))}
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
                  <CardContent className="space-y-4">
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
                        <p className="mt-1 text-sm text-gray-900">{order.customerPhone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Shipping Address</label>
                      <div className="mt-1 text-sm text-gray-900">
                        <p>{order.shippingAddress.street}</p>
                        {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary */}
              <div className="space-y-6">
                {/* Order Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Current Status</label>
                      <div className="mt-1">
                        {getStatusBadge(order.status)}
                      </div>
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

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping</span>
                      <span className="text-sm font-medium">{formatPrice(order.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax</span>
                      <span className="text-sm font-medium">{formatPrice(order.taxAmount)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">Discount</span>
                        <span className="text-sm font-medium">-{formatPrice(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Total</span>
                        <span className="font-bold text-lg">{formatPrice(order.total)}</span>
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