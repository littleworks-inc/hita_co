import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ProductImage from '@/components/admin/ProductImage'
import BarcodeDisplay from '@/components/admin/BarcodeDisplay'
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
  Star,
  Building2,
  Barcode,
  TrendingUp
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
      country: true,
      supplier: true
    }
  })

  if (!product) {
    notFound()
  }

  const profitAmount = product.sellingPriceUSD - product.costPriceUSD
  const profitPercentage = ((profitAmount / product.costPriceUSD) * 100).toFixed(1)

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
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Product
                    </Button>
                  </Link>
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
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{product.country.name}</span>
                        </div>
                      </div>
                    </div>

                    {product.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-sm text-gray-900">{product.description}</p>
                      </div>
                    )}

                    {product.shortDescription && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Short Description</label>
                        <p className="mt-1 text-sm text-gray-900">{product.shortDescription}</p>
                      </div>
                    )}

                    {product.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tags</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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

                {/* Pricing & Cost Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing & Profitability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Original Price</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">
                          {formatPrice(product.originalPrice)} {product.originalCurrency}
                        </p>
                        <p className="text-xs text-gray-500">Quantity: {product.quantity}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Cost Price (USD)</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">
                          {formatPrice(product.costPriceUSD)}
                        </p>
                        <p className="text-xs text-gray-500">Per piece: {formatPrice(product.piecePriceUSD)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Selling Price (USD)</label>
                        <p className="mt-1 text-lg font-medium text-green-600">
                          {formatPrice(product.sellingPriceUSD)}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">+{profitPercentage}% profit</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Net Profit per Unit</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(profitAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="font-medium">{product.profitMargin}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium">{product.discountPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST:</span>
                        <span className="font-medium">{product.gstPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping Cost:</span>
                        <span className="font-medium">{formatPrice(product.shippingCost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supplier Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Supplier & Purchase Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Supplier</label>
                        <p className="mt-1 text-sm text-gray-900">{product.supplier?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Purchase Date</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-900">
                            {formatDate(new Date(product.purchaseDate))}
                          </span>
                        </div>
                      </div>
                      {product.invoiceNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Invoice Number</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono">{product.invoiceNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Barcode Section */}
                {product.barcode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Barcode className="h-5 w-5" />
                        Barcode
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarcodeDisplay
                        barcode={product.barcode}
                        barcodeType={product.barcodeType}
                        productName={product.name}
                        price={formatPrice(product.sellingPriceUSD)}
                        size="medium"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Images and Stock */}
              <div className="space-y-6">
                {/* Product Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {product.images.length > 0 ? (
                      <div className="space-y-3">
                        {product.images.map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <ProductImage
                              images={[image]}
                              name={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm">No images uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stock Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Current Stock</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-gray-900">{product.stockQuantity}</span>
                        <span className="text-sm text-gray-500">units</span>
                        {product.stockQuantity <= product.lowStockAlert && (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                      </div>
                      {product.stockQuantity <= product.lowStockAlert && (
                        <p className="text-sm text-orange-600 mt-1">Low stock alert</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Low Stock Alert</label>
                      <p className="mt-1 text-sm text-gray-900">{product.lowStockAlert} units</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Status</span>
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
                          <span className="text-sm font-medium text-gray-700">Featured</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Star className="mr-1 h-3 w-3" />
                            Featured Product
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle>Record Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(product.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{formatDate(product.updatedAt)}</span>
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