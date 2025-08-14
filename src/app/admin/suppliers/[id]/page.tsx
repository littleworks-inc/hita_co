import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDate, formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  Globe,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface SupplierDetailPageProps {
  params: {
    id: string
  }
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Get supplier data with products
  const supplier = await db.supplier.findUnique({
    where: { id: params.id },
    include: {
      products: {
        include: {
          category: true,
          country: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }
    }
  })

  if (!supplier) {
    notFound()
  }

  // Calculate supplier statistics
  const activeProducts = supplier.products.filter(p => p.isActive).length
  const totalValue = supplier.products.reduce((sum, p) => sum + (p.sellingPriceUSD * p.stockQuantity), 0)
  const avgProductPrice = supplier.products.length > 0 
    ? supplier.products.reduce((sum, p) => sum + p.sellingPriceUSD, 0) / supplier.products.length 
    : 0

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
                  <Link href="/admin/suppliers">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Suppliers
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">
                      {supplier.name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Supplier Details and Product Overview
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/suppliers/${supplier.id}/edit`}>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Supplier
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Supplier Status Badge */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  supplier.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {supplier.isActive ? (
                    <>
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                      Active Supplier
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Inactive Supplier
                    </>
                  )}
                </span>
                
                {supplier.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{supplier.rating}/5</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Supplier Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Supplier Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Business Name</label>
                        <p className="mt-1 text-sm text-gray-900">{supplier.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Contact Person</label>
                        <p className="mt-1 text-sm text-gray-900">{supplier.contactPerson || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Business Type</label>
                        <p className="mt-1 text-sm text-gray-900">{supplier.businessType || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Added On</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(supplier.createdAt)}</p>
                      </div>
                    </div>

                    {supplier.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Notes</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{supplier.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {supplier.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="text-sm text-gray-900">{supplier.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {supplier.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-sm text-gray-900">{supplier.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {supplier.whatsapp && (
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-green-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                            <p className="text-sm text-gray-900">{supplier.whatsapp}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {(supplier.address || supplier.city || supplier.state || supplier.country) && (
                      <div className="flex items-start gap-3 pt-4 border-t">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <div className="mt-1 text-sm text-gray-900">
                            {supplier.address && <p>{supplier.address}</p>}
                            <p>
                              {[supplier.city, supplier.state, supplier.pincode, supplier.country]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Business Details */}
                {(supplier.gstNumber || supplier.panNumber || supplier.bankName) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Business & Banking Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {supplier.gstNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">GST Number</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{supplier.gstNumber}</p>
                          </div>
                        )}
                        
                        {supplier.panNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">PAN Number</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{supplier.panNumber}</p>
                          </div>
                        )}
                        
                        {supplier.bankName && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Bank Name</label>
                            <p className="mt-1 text-sm text-gray-900">{supplier.bankName}</p>
                          </div>
                        )}
                        
                        {supplier.accountNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Account Number</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">****{supplier.accountNumber.slice(-4)}</p>
                          </div>
                        )}
                        
                        {supplier.ifscCode && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">IFSC Code</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{supplier.ifscCode}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Products ({supplier.products.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {supplier.products.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          No products have been assigned to this supplier.
                        </p>
                        <div className="mt-6">
                          <Link href="/admin/products/new">
                            <Button>Add Product</Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {supplier.products.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      SKU: {product.sku}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {product.category.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatPrice(product.sellingPriceUSD, 'USD')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className={`${
                                    product.stockQuantity <= product.lowStockAlert 
                                      ? 'text-red-600' 
                                      : 'text-gray-900'
                                  }`}>
                                    {product.stockQuantity} units
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    product.isActive 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link href={`/admin/products/${product.id}`}>
                                    <Button variant="ghost" size="sm">
                                      View
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Statistics & Summary */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{supplier.products.length}</div>
                      <div className="text-sm text-blue-800">Total Products</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
                      <div className="text-sm text-green-800">Active Products</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPrice(totalValue, 'USD')}
                      </div>
                      <div className="text-sm text-purple-800">Inventory Value</div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPrice(avgProductPrice, 'USD')}
                      </div>
                      <div className="text-sm text-orange-800">Avg Product Price</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Supplier Created</p>
                        <p className="text-gray-500">{formatDate(supplier.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p className="text-gray-500">{formatDate(supplier.updatedAt)}</p>
                      </div>
                    </div>
                    
                    {supplier.products.length > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Latest Product</p>
                          <p className="text-gray-500">
                            {formatDate(supplier.products[0].updatedAt)}
                          </p>
                        </div>
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