'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import ProductImage from '@/components/admin/ProductImage'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  stockQuantity: number
  images: string[]
  category: { name: string }
  country: { name: string }
}

interface ExhibitionProduct {
  id: string
  productId: string
  quantityTaken: number
  quantitySold: number
  product: Product
}

interface Exhibition {
  id: string
  title: string
  startDate: Date
  endDate: Date
}

interface ExhibitionProductsManagerProps {
  exhibition: Exhibition
  exhibitionProducts: ExhibitionProduct[]
  availableProducts: Product[]
}

export default function ExhibitionProductsManager({ 
  exhibition, 
  exhibitionProducts, 
  availableProducts 
}: ExhibitionProductsManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Edit states
  const [editQuantityTaken, setEditQuantityTaken] = useState(0)
  const [editQuantitySold, setEditQuantitySold] = useState(0)

  // Add product states
  const [selectedProductId, setSelectedProductId] = useState('')
  const [addQuantityTaken, setAddQuantityTaken] = useState(1)

  // Get unique categories for filter
  const categories = [...new Set(availableProducts.map(p => p.category.name))].sort()

  // Filter available products (exclude already added ones)
  const filteredAvailableProducts = availableProducts.filter(product => {
    const isAlreadyAdded = exhibitionProducts.some(ep => ep.productId === product.id)
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || product.category.name === categoryFilter

    return !isAlreadyAdded && matchesSearch && matchesCategory
  })

  const handleEdit = (exhibitionProduct: ExhibitionProduct) => {
    setEditingId(exhibitionProduct.id)
    setEditQuantityTaken(exhibitionProduct.quantityTaken)
    setEditQuantitySold(exhibitionProduct.quantitySold)
  }

  const handleSaveEdit = async (exhibitionProductId: string) => {
    if (editQuantitySold > editQuantityTaken) {
      alert('Quantity sold cannot exceed quantity taken')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products/${exhibitionProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityTaken: editQuantityTaken,
          quantitySold: editQuantitySold
        })
      })

      if (response.ok) {
        setEditingId(null)
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update product')
      }
    } catch (error) {
      alert('Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveProduct = async (exhibitionProductId: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from this exhibition?`)) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products/${exhibitionProductId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to remove product')
      }
    } catch (error) {
      alert('Failed to remove product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (!selectedProductId || addQuantityTaken <= 0) {
      alert('Please select a product and enter a valid quantity')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          quantityTaken: addQuantityTaken
        })
      })

      if (response.ok) {
        setShowAddModal(false)
        setSelectedProductId('')
        setAddQuantityTaken(1)
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to add product')
      }
    } catch (error) {
      alert('Failed to add product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (taken: number, sold: number) => {
    if (taken === 0) return 'text-gray-500'
    const rate = (sold / taken) * 100
    if (rate >= 80) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (taken: number, sold: number) => {
    if (taken === 0) return AlertTriangle
    const rate = (sold / taken) * 100
    if (rate >= 80) return CheckCircle
    if (rate >= 50) return TrendingUp
    return AlertTriangle
  }

  return (
    <div className="space-y-6">
      {/* Current Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products at Exhibition ({exhibitionProducts.length})
            </CardTitle>
            <Button onClick={() => setShowAddModal(true)} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Products
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exhibitionProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products added yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add products to track what you're taking to this exhibition.
              </p>
              <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Taken
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exhibitionProducts.map((exhibitionProduct) => {
                    const isEditing = editingId === exhibitionProduct.id
                    const sellRate = exhibitionProduct.quantityTaken > 0 
                      ? (exhibitionProduct.quantitySold / exhibitionProduct.quantityTaken) * 100 
                      : 0
                    const revenue = exhibitionProduct.quantitySold * exhibitionProduct.product.sellingPriceUSD
                    const PerformanceIcon = getPerformanceIcon(exhibitionProduct.quantityTaken, exhibitionProduct.quantitySold)

                    return (
                      <tr key={exhibitionProduct.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <ProductImage 
                                images={exhibitionProduct.product.images}
                                name={exhibitionProduct.product.name}
                                className="h-12 w-12"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {exhibitionProduct.product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {exhibitionProduct.product.sku} • {formatPrice(exhibitionProduct.product.sellingPriceUSD)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              value={editQuantityTaken}
                              onChange={(e) => setEditQuantityTaken(parseInt(e.target.value) || 0)}
                              className="w-20 mx-auto text-center"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {exhibitionProduct.quantityTaken}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              max={editQuantityTaken}
                              value={editQuantitySold}
                              onChange={(e) => setEditQuantitySold(parseInt(e.target.value) || 0)}
                              className="w-20 mx-auto text-center"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {exhibitionProduct.quantitySold}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`flex items-center justify-center gap-1 ${getPerformanceColor(exhibitionProduct.quantityTaken, exhibitionProduct.quantitySold)}`}>
                            <PerformanceIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {sellRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(revenue)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(exhibitionProduct.id)}
                                  disabled={loading}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(exhibitionProduct)}
                                  title="Edit Quantities"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRemoveProduct(exhibitionProduct.id, exhibitionProduct.product.name)}
                                  title="Remove from Exhibition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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

      {/* Add Products Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Products to Exhibition</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="mb-4 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            <div className="mb-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredAvailableProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">No available products found</p>
                  <p className="text-xs">All products may already be added to this exhibition</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAvailableProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedProductId === product.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            checked={selectedProductId === product.id}
                            onChange={() => setSelectedProductId(product.id)}
                            className="mr-3"
                          />
                          <ProductImage 
                            images={product.images}
                            name={product.name}
                            className="h-12 w-12 mr-4"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku} • {product.category.name} • Stock: {product.stockQuantity}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatPrice(product.sellingPriceUSD)}</div>
                          <div className="text-sm text-gray-500">{product.country.name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity Input */}
            {selectedProductId && (
              <div className="mb-4">
                <Label htmlFor="quantity">Quantity to Take</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={addQuantityTaken}
                  onChange={(e) => setAddQuantityTaken(parseInt(e.target.value) || 1)}
                  className="w-32"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={!selectedProductId || addQuantityTaken <= 0 || loading}
              >
                {loading ? 'Adding...' : 'Add Product'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}