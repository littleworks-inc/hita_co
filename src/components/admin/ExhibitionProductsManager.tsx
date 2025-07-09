// src/components/admin/ExhibitionProductsManager.tsx
// =====================================
// 🚀 ENHANCED: Exhibition Products Manager with Size Selection
// Now supports adding products with individual size selection and quantities
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import ProductImage from '@/components/admin/ProductImage'
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
  ShoppingBag
} from 'lucide-react'

// Types
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
  images: string[]
  requiresSizes: boolean
  sizeType?: string
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

interface ExhibitionProduct {
  id: string
  productId: string
  quantityTaken: number
  quantitySold: number
  exhibitionPrice?: number
  originalPrice?: number
  discountPercentage?: number
  isClearance?: boolean
  priceHistory?: any
  salesNotes?: string
  lastSaleDate?: Date
  priceChangedAt?: Date
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

  // Pricing management states
  const [activeTab, setActiveTab] = useState<'quantities' | 'pricing'>('quantities')
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingProductId, setPricingProductId] = useState<string | null>(null)
  const [pricingData, setPricingData] = useState({
    exhibitionPrice: 0,
    discountPercentage: 0,
    isClearance: false,
    salesNotes: ''
  })

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
  // =====================================
// ✅ UPDATED: handleAddProduct function in ExhibitionProductsManager.tsx
// =====================================

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

    if (addQuantityTaken > product.stockQuantity) {
      alert(`Cannot take ${addQuantityTaken} items. Only ${product.stockQuantity} available.`)
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

  // Calculate pricing hierarchy (existing logic preserved)
  const calculatePricingHierarchy = (exhibitionProduct: ExhibitionProduct) => {
    const product = exhibitionProduct.product

    const storeOriginalPrice = product.discountPercentage > 0
      ? product.sellingPriceUSD / (1 - product.discountPercentage / 100)
      : product.sellingPriceUSD

    const customerFinalPrice = product.discountPercentage > 0
      ? storeOriginalPrice * (1 - product.discountPercentage / 100)
      : storeOriginalPrice

    const exhibitionPrice = exhibitionProduct.exhibitionPrice ?? customerFinalPrice

    const finalExhibitionPrice = exhibitionProduct.isClearance && exhibitionProduct.discountPercentage
      ? exhibitionPrice * (1 - exhibitionProduct.discountPercentage / 100)
      : exhibitionPrice

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
      hasExhibitionPrice: !!exhibitionProduct.exhibitionPrice,
      hasExhibitionDiscount: exhibitionProduct.isClearance && (exhibitionProduct.discountPercentage || 0) > 0
    }
  }

  // Rest of existing handlers (edit, remove, pricing) preserved...
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
        alert(errorData.error || 'Failed to update quantities')
      }
    } catch (error) {
      alert('Failed to update quantities. Please try again.')
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

  return (
    <div className="space-y-6">
      {/* Main Products Management Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Exhibition Products ({exhibitionProducts.length})
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Manage products taken to this exhibition, with size selection and quantities
              </p>
            </div>

            <Button onClick={() => setShowAddModal(true)}>
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
            <div className="space-y-4">
              {exhibitionProducts.map((exhibitionProduct) => {
                const pricing = calculatePricingHierarchy(exhibitionProduct)
                const isEditing = editingId === exhibitionProduct.id

                return (
                  <div key={exhibitionProduct.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      <ProductImage
                        images={exhibitionProduct.product.images}
                        name={exhibitionProduct.product.name}
                        className="h-20 w-20 flex-shrink-0"
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
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
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(exhibitionProduct)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveProduct(exhibitionProduct.id, exhibitionProduct.product.name)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quantities */}
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label className="text-xs text-gray-500">Quantity Taken</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editQuantityTaken}
                                onChange={(e) => setEditQuantityTaken(parseInt(e.target.value) || 0)}
                                className="h-8"
                                min="0"
                              />
                            ) : (
                              <p className="font-medium">{exhibitionProduct.quantityTaken}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Quantity Sold</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editQuantitySold}
                                onChange={(e) => setEditQuantitySold(parseInt(e.target.value) || 0)}
                                className="h-8"
                                min="0"
                                max={editQuantityTaken}
                              />
                            ) : (
                              <p className="font-medium text-green-600">{exhibitionProduct.quantitySold}</p>
                            )}
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="mt-3 text-sm">
                          <span className="text-gray-600">Price: </span>
                          <span className="font-medium">{formatPrice(pricing.finalExhibitionPrice)}</span>
                          {pricing.hasStoreDiscount && (
                            <span className="ml-2 text-green-600">
                              ({pricing.storeDiscount}% off)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🚀 ENHANCED: Add Product Modal with Size Selection */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Add Products to Exhibition</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedProductId('')
                  setShowSizeSelection(false)
                  setSelectedSizes([])
                  setSearchQuery('')
                  setCategoryFilter('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!showSizeSelection ? (
                /* ✅ STEP 1: Product Selection */
                <div className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search">Search Products</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          type="text"
                          placeholder="Search by name or SKU..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="w-48">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div>
                    <Label>Select Product *</Label>
                    {filteredAvailableProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg mt-2">
                        <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p>No available products found</p>
                        <p className="text-sm">All products may already be added to this exhibition</p>
                      </div>
                    ) : (
                      <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredAvailableProducts.map((product) => (
                          <div
                            key={product.id}
                            className={`p-4 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${selectedProductId === product.id ? 'bg-blue-50 border-blue-200' : ''
                              }`}
                            onClick={() => setSelectedProductId(product.id)}
                          >
                            <div className="flex items-center gap-4">
                              {/* Product Image */}
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                {product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {product.name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      SKU: {product.sku} • {product.category.name}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span className="text-sm font-medium text-green-600">
                                        ${product.sellingPriceUSD.toFixed(2)}
                                      </span>
                                      {product.requiresSizes ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          <Ruler className="h-3 w-3 mr-1" />
                                          Requires Size Selection
                                        </span>
                                      ) : (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.stockQuantity > 0
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                          }`}>
                                          {product.stockQuantity} in stock
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Selection Indicator */}
                                  {selectedProductId === product.id && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity Input for Non-Sized Products */}
                  {selectedProductId && !filteredAvailableProducts.find(p => p.id === selectedProductId)?.requiresSizes && (
                    <div>
                      <Label htmlFor="quantity">Quantity to Take *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={filteredAvailableProducts.find(p => p.id === selectedProductId)?.stockQuantity || 1}
                        value={addQuantityTaken}
                        onChange={(e) => setAddQuantityTaken(parseInt(e.target.value) || 1)}
                        className="mt-1 w-32"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {filteredAvailableProducts.find(p => p.id === selectedProductId)?.stockQuantity || 0} units
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowAddModal(false)}>
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
                          {product?.images.length > 0 && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{product?.name}</h4>
                            <p className="text-sm text-gray-600">SKU: {product?.sku}</p>
                            <p className="text-sm text-green-600 font-medium">
                              ${product?.sellingPriceUSD.toFixed(2)}
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
                              <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                              <p>No sizes available or all sizes are out of stock</p>
                            </div>
                          ) : (
                            <div className="grid gap-3 max-h-60 overflow-y-auto">
                              {selectedSizes.map((size) => (
                                <div
                                  key={size.sizeId}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                                >
                                  {/* Size Info */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <span className="font-bold text-blue-800">{size.size}</span>
                                    </div>
                                    <div>
                                      <div className="font-medium">Size {size.size}</div>
                                      <div className="text-sm text-gray-600">SKU: {size.sku}</div>
                                      <div className="text-sm">
                                        <span className={`font-medium ${size.stockQuantity <= 5 ? 'text-red-600' : 'text-green-600'
                                          }`}>
                                          {size.stockQuantity} available
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updatedSizes = selectedSizes.map(s =>
                                          s.sizeId === size.sizeId
                                            ? { ...s, quantityTaken: Math.max(0, s.quantityTaken - 1) }
                                            : s
                                        )
                                        setSelectedSizes(updatedSizes)
                                      }}
                                      disabled={size.quantityTaken <= 0}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>

                                    <Input
                                      type="number"
                                      min="0"
                                      max={size.stockQuantity}
                                      value={size.quantityTaken}
                                      onChange={(e) => {
                                        const quantity = parseInt(e.target.value) || 0
                                        const updatedSizes = selectedSizes.map(s =>
                                          s.sizeId === size.sizeId
                                            ? { ...s, quantityTaken: Math.max(0, Math.min(quantity, s.stockQuantity)) }
                                            : s
                                        )
                                        setSelectedSizes(updatedSizes)
                                      }}
                                      className="w-16 text-center"
                                    />

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updatedSizes = selectedSizes.map(s =>
                                          s.sizeId === size.sizeId
                                            ? { ...s, quantityTaken: Math.min(s.quantityTaken + 1, s.stockQuantity) }
                                            : s
                                        )
                                        setSelectedSizes(updatedSizes)
                                      }}
                                      disabled={size.quantityTaken >= size.stockQuantity}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Selection Summary */}
                        {sizesWithQuantity.length > 0 && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">Selected Sizes Summary</span>
                            </div>
                            <div className="space-y-1">
                              {sizesWithQuantity.map((size) => (
                                <div key={size.sizeId} className="flex justify-between text-sm">
                                  <span className="text-blue-800">Size {size.size}:</span>
                                  <span className="font-medium text-blue-900">{size.quantityTaken} units</span>
                                </div>
                              ))}
                              <div className="border-t border-blue-200 pt-1 mt-2">
                                <div className="flex justify-between font-medium text-blue-900">
                                  <span>Total Quantity:</span>
                                  <span>{totalQuantitySelected} units</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <Button variant="outline" onClick={() => {
                            setShowSizeSelection(false)
                            setSelectedSizes([])
                          }}>
                            Back
                          </Button>
                          <Button
                            onClick={handleAddProduct}
                            disabled={loading || totalQuantitySelected === 0}
                            className="flex items-center gap-2"
                          >
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ShoppingBag className="h-4 w-4" />
                            )}
                            Add to Exhibition ({totalQuantitySelected})
                          </Button>
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
    </div>
  )
}