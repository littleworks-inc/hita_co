// =====================================
// src/components/admin/ProductsTable.tsx - SIMPLIFIED VERSION
// Fixed Actions column without QuickActionButton to avoid type issues
// =====================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import ProductImage from '@/components/admin/ProductImage'
import ProductStatusBadge, { getProductStatus } from '@/components/admin/ProductStatusBadge'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Archive,
  Layers
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  images: string[]
  description?: string
  category: { name: string }
  country: { name: string }
  sellingPriceUSD: number
  costPriceUSD: number
  stockQuantity: number
  lowStockAlert: number
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isActive: boolean
  isFeatured: boolean
  publishedAt?: Date | null
  archivedAt?: Date | null
  updatedAt: Date
}

interface ProductsTableProps {
  products: Product[]
  searchQuery?: string
  categoryFilter?: string
  statusFilter?: string
}

export default function ProductsTable({
  products,
  searchQuery,
  categoryFilter,
  statusFilter
}: ProductsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(productId)

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete product. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusFilterLabel = () => {
    if (!statusFilter) return 'All Products'

    const filterLabels = {
      'draft': 'Draft Products',
      'published': 'Published Products',
      'archived': 'Archived Products',
      'featured': 'Featured Products',
      'active': 'Active Products',
      'inactive': 'Inactive Products'
    }

    return filterLabels[statusFilter as keyof typeof filterLabels] || 'Filtered Products'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {getStatusFilterLabel()} ({products.length})
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Draft Status Legend */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Draft</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>Published</span>
              </div>
              <div className="flex items-center gap-1">
                <Archive className="h-3 w-3" />
                <span>Archived</span>
              </div>
            </div>

            <Link href="/admin/products/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || categoryFilter || statusFilter
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first product."
              }
            </p>
            <div className="mt-6">
              <Link href="/admin/products/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
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
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const productStatus = getProductStatus(product.isActive, product.status)

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {/* Product Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <ProductImage
                              images={product.images || []}
                              name={product.name}
                              className="h-10 w-10"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category.name}</div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(product.sellingPriceUSD)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Cost: {formatPrice(product.costPriceUSD)}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stockQuantity <= 0
                            ? 'bg-red-100 text-red-800'
                            : product.stockQuantity <= product.lowStockAlert
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stockQuantity <= 0 ? (
                            <XCircle className="mr-1 h-3 w-3" />
                          ) : product.stockQuantity <= product.lowStockAlert ? (
                            <AlertTriangle className="mr-1 h-3 w-3" />
                          ) : (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          {product.stockQuantity} units
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ProductStatusBadge 
                            status={productStatus}
                            size="sm"
                          />
                          {product.isFeatured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Updated */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(product.updatedAt)}
                      </td>

                      {/* ✅ FIXED: Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Button */}
                          <Link href={`/admin/products/${product.id}`}>
                            <Button variant="ghost" size="sm" title="View Product">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {/* ✅ EDIT BUTTON - THE MAIN MISSING PIECE! */}
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit Product" className="text-blue-600 hover:text-blue-700">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {/* Delete Button */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            title="Delete Product"
                          >
                            {deletingId === product.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}