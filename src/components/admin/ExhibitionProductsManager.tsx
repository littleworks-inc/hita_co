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
  discountPercentage: number
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

  // ✅ CORRECTED: Fixed pricing calculation to match customer-facing logic
  const calculatePricingHierarchy = (exhibitionProduct: ExhibitionProduct) => {
    const product = exhibitionProduct.product
    
    // ✅ CRITICAL CORRECTION: 
    // - sellingPriceUSD = ORIGINAL price (before discount) - matches customer logic
    // - discountPercentage = Store discount to be applied
    
    const storeOriginalPrice = product.sellingPriceUSD  // $104.04 (original price)
    
    // Calculate what customer actually pays (with store discount applied)
    const customerFinalPrice = product.discountPercentage > 0 
      ? storeOriginalPrice * (1 - product.discountPercentage / 100)  // $93.64
      : storeOriginalPrice
    
    // Exhibition price (custom price for exhibition or defaults to customer final price)
    const exhibitionPrice = exhibitionProduct.exhibitionPrice || customerFinalPrice
    
    // Final exhibition price after exhibition-specific clearance discount
    const finalExhibitionPrice = exhibitionProduct.isClearance && exhibitionProduct.discountPercentage
      ? exhibitionPrice * (1 - exhibitionProduct.discountPercentage / 100)
      : exhibitionPrice
    
    // Calculate savings information
    const storeDiscount = product.discountPercentage || 0
    const storeSavings = storeOriginalPrice - customerFinalPrice
    const exhibitionSavings = exhibitionPrice - finalExhibitionPrice
    const totalSavings = storeOriginalPrice - finalExhibitionPrice
    const totalDiscountPercent = storeOriginalPrice > 0 
      ? ((totalSavings) / storeOriginalPrice) * 100 
      : 0
    
    return {
      // ✅ CORRECTED PRICING HIERARCHY:
      storeOriginalPrice,        // $104.04 - sellingPriceUSD (original price)
      customerFinalPrice,        // $93.64 - What customer pays (after 10% discount)
      exhibitionPrice,           // $93.64 - Price for this exhibition (default = customerFinalPrice)
      finalExhibitionPrice,      // $93.64 - Final exhibition price after any clearance
      
      // Discount information
      storeDiscount,             // 10% - Store discount percentage
      exhibitionDiscount: exhibitionProduct.discountPercentage || 0, // Additional exhibition discount
      
      // Savings calculations
      storeSavings,              // $10.40 - How much store discount saves
      exhibitionSavings,         // $0 - How much exhibition clearance saves
      totalSavings,              // $10.40 - Total savings from original
      totalDiscountPercent,      // 10% - Total discount percentage
      
      // Status flags
      hasStoreDiscount: storeDiscount > 0,
      hasExhibitionDiscount: (exhibitionProduct.discountPercentage || 0) > 0,
      hasCustomExhibitionPrice: exhibitionProduct.exhibitionPrice && 
                               exhibitionProduct.exhibitionPrice !== customerFinalPrice,
      isOnClearance: exhibitionProduct.isClearance || false
    }
  }

  // Performance icon helper
  const getPerformanceIcon = (taken: number, sold: number) => {
    if (taken === 0) return CheckCircle
    const rate = (sold / taken) * 100
    if (rate >= 80) return TrendingUp
    if (rate >= 50) return CheckCircle
    if (rate >= 20) return AlertTriangle
    return TrendingUp
  }

  // Event handlers
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

  // Pricing handlers
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

  // Calculate summary statistics for pricing overview
  const pricingSummary = exhibitionProducts.length > 0 ? {
    averageStoreDiscount: exhibitionProducts.reduce((sum, ep) => sum + (ep.product.discountPercentage || 0), 0) / exhibitionProducts.length,
    totalOriginalValue: exhibitionProducts.reduce((sum, ep) => {
      const pricing = calculatePricingHierarchy(ep)
      return sum + (pricing.storeOriginalPrice * ep.quantityTaken)
    }, 0),
    totalCustomerValue: exhibitionProducts.reduce((sum, ep) => {
      const pricing = calculatePricingHierarchy(ep)
      return sum + (pricing.customerFinalPrice * ep.quantityTaken)
    }, 0),
    totalSavings: exhibitionProducts.reduce((sum, ep) => {
      const pricing = calculatePricingHierarchy(ep)
      return sum + (pricing.totalSavings * ep.quantityTaken)
    }, 0),
    clearanceProducts: exhibitionProducts.filter(ep => ep.isClearance).length,
    customPricedProducts: exhibitionProducts.filter(ep => ep.exhibitionPrice && ep.exhibitionPrice !== ep.product.sellingPriceUSD).length
  } : null

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
                Manage products taken to this exhibition, quantities, and pricing
              </p>
            </div>
            
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Products
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mt-4">
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
              Pricing & Discounts
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
              {/* Products Table */}
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
                        {/* ✅ FIXED: Updated column headers for clarity */}
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original Price
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Pays
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exhibition Price
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount Status
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
                    const pricing = calculatePricingHierarchy(exhibitionProduct)
                    const PerformanceIcon = getPerformanceIcon(exhibitionProduct.quantityTaken, exhibitionProduct.quantitySold)
                    const isEditing = editingId === exhibitionProduct.id
                    const sellRate = exhibitionProduct.quantityTaken > 0 
                      ? (exhibitionProduct.quantitySold / exhibitionProduct.quantityTaken) * 100 
                      : 0

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
                            <ProductImage 
                              images={exhibitionProduct.product.images} 
                              name={exhibitionProduct.product.name}
                              className="h-12 w-12"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {exhibitionProduct.product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {exhibitionProduct.product.sku} • {exhibitionProduct.product.category.name}
                              </div>
                            </div>
                          </div>
                        </td>

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
                                <PerformanceIcon className={`h-4 w-4 ${
                                  sellRate >= 80 ? 'text-green-600' :
                                  sellRate >= 50 ? 'text-blue-600' :
                                  sellRate >= 20 ? 'text-yellow-600' : 'text-red-600'
                                }`} />
                                <span className="text-sm font-medium">
                                  {sellRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>

                            {/* Revenue */}
                            <td className="px-6 py-4 text-center">
                              <div className="font-medium">
                                {formatPrice(exhibitionProduct.quantitySold * pricing.finalExhibitionPrice)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatPrice(pricing.finalExhibitionPrice)} each
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* ✅ FIXED: Store Original Price - Before any discounts */}
                            <td className="px-6 py-4 text-center">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-600">
                                  {formatPrice(pricing.storeOriginalPrice)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {pricing.hasStoreDiscount ? 'Before store discount' : 'Regular price'}
                                </div>
                              </div>
                            </td>

                            {/* ✅ FIXED: Customer Final Price - What customer actually pays */}
                            <td className="px-6 py-4 text-center">
                              <div className="space-y-1">
                                <div className="font-bold text-green-600 text-lg">
                                  {formatPrice(pricing.customerFinalPrice)}
                                </div>
                                {pricing.hasStoreDiscount ? (
                                  <div className="text-xs text-green-600">
                                    After {pricing.storeDiscount}% store discount
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500">
                                    Regular customer price
                                  </div>
                                )}
                                {pricing.storeSavings > 0 && (
                                  <div className="text-xs text-green-600">
                                    Saves {formatPrice(pricing.storeSavings)}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* ✅ FIXED: Exhibition Price - Price for this specific event */}
                            <td className="px-6 py-4 text-center">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {formatPrice(pricing.finalExhibitionPrice)}
                                </div>
                                {pricing.hasCustomExhibitionPrice ? (
                                  <div className="text-xs text-blue-600">Custom exhibition price</div>
                                ) : pricing.hasExhibitionDiscount ? (
                                  <div className="text-xs text-red-600">
                                    Exhibition clearance (-{pricing.exhibitionDiscount}%)
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500">Same as customer price</div>
                                )}
                              </div>
                            </td>

                            {/* ✅ FIXED: Pricing Status - Summary of all discounts */}
                            <td className="px-6 py-4 text-center">
                              <div className="space-y-1">
                                {/* Store discount badge */}
                                {pricing.hasStoreDiscount && (
                                  <div>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      Store: {pricing.storeDiscount}% OFF
                                    </span>
                                  </div>
                                )}
                                
                                {/* Exhibition discount badge */}
                                {pricing.hasExhibitionDiscount && (
                                  <div>
                                    <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                      Exhibition: {pricing.exhibitionDiscount}% OFF
                                    </span>
                                  </div>
                                )}
                                
                                {/* Custom price badge */}
                                {pricing.hasCustomExhibitionPrice && !pricing.hasExhibitionDiscount && (
                                  <div>
                                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                      Custom Price
                                    </span>
                                  </div>
                                )}
                                
                                {/* No discounts */}
                                {!pricing.hasStoreDiscount && !pricing.hasExhibitionDiscount && !pricing.hasCustomExhibitionPrice && (
                                  <span className="text-xs text-gray-500">Regular pricing</span>
                                )}
                                
                                {/* Total savings summary */}
                                {pricing.totalSavings > 0 && (
                                  <div className="text-xs text-green-600 mt-1 font-medium">
                                    Total saves: {formatPrice(pricing.totalSavings)}
                                  </div>
                                )}
                              </div>
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
                                    variant="outline"
                                    onClick={() => handleEdit(exhibitionProduct)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenPricingModal(exhibitionProduct)}
                                  >
                                    <Tag className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveProduct(exhibitionProduct.id, exhibitionProduct.product.name)}
                                  className="text-red-600 hover:text-red-700"
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

      {/* Pricing Summary Card - Only shown on pricing tab */}
      {activeTab === 'pricing' && pricingSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Original Value</div>
                <div className="text-xl font-bold">
                  {formatPrice(pricingSummary.totalOriginalValue)}
                </div>
                <div className="text-xs text-gray-500">Before all discounts</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Customer Value</div>
                <div className="text-xl font-bold text-green-600">
                  {formatPrice(pricingSummary.totalCustomerValue)}
                </div>
                <div className="text-xs text-green-600">What customers pay</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Savings</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatPrice(pricingSummary.totalSavings)}
                </div>
                <div className="text-xs text-blue-600">
                  {((pricingSummary.totalSavings / pricingSummary.totalOriginalValue) * 100).toFixed(1)}% off
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Special Pricing</div>
                <div className="text-xl font-bold text-purple-600">
                  {pricingSummary.clearanceProducts + pricingSummary.customPricedProducts}
                </div>
                <div className="text-xs text-purple-600">
                  {pricingSummary.clearanceProducts} clearance, {pricingSummary.customPricedProducts} custom
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Add Products to Exhibition</h3>
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Products</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Search by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="product">Select Product *</Label>
                    <select
                      id="product"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a product...</option>
                      {filteredAvailableProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.sku} ({formatPrice(product.sellingPriceUSD)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity to Take *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={addQuantityTaken}
                      onChange={(e) => setAddQuantityTaken(parseInt(e.target.value) || 1)}
                      min="1"
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Selected Product Preview */}
                {selectedProductId && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {(() => {
                      const product = availableProducts.find(p => p.id === selectedProductId)
                      if (!product) return null
                      
                      const storeOriginalPrice = product.discountPercentage > 0 
                        ? product.sellingPriceUSD / (1 - product.discountPercentage / 100)
                        : product.sellingPriceUSD
                      
                      return (
                        <div className="flex items-center gap-4">
                          <ProductImage 
                            images={product.images} 
                            name={product.name}
                            className="h-16 w-16"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600">SKU: {product.sku} • {product.category.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {product.discountPercentage > 0 ? (
                                <>
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(product.sellingPriceUSD)}
                                  </span>
                                  <span className="text-sm font-medium text-green-600">
                                    {formatPrice(product.sellingPriceUSD * (1 - product.discountPercentage / 100))}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    {product.discountPercentage}% OFF
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-medium">
                                  {formatPrice(product.sellingPriceUSD)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Stock: {product.stockQuantity}</div>
                            <div className="text-sm font-medium">
                              Total: {formatPrice(product.sellingPriceUSD * addQuantityTaken)}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} disabled={!selectedProductId || addQuantityTaken <= 0 || loading}>
                  {loading ? 'Adding...' : 'Add to Exhibition'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Edit Exhibition Pricing</h3>
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
                    Leave empty to use store price. Set a custom price for this exhibition.
                  </p>
                </div>

                {/* Clearance Toggle */}
                <div className="flex items-center gap-3">
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
                  <div>
                    <Label htmlFor="isClearance">Mark as Exhibition Clearance</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Apply additional exhibition discount on top of any existing store discount
                    </p>
                  </div>
                  <Tag className="h-5 w-5 text-red-600" />
                </div>

                {/* Clearance Discount */}
                {pricingData.isClearance && (
                  <div>
                    <Label htmlFor="discountPercentage">Exhibition Clearance Discount (%)</Label>
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
                      placeholder="Additional discount percentage for exhibition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This discount will be applied on top of the exhibition price
                    </p>
                  </div>
                )}

                {/* Price Preview */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Pricing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const product = availableProducts.find(p => 
                        exhibitionProducts.find(ep => ep.id === pricingProductId)?.productId === p.id
                      )
                      if (!product) return null
                      
                      const storeOriginalPrice = product.discountPercentage > 0 
                        ? product.sellingPriceUSD  // $104.04 (original price)
                        : product.sellingPriceUSD
                      
                      const customerFinalPrice = product.discountPercentage > 0
                        ? product.sellingPriceUSD * (1 - product.discountPercentage / 100)  // $93.64
                        : product.sellingPriceUSD
                      
                      const exhibitionPrice = pricingData.exhibitionPrice || customerFinalPrice
                      const finalPrice = pricingData.isClearance && pricingData.discountPercentage > 0
                        ? exhibitionPrice * (1 - pricingData.discountPercentage / 100)
                        : exhibitionPrice
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Store Original Price:</span>
                            <span className="font-medium">{formatPrice(storeOriginalPrice)}</span>
                          </div>
                          {product.discountPercentage > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span>Store Discount ({product.discountPercentage}%):</span>
                              <span>-{formatPrice(storeOriginalPrice - customerFinalPrice)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Customer Pays:</span>
                            <span className="font-medium text-green-600">{formatPrice(customerFinalPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exhibition Price:</span>
                            <span className="font-medium">{formatPrice(exhibitionPrice)}</span>
                          </div>
                          {pricingData.isClearance && pricingData.discountPercentage > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Exhibition Clearance ({pricingData.discountPercentage}%):</span>
                              <span>-{formatPrice(exhibitionPrice - finalPrice)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Final Customer Price:</span>
                            <span className="text-green-600">{formatPrice(finalPrice)}</span>
                          </div>
                          {(product.discountPercentage > 0 || (pricingData.isClearance && pricingData.discountPercentage > 0)) && (
                            <div className="text-center text-sm text-green-600 font-medium">
                              Total Savings: {formatPrice(storeOriginalPrice - finalPrice)} 
                              ({(((storeOriginalPrice - finalPrice) / storeOriginalPrice) * 100).toFixed(1)}% off)
                            </div>
                          )}
                        </>
                      )
                    })()}
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowPricingModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePricing} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Pricing'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}