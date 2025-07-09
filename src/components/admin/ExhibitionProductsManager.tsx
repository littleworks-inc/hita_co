// src/components/admin/ExhibitionProductsManager.tsx
// =====================================
// 🚀 ENHANCED: Exhibition Products Manager with Size Selection AND Pricing Management
// Now supports adding products with individual size selection and exhibition-specific pricing
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import ProductImage from '@/components/admin/ProductImage'
import ExhibitionPricingManager from '@/components/admin/ExhibitionPricingManager'
import {
  Package,
  Plus,
  Minus,
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
  Zap,
  Ruler,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Settings
} from 'lucide-react'

// ✅ FIXED TYPES - Match database schema with proper null handling
interface ProductSize {
  id: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

interface Product {
  id: string
  name: string
  sku: string
  sellingPriceUSD: number
  discountPercentage: number
  stockQuantity: number
  images: string[]      // ✅ FIXED: ProductImage component handles empty arrays internally
  requiresSizes: boolean
  category: { name: string }
  country: { name: string }
  productSizes?: ProductSize[]
}

interface ExhibitionProductSize {
  id: string
  productSizeId: string
  quantityTaken: number
  quantitySold: number
  productSize: ProductSize
}

// ✅ FIXED: Match database return types (null instead of undefined)
interface ExhibitionProduct {
  id: string
  productId: string
  quantityTaken: number
  quantitySold: number
  exhibitionPrice: number | null    // ✅ FIXED: null instead of undefined
  originalPrice: number | null      // ✅ FIXED: null instead of undefined
  discountPercentage: number | null // ✅ FIXED: null instead of undefined
  isClearance: boolean | null       // ✅ FIXED: null instead of undefined
  priceHistory: any | null          // ✅ FIXED: null instead of undefined
  salesNotes: string | null         // ✅ FIXED: null instead of undefined
  lastSaleDate: Date | null         // ✅ FIXED: null instead of undefined
  priceChangedAt: Date | null       // ✅ FIXED: null instead of undefined
  product: Product
  exhibitionSizes?: ExhibitionProductSize[]
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

// Size quantity selection interface
interface SizeQuantity {
  sizeId: string
  size: string
  sku: string
  stockQuantity: number
  quantityTaken: number
}

export default function ExhibitionProductsManager({
  exhibition,
  exhibitionProducts,
  availableProducts
}: ExhibitionProductsManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // State management
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Edit states for quantities
  const [editQuantityTaken, setEditQuantityTaken] = useState(0)
  const [editQuantitySold, setEditQuantitySold] = useState(0)

  // Add product states
  const [selectedProductId, setSelectedProductId] = useState('')
  const [addQuantityTaken, setAddQuantityTaken] = useState(1)

  // 🚀 NEW: Size selection states
  const [selectedSizes, setSelectedSizes] = useState<SizeQuantity[]>([])
  const [showSizeSelection, setShowSizeSelection] = useState(false)

  // 🚀 NEW: Pricing management states
  const [activeTab, setActiveTab] = useState<'quantities' | 'pricing'>('quantities')
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingProductId, setPricingProductId] = useState<string | null>(null)

  // Bulk operations states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showBulkPricingModal, setShowBulkPricingModal] = useState(false)
  const [bulkDiscount, setBulkDiscount] = useState(0)

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

  // 🚀 NEW: Handle product selection with size checking
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)

    const product = availableProducts.find(p => p.id === productId)
    if (product?.requiresSizes && product.productSizes) {
      // Product has sizes - show size selection
      setSelectedSizes(
        product.productSizes
          .filter(size => size.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(size => ({
            sizeId: size.id,
            size: size.size,
            sku: size.sku,
            stockQuantity: size.stockQuantity,
            quantityTaken: 0
          }))
      )
      setShowSizeSelection(true)
    } else {
      // Product doesn't have sizes - use regular quantity
      setSelectedSizes([])
      setShowSizeSelection(false)
    }
  }

  // 🚀 NEW: Update size quantity
  const updateSizeQuantity = (sizeId: string, quantity: number) => {
    setSelectedSizes(prev =>
      prev.map(size =>
        size.sizeId === sizeId
          ? { ...size, quantityTaken: Math.max(0, Math.min(quantity, size.stockQuantity)) }
          : size
      )
    )
  }

