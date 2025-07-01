// =====================================
// src/components/admin/ProductsTable.tsx - COMPLETE WITH STOCK FIX
// Fixed to show correct stock for sized products
// =====================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import ProductImage from '@/components/admin/ProductImage'
import ProductStatusBadge, { getProductStatus } from '@/components/admin/ProductStatusBadge'
import QuickActionButton from '@/components/admin/QuickActionButton'
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

// ✅ UPDATED INTERFACE: Added size-related fields
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
  // Enhanced with draft system fields
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isActive: boolean
  isFeatured: boolean
  publishedAt?: Date | null
  archivedAt?: Date | null
  updatedAt: Date
  // ✅ NEW: Size system fields
  totalStock?: number
  requiresSizes?: boolean
  productSizes?: {
    id: string
    size: string
    sku: string
    stockQuantity: number
    lowStockAlert: number
    isActive: boolean
    sortOrder: number
  }[]
  availableSizes?: number | null
  lowStockSizes?: number | null
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
  const [actioningId, setActioningId] = useState<string | null>(null)

  // ✅ NEW: Enhanced stock calculation for sized products
  const getProductStock = (product: Product) => {
    if (product.requiresSizes && product.productSizes?.length) {
      // For sized products, sum up all size quantities
      const totalStock = product.productSizes.reduce((total, size) => total + size.stockQuantity, 0)
      return {
        displayStock: totalStock,
        isOutOfStock: totalStock <= 0,
        isLowStock: totalStock > 0 && product.productSizes.some(size =>
          size.stockQuantity <= size.lowStockAlert && size.stockQuantity > 0
        ),
        hasSizes: true,
        activeSizes: product.productSizes.filter(size => size.isActive).length,
        totalSizes: product.productSizes.length
      }
    } else {
      // For non-sized products, use regular stockQuantity
      return {
        displayStock: product.stockQuantity,
        isOutOfStock: product.stockQuantity <= 0,
        isLowStock: product.stockQuantity > 0 && product.stockQuantity <= product.lowStockAlert,
        hasSizes: false,
        activeSizes: null,
        totalSizes: null
      }
    }
  }

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
        // Refresh the page to update the product list
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

  const handleStatusChange = (productId: string, newStatus: string) => {
    // This callback will be called when status changes via QuickActionButton
    // We can add optimistic updates here if needed
    setActioningId(null)
    router.refresh()
  }

  // Get status filter description
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
                  const productStatus = getProductStatus(product)
                  const stockInfo = getProductStock(product) // ✅ NEW: Enhanced stock calculation

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
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                                {product.name}
                              </div>
                              {/* ✅ NEW: Size indicator */}
                              {stockInfo.hasSizes && (
                                <div className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                  <Layers className="h-3 w-3 mr-1" />
                                  {stockInfo.totalSizes} sizes
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category.name}</div>
                        <div className="text-sm text-gray-500">{product.country.name}</div>
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

                      {/* ✅ ENHANCED STOCK DISPLAY */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${stockInfo.isOutOfStock ? 'bg-red-100 text-red-800' :
                              stockInfo.isLowStock ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                            {stockInfo.displayStock} units
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stockInfo.isOutOfStock ? (
                            <span className="text-red-600">Out of stock</span>
                          ) : stockInfo.isLowStock ? (
                            <span className="text-orange-600">
                              {stockInfo.hasSizes ? 'Low stock' : 'Need restocking'}
                            </span>
                          ) : (
                            <span className="text-green-600">In stock</span>
                          )}
                          {stockInfo.hasSizes && stockInfo.activeSizes && (
                            <span className="ml-1">
                              • {stockInfo.activeSizes} active sizes
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProductStatusBadge status={productStatus} />
                        {product.isFeatured && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(product.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Actions */}
                          <QuickActionButton
                            product={product}
                            onStatusChange={handleStatusChange}
                            disabled={actioningId === product.id}
                          />

                          {/* Edit Button */}
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>

                          {/* View Button */}
                          <Link href={`/admin/products/${product.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="text-red-600 hover:text-red-900"
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