import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import AdminNavigation from '@/components/admin/AdminNavigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import ProductImageDisplay from '@/components/admin/ProductImageDisplay'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  Calendar,
  Globe,
  Building,
  Users,
  Tag,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Force dynamic rendering - this page uses database calls
export const dynamic = 'force-dynamic'

interface ProductViewPageProps {
  params: {
    id: string
  }
}

export default async function ProductViewPage({ params }: ProductViewPageProps) {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  // Get product data with all relationships
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      country: true,
      supplier: true,
      exhibitionItems: {
        include: {
          exhibition: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true
            }
          }
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Calculate profit margin percentage
  const profitMarginPercent = product.costPriceUSD > 0
    ? ((product.sellingPriceUSD - product.costPriceUSD) / product.costPriceUSD * 100)
    : 0

  // Stock status
  const isLowStock = product.stockQuantity <= product.lowStockAlert
  const isOutOfStock = product.stockQuantity === 0

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
                  <Link href="/admin/products">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Products
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">
                      {product.name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      SKU: {product.sku} • Created {formatDate(product.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Product
                    </Button>
                  </Link>
                  <Button variant="destructive" size="default">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Product Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">SKU</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{product.sku}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <p className="mt-1 text-sm text-gray-900">{product.category.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Country</label>
                        <p className="mt-1 text-sm text-gray-900">{product.country.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Supplier</label>
                        <p className="mt-1 text-sm text-gray-900">{product.supplier.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Star className="mr-1 h-3 w-3" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {product.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{product.description}</p>
                      </div>
                    )}

                    {product.shortDescription && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Short Description</label>
                        <p className="mt-1 text-sm text-gray-900">{product.shortDescription}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tags</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {product.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              <Tag className="mr-1 h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing & Cost Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing & Cost Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Original Price</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatPrice(product.originalPrice, product.originalCurrency)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Cost Price (USD)</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatPrice(product.costPriceUSD, 'USD')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Selling Price (USD)</label>
                        <p className="mt-1 text-lg font-semibold text-green-600">
                          {formatPrice(product.sellingPriceUSD, 'USD')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Piece Price (USD)</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatPrice(product.piecePriceUSD, 'USD')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Profit Margin</label>
                        <p className="mt-1 text-sm font-semibold text-green-600">
                          {profitMarginPercent.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Discount</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {product.discountPercentage}%
                        </p>
                      </div>
                    </div>

                    {/* Additional Costs */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h4>
                      <div className="grid gap-3 md:grid-cols-4 text-xs">
                        <div>
                          <span className="text-gray-500">GST:</span>
                          <span className="ml-1 font-medium">{product.gstPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Shipping:</span>
                          <span className="ml-1 font-medium">{formatPrice(product.shippingCost, product.originalCurrency)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Conversion:</span>
                          <span className="ml-1 font-medium">{formatPrice(product.conversionCharges, product.originalCurrency)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Additional:</span>
                          <span className="ml-1 font-medium">{formatPrice(product.additionalExpenses, product.originalCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Exhibition History */}
                {product.exhibitionItems && product.exhibitionItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Exhibition History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {product.exhibitionItems.map((ep) => (
                          <div key={ep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{ep.exhibition.title}</h4>
                              <p className="text-sm text-gray-500">
                                {formatDate(ep.exhibition.startDate)} - {formatDate(ep.exhibition.endDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Sold: {ep.quantitySold} / {ep.quantityTaken}
                              </p>
                              <p className="text-xs text-gray-500">
                                {((ep.quantitySold / ep.quantityTaken) * 100).toFixed(1)}% sold
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Images & Stats */}
              <div className="space-y-6">
                {/* Product Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {product.images && product.images.length > 0 ? (
                      <div className="space-y-3">
                        {product.images.map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <ProductImageDisplay
                              src={image}
                              alt={`${product.name} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Inventory Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Inventory Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Stock Level</span>
                        <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' :
                            isLowStock ? 'text-orange-600' : 'text-green-600'
                          }`}>
                          {product.stockQuantity} units
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isOutOfStock ? 'bg-red-500' :
                              isLowStock ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                          style={{
                            width: `${Math.min(100, (product.stockQuantity / (product.lowStockAlert * 3)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Low Stock Alert</span>
                        <span className="text-sm font-medium">{product.lowStockAlert}</span>
                      </div>
                      {/* Removed weight and dimensions fields - not in database schema */}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">SKU</span>
                        <span className="text-sm font-medium font-mono">{product.sku}</span>
                      </div>
                      {product.barcode && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Barcode</span>
                          <span className="text-sm font-medium font-mono">{product.barcode}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`text-sm font-medium ${product.status === 'PUBLISHED' ? 'text-green-600' :
                            product.status === 'DRAFT' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                          {product.status}
                        </span>
                      </div>
                    </div>

                    {/* Stock Status Alert */}
                    {isOutOfStock && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className="text-sm text-red-700 font-medium">Out of Stock</span>
                      </div>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <span className="text-sm text-orange-700 font-medium">Low Stock Alert</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm font-medium">{formatDate(product.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium">{formatDate(product.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Exhibitions</span>
                      <span className="text-sm font-medium">{product.exhibitionItems?.length || 0}</span>
                    </div>
                    {product.barcode && (
                      <div>
                        <span className="text-sm text-gray-600 block">Barcode</span>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{product.barcode}</span>
                      </div>
                    )}
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