  // 🚀 NEW: Enhanced add product with size support
  const handleAddProduct = async () => {
    if (!selectedProductId) {
      alert('Please select a product')
      return
    }

    const product = filteredAvailableProducts.find(p => p.id === selectedProductId)
    
    if (product?.requiresSizes) {
      // Validate size selections
      const sizesWithQuantity = selectedSizes.filter(size => size.quantityTaken > 0)
      if (sizesWithQuantity.length === 0) {
        alert('Please select at least one size with a quantity greater than 0')
        return
      }

      // Validate each size doesn't exceed stock
      for (const size of sizesWithQuantity) {
        if (size.quantityTaken > size.stockQuantity) {
          alert(`Cannot take ${size.quantityTaken} of size ${size.size}. Only ${size.stockQuantity} available.`)
          return
        }
      }
    } else {
      // Validate regular quantity
      if (addQuantityTaken <= 0) {
        alert('Please enter a valid quantity')
        return
      }

      if (addQuantityTaken > (product?.stockQuantity || 0)) {
        alert(`Cannot take ${addQuantityTaken} items. Only ${product?.stockQuantity || 0} available.`)
        return
      }
    }

    setLoading(true)

    try {
      const requestBody = product?.requiresSizes 
        ? {
            productId: selectedProductId,
            sizes: selectedSizes
              .filter(size => size.quantityTaken > 0)
              .map(size => ({
                productSizeId: size.sizeId,
                quantityTaken: size.quantityTaken
              }))
          }
        : {
            productId: selectedProductId,
            quantityTaken: addQuantityTaken
          }

      console.log('Adding product to exhibition:', requestBody)

      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const responseData = await response.json()

      if (response.ok) {
        // Reset all states
        setShowAddModal(false)
        setSelectedProductId('')
        setAddQuantityTaken(1)
        setSelectedSizes([])
        setShowSizeSelection(false)
        setSearchQuery('')
        setCategoryFilter('')
        
        // Show success message
        alert(responseData.message || 'Product added to exhibition successfully!')
        
        // Refresh the page to show new products
        router.refresh()
      } else {
        alert(responseData.error || 'Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: Calculate pricing hierarchy with proper null handling (clearance as badge only)
  const calculatePricingHierarchy = (exhibitionProduct: ExhibitionProduct) => {
    const product = exhibitionProduct.product
    const originalPrice = exhibitionProduct.originalPrice ?? product.sellingPriceUSD
    const exhibitionPrice = exhibitionProduct.exhibitionPrice ?? originalPrice

    const storeOriginalPrice = product.discountPercentage > 0
      ? product.sellingPriceUSD / (1 - product.discountPercentage / 100)
      : product.sellingPriceUSD

    const customerFinalPrice = product.discountPercentage > 0
      ? storeOriginalPrice * (1 - product.discountPercentage / 100)
      : storeOriginalPrice

    // Apply exhibition discount only (clearance is just a visual badge)
    const finalExhibitionPrice = exhibitionPrice * (1 - (exhibitionProduct.discountPercentage || 0) / 100)

    const storeDiscount = product.discountPercentage || 0
    const storeSavings = storeOriginalPrice - customerFinalPrice
    const exhibitionSavings = exhibitionPrice - finalExhibitionPrice
    const totalSavings = storeOriginalPrice - finalExhibitionPrice
    const totalDiscountPercent = storeOriginalPrice > 0
      ? ((totalSavings / storeOriginalPrice) * 100)
      : 0

    return {
      storeOriginalPrice,
      customerFinalPrice,
      exhibitionPrice,
      finalExhibitionPrice,
      storeDiscount,
      storeSavings,
      exhibitionSavings,
      totalSavings,
      totalDiscountPercent,
      hasStoreDiscount: storeDiscount > 0,
      hasExhibitionPrice: exhibitionProduct.exhibitionPrice != null,
      hasExhibitionDiscount: (exhibitionProduct.discountPercentage || 0) > 0,
      hasClearance: exhibitionProduct.isClearance ?? false // Just for badge display
    }
  }

  // 🚀 NEW: Pricing modal handlers
  const handleOpenPricing = (productId: string) => {
    setPricingProductId(productId)
    setShowPricingModal(true)
  }

  const handleClosePricing = () => {
    setPricingProductId(null)
    setShowPricingModal(false)
  }

  // Edit product quantities
  const handleEditProduct = (id: string) => {
    const product = exhibitionProducts.find(p => p.id === id)
    if (product) {
      setEditingId(id)
      setEditQuantityTaken(product.quantityTaken)
      setEditQuantitySold(product.quantitySold)
    }
  }

  const handleSaveEdit = async (id: string) => {
    if (editQuantitySold > editQuantityTaken) {
      alert('Quantity sold cannot exceed quantity taken')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products/${id}`, {
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
      console.error('Error updating product:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditQuantityTaken(0)
    setEditQuantitySold(0)
  }

  // Delete product from exhibition
  const handleDeleteProduct = async (id: string) => {
    const product = exhibitionProducts.find(p => p.id === id)
    if (!product) return

    if (!confirm(`Are you sure you want to remove "${product.product.name}" from this exhibition?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibition.id}/products/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Exhibition Products</h2>
          <p className="text-gray-600 mt-1">
            Manage products taken to {exhibition.title}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Products
        </Button>
      </div>

      {/* Current Exhibition Products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Current Products ({exhibitionProducts.length})
          </h3>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'quantities' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('quantities')}
            >
              <Package className="h-4 w-4 mr-2" />
              Quantities
            </Button>
            <Button
              variant={activeTab === 'pricing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('pricing')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing
            </Button>
          </div>
        </div>

        {exhibitionProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products added yet</h3>
              <p className="text-gray-600 mb-4">Add products from your inventory to this exhibition</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exhibitionProducts.map(exhibitionProduct => {
              const isEditing = editingId === exhibitionProduct.id
              const pricing = calculatePricingHierarchy(exhibitionProduct)
              const availableStock = exhibitionProduct.quantityTaken - exhibitionProduct.quantitySold

              return (
                <Card key={exhibitionProduct.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Product Image */}
                          <div className="w-16 h-16 flex-shrink-0">
                            <ProductImage
                              images={exhibitionProduct.product.images || []}
                              name={exhibitionProduct.product.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{exhibitionProduct.product.name}</h4>
                            <p className="text-sm text-gray-600">
                              SKU: {exhibitionProduct.product.sku} • {exhibitionProduct.product.category.name}
                            </p>

                            {/* Size Information */}
                            {exhibitionProduct.exhibitionSizes && exhibitionProduct.exhibitionSizes.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1 text-sm text-blue-600 mb-1">
                                  <Ruler className="h-3 w-3" />
                                  <span>Sizes taken:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {exhibitionProduct.exhibitionSizes.map(exhSize => (
                                    <span
                                      key={exhSize.id}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                    >
                                      {exhSize.productSize.size}: {exhSize.quantityTaken}
                                      {exhSize.quantitySold > 0 && (
                                        <span className="ml-1 text-green-600">
                                          (sold: {exhSize.quantitySold})
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {activeTab === 'quantities' ? (
                              /* Quantities Tab */
                              <div className="mt-3 space-y-2">
                                {isEditing ? (
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <Label className="text-xs">Taken</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={editQuantityTaken}
                                        onChange={(e) => setEditQuantityTaken(parseInt(e.target.value) || 0)}
                                        className="w-20 h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Sold</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={editQuantityTaken}
                                        value={editQuantitySold}
                                        onChange={(e) => setEditQuantitySold(parseInt(e.target.value) || 0)}
                                        className="w-20 h-8"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-6 text-sm">
                                    <div>
                                      <span className="text-gray-600">Taken:</span>
                                      <span className="ml-1 font-medium">{exhibitionProduct.quantityTaken}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Sold:</span>
                                      <span className="ml-1 font-medium text-green-600">{exhibitionProduct.quantitySold}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Available:</span>
                                      <span className="ml-1 font-medium text-blue-600">{availableStock}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Pricing Tab */
                              <div className="mt-3 space-y-3">
                                <div className="flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Store Price:</span>
                                    <span className="ml-1 font-medium">{formatPrice(pricing.customerFinalPrice)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Exhibition Price:</span>
                                    <span className="ml-1 font-medium text-purple-600">{formatPrice(pricing.exhibitionPrice)}</span>
                                  </div>
                                  {pricing.totalSavings > 0 && (
                                    <div>
                                      <span className="text-gray-600">Savings:</span>
                                      <span className="ml-1 font-medium text-green-600">
                                        {formatPrice(pricing.totalSavings)} ({Math.round(pricing.totalDiscountPercent)}%)
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* 🚀 NEW: Pricing Tags */}
                                <div className="flex flex-wrap gap-1">
                                  {pricing.hasStoreDiscount && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                      Store Sale
                                    </span>
                                  )}
                                  {pricing.hasExhibitionPrice && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                      Custom Price
                                    </span>
                                  )}
                                  {pricing.hasExhibitionDiscount && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      {exhibitionProduct.discountPercentage}% Off
                                    </span>
                                  )}
                                  {pricing.hasClearance && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Clearance
                                    </span>
                                  )}
                                </div>

                                {/* 🚀 NEW: Final Price Display */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-green-800">Final Customer Price:</span>
                                    <span className="text-lg font-bold text-green-800">
                                      {formatPrice(pricing.finalExhibitionPrice)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
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
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(exhibitionProduct.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* 🚀 NEW: Pricing Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPricing(exhibitionProduct.id)}
                              className="text-purple-600 hover:text-purple-700"
                              title="Manage Exhibition Pricing"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(exhibitionProduct.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Products to Exhibition</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedProductId('')
                    setSelectedSizes([])
                    setShowSizeSelection(false)
                    setSearchQuery('')
                    setCategoryFilter('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {!showSizeSelection ? (
                /* ✅ STEP 1: Product Selection */
                <div className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Search Products</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by name or SKU..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="w-48">
                      <Label className="text-sm font-medium">Category</Label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Available Products */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Available Products ({filteredAvailableProducts.length})</h4>
                    
                    {filteredAvailableProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery || categoryFilter ? 'No products match your filters' : 'No products available to add'}
                      </div>
                    ) : (
                      <div className="grid gap-3 max-h-96 overflow-y-auto">
                        {filteredAvailableProducts.map(product => (
                          <div
                            key={product.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedProductId === product.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleProductSelect(product.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 flex-shrink-0">
                                <ProductImage
                                  images={product.images || []}
                                  name={product.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium truncate">{product.name}</h5>
                                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-sm font-medium text-green-600">
                                    {formatPrice(product.sellingPriceUSD)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Stock: {product.stockQuantity}
                                  </span>
                                  {product.requiresSizes && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Has Sizes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity Input for non-sized products */}
                  {selectedProductId && !filteredAvailableProducts.find(p => p.id === selectedProductId)?.requiresSizes && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium">Quantity to Take</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          type="number"
                          min="1"
                          max={filteredAvailableProducts.find(p => p.id === selectedProductId)?.stockQuantity || 1}
                          value={addQuantityTaken}
                          onChange={(e) => setAddQuantityTaken(parseInt(e.target.value) || 1)}
                          className="w-32"
                        />
                        <span className="text-sm text-gray-500">
                          Available: {filteredAvailableProducts.find(p => p.id === selectedProductId)?.stockQuantity || 0}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t pt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const product = filteredAvailableProducts.find(p => p.id === selectedProductId)
                        if (product?.requiresSizes && product.productSizes) {
                          // Initialize size selection
                          setSelectedSizes(
                            product.productSizes
                              .filter(size => size.isActive && size.stockQuantity > 0)
                              .sort((a, b) => a.sortOrder - b.sortOrder)
                              .map(size => ({
                                sizeId: size.id,
                                size: size.size,
                                sku: size.sku,
                                stockQuantity: size.stockQuantity,
                                quantityTaken: 0
                              }))
                          )
                          setShowSizeSelection(true)
                        } else {
                          handleAddProduct()
                        }
                      }}
                      disabled={!selectedProductId || loading}
                    >
                      {filteredAvailableProducts.find(p => p.id === selectedProductId)?.requiresSizes
                        ? 'Select Sizes'
                        : 'Add to Exhibition'
                      }
                    </Button>
                  </div>
                </div>
              ) : (
                /* ✅ STEP 2: Size Selection (Integrated) */
                <div className="space-y-6">
                  {(() => {
                    const product = filteredAvailableProducts.find(p => p.id === selectedProductId)
                    const totalQuantitySelected = selectedSizes.reduce((sum, size) => sum + size.quantityTaken, 0)
                    const sizesWithQuantity = selectedSizes.filter(size => size.quantityTaken > 0)

                    return (
                      <>
                        {/* Header */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Ruler className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">Select Sizes for "{product?.name}"</h3>
                          </div>
                          <p className="text-sm text-gray-600">
                            Choose which sizes and quantities to take to the exhibition
                          </p>
                        </div>

                        {/* Product Info */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <ProductImage
                            images={product?.images || []}
                            name={product?.name || ''}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div>
                            <h4 className="font-medium">{product?.name}</h4>
                            <p className="text-sm text-gray-600">SKU: {product?.sku}</p>
                            <p className="text-sm text-green-600 font-medium">
                              {formatPrice(product?.sellingPriceUSD || 0)}
                            </p>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="text-sm text-gray-500">Total selected</div>
                            <div className="text-lg font-bold text-blue-600">{totalQuantitySelected}</div>
                          </div>
                        </div>

                        {/* Size Selection Grid */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900">Available Sizes</h5>

                          {selectedSizes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              This product has no active sizes with stock available.
                            </div>
                          ) : (
                            <div className="grid gap-3 max-h-96 overflow-y-auto">
                              {selectedSizes.map(size => (
                                <div
                                  key={size.sizeId}
                                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="font-bold text-blue-700">{size.size}</span>
                                      </div>
                                      <div>
                                        <h6 className="font-medium">Size {size.size}</h6>
                                        <p className="text-sm text-gray-600">SKU: {size.sku}</p>
                                        <p className="text-sm text-gray-500">Available: {size.stockQuantity}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateSizeQuantity(size.sizeId, size.quantityTaken - 1)}
                                      disabled={size.quantityTaken <= 0}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    
                                    <Input
                                      type="number"
                                      min="0"
                                      max={size.stockQuantity}
                                      value={size.quantityTaken}
                                      onChange={(e) => updateSizeQuantity(size.sizeId, parseInt(e.target.value) || 0)}
                                      className="w-20 text-center"
                                    />
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateSizeQuantity(size.sizeId, size.quantityTaken + 1)}
                                      disabled={size.quantityTaken >= size.stockQuantity}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Summary */}
                        {sizesWithQuantity.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h6 className="font-medium text-blue-900 mb-2">Selection Summary</h6>
                            <div className="space-y-1">
                              {sizesWithQuantity.map(size => (
                                <div key={size.sizeId} className="flex justify-between text-sm">
                                  <span>Size {size.size}:</span>
                                  <span className="font-medium">{size.quantityTaken} units</span>
                                </div>
                              ))}
                              <div className="border-t border-blue-200 pt-2 mt-2">
                                <div className="flex justify-between font-medium text-blue-900">
                                  <span>Total Quantity:</span>
                                  <span>{totalQuantitySelected} units</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="border-t pt-4 flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setShowSizeSelection(false)}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                          </Button>

                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddModal(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddProduct}
                              disabled={totalQuantitySelected === 0 || loading}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                `Add ${totalQuantitySelected} Units to Exhibition`
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 NEW: Pricing Management Modal */}
      {showPricingModal && pricingProductId && (
        <ExhibitionPricingManager
          exhibitionProduct={exhibitionProducts.find(ep => ep.id === pricingProductId)!}
          exhibitionId={exhibition.id}
          onUpdate={() => {
            handleClosePricing()
            router.refresh()
          }}
          onCancel={handleClosePricing}
        />
      )}
    </div>
  )
}