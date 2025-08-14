import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ExhibitionAnalytics from '@/components/admin/ExhibitionAnalytics'
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus
} from 'lucide-react'

interface ViewExhibitionPageProps {
  params: {
    id: string
  }
}

export default async function ViewExhibitionPage({ params }: ViewExhibitionPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  const exhibition = await db.exhibition.findUnique({
    where: { id: params.id },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPriceUSD: true,
              images: true
            }
          }
        }
      },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          customerName: true,
          createdAt: true
        }
      }
    }
  })

  if (!exhibition) {
    notFound()
  }

  // Calculate stats
  const now = new Date()
  const startDate = new Date(exhibition.startDate)
  const endDate = new Date(exhibition.endDate)

  let status: 'upcoming' | 'ongoing' | 'completed' = 'completed'
  if (startDate > now) status = 'upcoming'
  else if (endDate >= now) status = 'ongoing'

  const revenue = exhibition.orders
    .filter(order => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum + order.total, 0)

  const totalProductsTaken = exhibition.products.reduce((sum, p) => sum + p.quantityTaken, 0)
  const totalProductsSold = exhibition.products.reduce((sum, p) => sum + p.quantitySold, 0)
  const sellThroughRate = totalProductsTaken > 0 ? (totalProductsSold / totalProductsTaken) * 100 : 0
  const netProfit = revenue - exhibition.participationFee

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    }

    const icons = {
      upcoming: Clock,
      ongoing: CheckCircle,
      completed: CheckCircle
    }

    const Icon = icons[status as keyof typeof icons]

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon className="mr-1 h-4 w-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Link href="/admin/exhibitions">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Exhibitions
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">
                      {exhibition.title}
                    </h1>
                    <div className="mt-2 flex items-center gap-4">
                      {getStatusBadge(status)}
                      {!exhibition.isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/exhibitions/${exhibition.id}/edit`}>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Exhibition
                    </Button>
                  </Link>
                  <Link href={`/admin/exhibitions/${exhibition.id}/products`}>
                    <Button variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Manage Products
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Exhibition Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Exhibition Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <p className="mt-1 text-sm text-gray-900">{exhibition.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{exhibition.location}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(exhibition.startDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(exhibition.endDate)}</p>
                      </div>
                    </div>

                    {exhibition.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{exhibition.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{totalProductsTaken}</div>
                        <div className="text-sm text-blue-600">Products Taken</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">{totalProductsSold}</div>
                        <div className="text-sm text-green-600">Products Sold</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-600">{sellThroughRate.toFixed(1)}%</div>
                        <div className="text-sm text-purple-600">Sell-Through Rate</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">{formatPrice(revenue)}</div>
                        <div className="text-sm text-orange-600">Total Revenue</div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Participation Fee</span>
                        <span className="text-lg font-bold text-gray-900">{formatPrice(exhibition.participationFee)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium text-gray-700">Net Profit</span>
                        <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(netProfit)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Products at Exhibition */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Products at Exhibition ({exhibition.products.length})
                      </CardTitle>
                      <Link href={`/admin/exhibitions/${exhibition.id}/products`}>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Products
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {exhibition.products.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm">No products added to this exhibition yet</p>
                        <Link href={`/admin/exhibitions/${exhibition.id}/products`}>
                          <Button className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Products
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {exhibition.products.map((exhibitionProduct) => (
                          <div key={exhibitionProduct.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                {exhibitionProduct.product.images.length > 0 ? (
                                  <img 
                                    src={exhibitionProduct.product.images[0]} 
                                    alt={exhibitionProduct.product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{exhibitionProduct.product.name}</div>
                                <div className="text-sm text-gray-500">SKU: {exhibitionProduct.product.sku}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {exhibitionProduct.quantitySold} / {exhibitionProduct.quantityTaken} sold
                              </div>
                              <div className="text-sm text-gray-500">
                                {((exhibitionProduct.quantitySold / exhibitionProduct.quantityTaken) * 100).toFixed(1)}% rate
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Images and Orders */}
              <div className="space-y-6">
                {/* Exhibition Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exhibition Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {exhibition.images.length > 0 ? (
                      <div className="space-y-3">
                        {exhibition.images.map((image, index) => (
                          <div key={index} className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={image}
                              alt={`${exhibition.title} image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm">No images uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Orders ({exhibition.orders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {exhibition.orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm">No orders from this exhibition yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {exhibition.orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{order.customerName}</div>
                              <div className="text-sm text-gray-500">#{order.orderNumber}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{formatPrice(order.total)}</div>
                              <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>
                        ))}
                        {exhibition.orders.length > 5 && (
                          <div className="text-center">
                            <Button variant="outline" size="sm">
                              View All Orders
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Key Metrics Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exhibition Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Products:</span>
                      <span className="font-medium">{exhibition.products.length} items</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Orders:</span>
                      <span className="font-medium">{exhibition.orders.length} orders</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Order:</span>
                      <span className="font-medium">
                        {exhibition.orders.length > 0 ? formatPrice(revenue / exhibition.orders.length) : '$0.00'}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">ROI:</span>
                        <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {exhibition.participationFee > 0 ? ((netProfit / exhibition.participationFee) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Exhibition Analytics */}
            {exhibition.products.length > 0 && (
              <div className="mt-8">
                <ExhibitionAnalytics 
                  exhibitionProducts={exhibition.products}
                  participationFee={exhibition.participationFee}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}