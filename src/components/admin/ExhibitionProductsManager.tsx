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
  CheckCircle,
  DollarSign,
  Tag,
  Percent,
  History,
  Users,
  Zap
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
  // ✅ ADD: Exhibition pricing fields (these exist in your schema)
  exhibitionPrice?: number
  originalPrice?: number
  discountPercentage?: number
  isClearance?: boolean
  priceHistory?: any
  salesNotes?: string
  lastSaleDate?: Date
  priceChangedAt?: Date
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
  
  // ✅ PRESERVE: All existing states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // ✅ PRESERVE: Existing edit states for quantities
  const [editQuantityTaken, setEditQuantityTaken] = useState(0)
  const [editQuantitySold, setEditQuantitySold] = useState(0)

  // ✅ PRESERVE: Existing add product states
  const [selectedProductId, setSelectedProductId] = useState('')
  const [addQuantityTaken, setAddQuantityTaken] = useState(1)

  // ✅ NEW: Pricing management states
  const [activeTab, setActiveTab] = useState<'quantities' | 'pricing'>('quantities')
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingProductId, setPricingProductId] = useState<string | null>(null)
  const [pricingData, setPricingData] = useState({
    exhibitionPrice: 0,
    discountPercentage: 0,
    isClearance: false,
    salesNotes: ''
  })

  // ✅ NEW: Bulk operations states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showBulkPricingModal, setShowBulkPricingModal] = useState(false)
  const [bulkDiscount, setBulkDiscount] = useState(0)

  // ✅ PRESERVE: Get unique categories for filter
  const categories = [...new Set(availableProducts.map(p => p.category.name))].sort()

  // ✅ PRESERVE: Filter available products (exclude already added ones)
  const filteredAvailableProducts = availableProducts.filter(product => {
    const isAlreadyAdded = exhibitionProducts.some(ep => ep.productId === product.id)
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || product.category.name === categoryFilter

    return !isAlreadyAdded && matchesSearch && matchesCategory
  })

  // ✅ NEW: Pricing calculation helper
  const calculateFinalPrice = (exhibitionProduct: ExhibitionProduct) => {
    const originalPrice = exhibitionProduct.product.sellingPriceUSD
    const exhibitionPrice = exhibitionProduct.exhibitionPrice || originalPrice
    
    if (exhibitionProduct.isClearance && exhibitionProduct.discountPercentage) {
      return exhibitionPrice * (1 - exhibitionProduct.discountPercentage / 100)
    }
    
    return exhibitionPrice
  }

  // ✅ PRESERVE: All existing handlers
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

  // ✅ NEW: Pricing handlers
  const handleOpenPricingModal = (exhibitionProduct: ExhibitionProduct) => {
    setPricingProductId(exhibitionProduct.id)
    setPricingData({
      exhibitionPrice: exhibitionProduct.exhibitionPrice || exhibitionProduct.product.sellingPriceUSD,
      discountPercentage: exhibitionProduct.discountPercentage || 0,
      isClearance: exhibitionProduct.isClearance || false,
      salesNotes: exhibitionProduct.salesNotes || ''
    })
    setShowPricingModal(true)
  }

  const handleSavePricing = async () => {
    if (!pricingProductId) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products/${pricingProductId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pricingData,
          priceChangedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        setShowPricingModal(false)
        setPricingProductId(null)
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update pricing')
      }
    } catch (error) {
      alert('Failed to update pricing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkClearance = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products/bulk-clearance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          discountPercentage: bulkDiscount,
          isClearance: true
        })
      })

      if (response.ok) {
        setShowBulkPricingModal(false)
        setSelectedProducts([])
        setBulkDiscount(0)
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to apply bulk clearance')
      }
    } catch (error) {
      alert('Failed to apply bulk clearance. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ PRESERVE: Existing performance helpers
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
      {/* ✅ NEW: Enhanced Header with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Exhibition Products Management ({exhibitionProducts.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowAddModal(true)} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Products
              </Button>
              {exhibitionProducts.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowBulkPricingModal(true)}
                  disabled={loading}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Bulk Pricing
                </Button>
              )}
            </div>
          </div>
          
          {/* ✅ NEW: Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('quantities')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'quantities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Quantities & Performance
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pricing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Pricing & Clearance
            </button>
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
              {/* ✅ ENHANCED: Table with pricing information */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {activeTab === 'pricing' && (
                      <th className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === exhibitionProducts.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(exhibitionProducts.map(ep => ep.id))
                            } else {
                              setSelectedProducts([])
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    {activeTab === 'quantities' ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original Price
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exhibition Price
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Final Price
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </>
                    )}
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
                    const PerformanceIcon = getPerformanceIcon(exhibitionProduct.quantityTaken, exhibitionProduct.quantitySold)
                    const finalPrice = calculateFinalPrice(exhibitionProduct)

                    return (
                      <tr key={exhibitionProduct.id} className="hover:bg-gray-50">
                        {activeTab === 'pricing' && (
                          <td className="px-2 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(exhibitionProduct.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts([...selectedProducts, exhibitionProduct.id])
                                } else {
                                  setSelectedProducts(selectedProducts.filter(id => id !== exhibitionProduct.id))
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                        )}
                        
                        {/* Product Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              <ProductImage 
                                images={exhibitionProduct.product.images}
                                name={exhibitionProduct.product.name}
                                className="w-12 h-12 object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {exhibitionProduct.product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {exhibitionProduct.product.sku} • {exhibitionProduct.product.category.name}
                              </div>
                              {exhibitionProduct.isClearance && (
                                <div className="inline-flex items-center gap-1 mt-1">
                                  <Tag className="h-3 w-3 text-red-600" />
                                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                    CLEARANCE
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Tab Content */}
                        {activeTab === 'quantities' ? (
                          <>
                            {/* Quantity Taken */}
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editQuantityTaken}
                                  onChange={(e) => setEditQuantityTaken(parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  min="0"
                                />
                              ) : (
                                <span className="font-medium">{exhibitionProduct.quantityTaken}</span>
                              )}
                            </td>

                            {/* Quantity Sold */}
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editQuantitySold}
                                  onChange={(e) => setEditQuantitySold(parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  min="0"
                                  max={editQuantityTaken}
                                />
                              ) : (
                                <span className="font-medium">{exhibitionProduct.quantitySold}</span>
                              )}
                            </td>

                            {/* Performance */}
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <PerformanceIcon className={`h-4 w-4 ${getPerformanceColor(exhibitionProduct.quantityTaken, exhibitionProduct.quantitySold)}`} />
                                <span className={getPerformanceColor(exhibitionProduct.quantityTaken, exhibitionProduct.quantitySold)}>
                                  {sellRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>

                            {/* Revenue */}
                            <td className="px-6 py-4 text-center">
                              <div className="font-medium">
                                {formatPrice(exhibitionProduct.quantitySold * finalPrice)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatPrice(finalPrice)} each
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Original Price */}
                            <td className="px-6 py-4 text-center">
                              <div className="font-medium text-gray-600">
                                {formatPrice(exhibitionProduct.product.sellingPriceUSD)}
                              </div>
                            </td>

                            {/* Exhibition Price */}
                            <td className="px-6 py-4 text-center">
                              <div className="font-medium">
                                {formatPrice(exhibitionProduct.exhibitionPrice || exhibitionProduct.product.sellingPriceUSD)}
                              </div>
                              {exhibitionProduct.exhibitionPrice !== exhibitionProduct.product.sellingPriceUSD && (
                                <div className="text-xs text-blue-600">Custom Price</div>
                              )}
                            </td>

                            {/* Final Price */}
                            <td className="px-6 py-4 text-center">
                              <div className="font-bold text-lg">
                                {formatPrice(finalPrice)}
                              </div>
                              {exhibitionProduct.isClearance && exhibitionProduct.discountPercentage && (
                                <div className="text-xs text-red-600">
                                  -{exhibitionProduct.discountPercentage}% off
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center">
                              {exhibitionProduct.isClearance ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <Tag className="h-3 w-3 mr-1" />
                                  Clearance
                                </span>
                              ) : exhibitionProduct.exhibitionPrice ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Custom Price
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Regular Price
                                </span>
                              )}
                            </td>
                          </>
                        )}

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
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
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                {activeTab === 'quantities' ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(exhibitionProduct)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenPricingModal(exhibitionProduct)}
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveProduct(exhibitionProduct.id, exhibitionProduct.product.name)}
                                  disabled={loading}
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

      {/* ✅ PRESERVE: Add Product Modal (unchanged) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Products to Exhibition</h3>
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

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
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredAvailableProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm">No available products found</p>
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
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <ProductImage 
                              images={product.images}
                              name={product.name}
                              className="w-12 h-12 object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku} • {product.category.name}
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {formatPrice(product.sellingPriceUSD)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Stock: {product.stockQuantity}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedProductId && (
                <div className="mb-4">
                  <Label htmlFor="addQuantity">Quantity to Take</Label>
                  <Input
                    id="addQuantity"
                    type="number"
                    value={addQuantityTaken}
                    onChange={(e) => setAddQuantityTaken(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-32"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddProduct}
                  disabled={!selectedProductId || loading}
                >
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Exhibition Pricing & Clearance</h3>
                <Button variant="ghost" onClick={() => setShowPricingModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Exhibition Price */}
                <div>
                  <Label htmlFor="exhibitionPrice">Exhibition Price (USD)</Label>
                  <Input
                    id="exhibitionPrice"
                    type="number"
                    step="0.01"
                    value={pricingData.exhibitionPrice}
                    onChange={(e) => setPricingData({
                      ...pricingData,
                      exhibitionPrice: parseFloat(e.target.value) || 0
                    })}
                    placeholder="Custom price for this exhibition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use regular store price
                  </p>
                </div>

                {/* Clearance Toggle */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="isClearance"
                    checked={pricingData.isClearance}
                    onChange={(e) => setPricingData({
                      ...pricingData,
                      isClearance: e.target.checked
                    })}
                    className="rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <Label htmlFor="isClearance" className="font-medium">
                      Mark as Clearance Item
                    </Label>
                    <p className="text-xs text-gray-500">
                      Apply additional discount and clearance badge
                    </p>
                  </div>
                  <Tag className="h-5 w-5 text-red-600" />
                </div>

                {/* Clearance Discount */}
                {pricingData.isClearance && (
                  <div>
                    <Label htmlFor="discountPercentage">Clearance Discount (%)</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={pricingData.discountPercentage}
                      onChange={(e) => setPricingData({
                        ...pricingData,
                        discountPercentage: parseFloat(e.target.value) || 0
                      })}
                      placeholder="Additional discount percentage"
                    />
                  </div>
                )}

                {/* Price Preview */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Price Preview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Exhibition Price:</span>
                      <span className="font-medium">{formatPrice(pricingData.exhibitionPrice)}</span>
                    </div>
                    {pricingData.isClearance && pricingData.discountPercentage > 0 && (
                      <>
                        <div className="flex justify-between text-red-600">
                          <span>Clearance Discount:</span>
                          <span>-{pricingData.discountPercentage}%</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-1">
                          <span>Final Price:</span>
                          <span className="text-green-600">
                            {formatPrice(pricingData.exhibitionPrice * (1 - pricingData.discountPercentage / 100))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sales Notes */}
                <div>
                  <Label htmlFor="salesNotes">Sales Notes (Optional)</Label>
                  <textarea
                    id="salesNotes"
                    value={pricingData.salesNotes}
                    onChange={(e) => setPricingData({
                      ...pricingData,
                      salesNotes: e.target.value
                    })}
                    placeholder="Notes about pricing, performance, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowPricingModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePricing} disabled={loading}>
                  Save Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Bulk Pricing Modal */}
      {showBulkPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bulk Clearance</h3>
                <Button variant="ghost" onClick={() => setShowBulkPricingModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Apply clearance discount to {selectedProducts.length} selected products
                  </p>
                </div>

                <div>
                  <Label htmlFor="bulkDiscount">Clearance Discount (%)</Label>
                  <Input
                    id="bulkDiscount"
                    type="number"
                    min="0"
                    max="100"
                    value={bulkDiscount}
                    onChange={(e) => setBulkDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="Discount percentage for all selected items"
                  />
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Bulk Clearance Action
                      </p>
                      <p className="text-xs text-orange-700">
                        This will mark all selected products as clearance and apply the discount.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowBulkPricingModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkClearance} 
                  disabled={loading || selectedProducts.length === 0 || bulkDiscount <= 0}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Apply Clearance
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Summary Cards */}
      {exhibitionProducts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Total Products</div>
                  <div className="text-xl font-bold">{exhibitionProducts.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm text-gray-600">Clearance Items</div>
                  <div className="text-xl font-bold">
                    {exhibitionProducts.filter(ep => ep.isClearance).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Custom Pricing</div>
                  <div className="text-xl font-bold">
                    {exhibitionProducts.filter(ep => ep.exhibitionPrice && ep.exhibitionPrice !== ep.product.sellingPriceUSD).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Avg. Final Price</div>
                  <div className="text-xl font-bold">
                    {formatPrice(
                      exhibitionProducts.reduce((sum, ep) => sum + calculateFinalPrice(ep), 0) / 
                      exhibitionProducts.length
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}