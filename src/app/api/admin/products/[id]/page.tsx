import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Globe,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react'

interface ViewProductPageProps {
  params: {
    id: string
  }
}

export default async function ViewProductPage({ params }: ViewProductPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      category: {
        include: {
          parent: true
        }
      },
      country: true
    }
  })

  if (!product) {
    notFound()
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
                      SKU: {product.sku}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Button className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Product
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Product Info */}
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
                        <label className="text-sm font-medium text-gray-500">Product Name</label>
                        <p className="text-lg font-semibold">{product.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">SKU</label>
                        <p className="text-lg font-mono">{product.sku}</p>
                      </div>
                    </div>

                    {product.shortDescription && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Short Description</label>
                        <p className="text-gray-900">{product.shortDescription}</p>
                      </div>
                    )}

                    {product.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-gray-900">
                          {product.category.parent && `${product.category.parent.name} > `}
                          {product.category.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Source Country</label>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span>{product.country.name} ({product.country.currency})</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Cost Breakdown & Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <label className="text-sm font-medium text-gray-500">Original Price</label>
                        <p className="text-lg font-semibold">
                          {product.country.currencySymbol}{product.originalPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <label className="text-sm font-medium text-gray-500">Total Cost (USD)</label>
                        <p className="text-lg font-semibold text-red-600">
                          ${product.costPriceUSD.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">Per piece: ${product.piecePriceUSD.toFixed(2)}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-md">
                        <label className="text-sm font-medium text-gray-500">Selling Price (USD)</label>
                        <p className="text-lg font-semibold text-green-600">
                          ${product.sellingPriceUSD.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Profit: ${(product.sellingPriceUSD - product.costPriceUSD).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">GST</label>
                        <p>{product.gstPercentage}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Shipping</label>
                        <p>{product.country.currencySymbol}{product.shippingCost}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Conversion</label>
                        <p>{product.country.currencySymbol}{product.conversionCharges}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Additional</label>
                        <p>{product.country.currencySymbol}{product.additionalExpenses}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Profit Margin</label>
                        <p className="text-lg">{product.profitMargin}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Discount</label>
                        <p className="text-lg">{product.discountPercentage}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {product.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status & Quick Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status & Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
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
                    </div>

                    {product.isFeatured && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Featured</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="mr-1 h-3 w-3" />
                          Featured
                        </span>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Created</span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(product.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium">Updated</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(product.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Current Stock</label>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{product.stockQuantity}</p>
                        <span className="text-sm text-gray-600">units</span>
                        {product.stockQuantity <= product.lowStockAlert && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      {product.stockQuantity <= product.lowStockAlert && (
                        <p className="text-sm text-orange-600 mt-1">
                          Low stock alert at {product.lowStockAlert} units
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Low Stock Alert</label>
                      <p className="text-lg">{product.lowStockAlert} units</p>
                    </div>

                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-500">Stock Value</label>
                      <p className="text-lg font-semibold">
                        ${(product.stockQuantity * product.sellingPriceUSD).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cost value: ${(product.stockQuantity * product.piecePriceUSD).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {product.images.length > 0 ? (
                      <div className="grid gap-2">
                        {product.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${product.name} - Image ${index + 1}`}
                            className="w-full rounded-lg object-cover aspect-square"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.jpg'
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">No images uploaded</p>
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