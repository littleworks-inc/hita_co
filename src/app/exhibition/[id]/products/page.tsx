// src/app/exhibition/[id]/products/page.tsx
// =====================================
// Exhibition Products Inventory - Mobile Staff Interface
// View and manage exhibition stock, pricing, and product performance
// =====================================

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Package,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  BarChart3,
  DollarSign,
  Tag,
  Percent,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  Info
} from 'lucide-react'

// Types based on API response
interface ExhibitionProduct {
  id: string
  exhibitionId: string
  quantityTaken: number
  quantitySold: number
  availableStock: number
  exhibitionPrice?: number
  originalPrice?: number
  discountPercentage?: number
  isClearance: boolean
  salesNotes?: string
  lastSaleDate?: string
  priceChangedAt?: string
  pricing: {
    originalStorePrice: number
    currentStorePrice: number
    exhibitionPrice: number
    finalPrice: number
    totalSavings: number
    totalDiscountPercent: number
    hasStoreDiscount: boolean
    hasExhibitionPrice: boolean
    hasExhibitionDiscount: boolean
    storeDiscountPercent: number
    exhibitionDiscountPercent: number
  }
  product: {
    id: string
    name: string
    sku: string
    description?: string
    shortDescription?: string
    images: string[]
    sellingPriceUSD: number
    discountPercentage: number
    stockQuantity: number
    tags: string[]
    barcode?: string
    barcodeType?: string
    category: {
      id: string
      name: string
    }
    country: {
      id: string
      name: string
      currencySymbol: string
    }
  }
}

interface ProductsData {
  exhibition: {
    id: string
    title: string
    description?: string
    location: string
    startDate: string
    endDate: string
    isActive: boolean
  }
  products: ExhibitionProduct[]
  summary: {
    totalProducts: number
    totalAvailableStock: number
    totalValue: number
    categoriesCount: number
    clearanceProducts: number
    customPricedProducts: number
    outOfStockProducts: number
  }
  categories: string[]
}

interface ProductsInventoryProps {
  params: {
    id: string
  }
}

export default function ExhibitionProductsInventory({ params }: ProductsInventoryProps) {
  const router = useRouter()
  const [productsData, setProductsData] = useState<ProductsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [pricingFilter, setPricingFilter] = useState<'all' | 'clearance' | 'custom_price' | 'store_price'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'sales' | 'price'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)

  // View modes
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Load products data
  const loadProductsData = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    setError('')

    try {
      const queryParams = new URLSearchParams()
      queryParams.set('includeOutOfStock', 'true')
      
      if (categoryFilter) queryParams.set('category', categoryFilter)
      if (searchQuery) queryParams.set('search', searchQuery)

      const response = await fetch(`/api/exhibition/${params.id}/products?${queryParams}`)
      if (!response.ok) throw new Error('Failed to load products data')
      
      const data = await response.json()
      setProductsData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load products data')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadProductsData()
  }, [params.id])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!productsData) return []

    let filtered = productsData.products.filter(product => {
      // Search filter
      const matchesSearch = !searchQuery || (
        product.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )

      // Category filter
      const matchesCategory = !categoryFilter || product.product.category.name === categoryFilter

      // Stock filter
      const matchesStock = (() => {
        switch (stockFilter) {
          case 'in_stock': return product.availableStock > 5
          case 'low_stock': return product.availableStock > 0 && product.availableStock <= 5
          case 'out_of_stock': return product.availableStock === 0
          default: return true
        }
      })()

      // Pricing filter
      const matchesPricing = (() => {
        switch (pricingFilter) {
          case 'clearance': return product.isClearance
          case 'custom_price': return product.pricing.hasExhibitionPrice
          case 'store_price': return !product.pricing.hasExhibitionPrice && !product.isClearance
          default: return true
        }
      })()

      return matchesSearch && matchesCategory && matchesStock && matchesPricing
    })

    // Sort products
    filtered.sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'name':
          compareValue = a.product.name.localeCompare(b.product.name)
          break
        case 'stock':
          compareValue = a.availableStock - b.availableStock
          break
        case 'sales':
          compareValue = a.quantitySold - b.quantitySold
          break
        case 'price':
          compareValue = a.pricing.finalPrice - b.pricing.finalPrice
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    return filtered
  }, [productsData, searchQuery, categoryFilter, stockFilter, pricingFilter, sortBy, sortOrder])

  // Get stock status
  const getStockStatus = (availableStock: number) => {
    if (availableStock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    if (availableStock <= 5) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  }

  // Get performance indicator
  const getPerformanceIndicator = (quantityTaken: number, quantitySold: number) => {
    if (quantityTaken === 0) return { rate: 0, color: 'text-gray-500', icon: BarChart3 }
    
    const rate = (quantitySold / quantityTaken) * 100
    
    if (rate >= 75) return { rate, color: 'text-green-600', icon: TrendingUp }
    if (rate >= 50) return { rate, color: 'text-yellow-600', icon: BarChart3 }
    if (rate >= 25) return { rate, color: 'text-orange-600', icon: TrendingDown }
    return { rate, color: 'text-red-600', icon: TrendingDown }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product inventory...</p>
        </div>
      </div>
    )
  }

  if (!productsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Products</h2>
          <p className="text-gray-600 mb-4">There was an error loading the product inventory.</p>
          <Button onClick={() => loadProductsData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/exhibition`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Product Inventory</h1>
              <p className="text-sm text-gray-600">{productsData.exhibition.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProductsData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Inventory Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productsData.summary.totalProducts}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productsData.summary.totalAvailableStock}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(productsData.summary.totalValue, 'USD')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clearance Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productsData.summary.clearanceProducts}
                  </p>
                </div>
                <Tag className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters & Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, SKU, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={categoryFilter === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter('')}
                    >
                      All Categories
                    </Button>
                    {productsData.categories.map(category => (
                      <Button
                        key={category}
                        variant={categoryFilter === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Stock Filter */}
                <div className="space-y-2">
                  <Label>Stock Status</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'all', label: 'All Stock', icon: Package },
                      { value: 'in_stock', label: 'In Stock', icon: CheckCircle },
                      { value: 'low_stock', label: 'Low Stock', icon: AlertTriangle },
                      { value: 'out_of_stock', label: 'Out of Stock', icon: AlertTriangle }
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={stockFilter === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStockFilter(value as any)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pricing Filter */}
                <div className="space-y-2">
                  <Label>Pricing Type</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'all', label: 'All Pricing' },
                      { value: 'store_price', label: 'Store Price' },
                      { value: 'custom_price', label: 'Custom Price' },
                      { value: 'clearance', label: 'Clearance' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={pricingFilter === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPricingFilter(value as any)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'name', label: 'Name' },
                      { value: 'stock', label: 'Stock' },
                      { value: 'sales', label: 'Sales' },
                      { value: 'price', label: 'Price' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={sortBy === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (sortBy === value) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy(value as any)
                            setSortOrder('asc')
                          }
                        }}
                      >
                        {label} {sortBy === value && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedProducts.length} of {productsData.summary.totalProducts} products
          </p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredAndSortedProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500">
                {searchQuery || categoryFilter || stockFilter !== 'all' || pricingFilter !== 'all'
                  ? 'No products match your current filters'
                  : 'No products have been added to this exhibition yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProducts.map(product => {
              const stockStatus = getStockStatus(product.availableStock)
              const performance = getPerformanceIndicator(product.quantityTaken, product.quantitySold)
              const StockIcon = stockStatus.icon
              const PerformanceIcon = performance.icon

              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Product Image */}
                    <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {product.product.images?.[0] ? (
                        <img 
                          src={product.product.images[0]} 
                          alt={product.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
                          {product.product.name}
                        </h3>
                        {product.isClearance && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Clearance
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>SKU: {product.product.sku}</span>
                        <Badge className={`${stockStatus.color} text-xs`}>
                          <StockIcon className="w-3 h-3 mr-1" />
                          {product.availableStock}
                        </Badge>
                      </div>

                      {/* Pricing Display */}
                      <div className="space-y-1">
                        {product.pricing.hasStoreDiscount && (
                          <div className="text-xs text-gray-500">
                            <span className="line-through">
                              {formatPrice(product.pricing.originalStorePrice, 'USD')}
                            </span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                              -{product.pricing.storeDiscountPercent}%
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(product.pricing.finalPrice, 'USD')}
                            </span>
                            {product.pricing.hasExhibitionPrice && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                Custom
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">{product.quantitySold}</span>
                          <span className="text-gray-500">/{product.quantityTaken} sold</span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${performance.color}`}>
                          <PerformanceIcon className="w-3 h-3" />
                          <span className="font-medium">{performance.rate.toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Category & Last Sale */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Category: {product.product.category.name}</div>
                        {product.lastSaleDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last sale: {new Date(product.lastSaleDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* List View */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Sales
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedProducts.map(product => {
                      const stockStatus = getStockStatus(product.availableStock)
                      const performance = getPerformanceIndicator(product.quantityTaken, product.quantitySold)
                      const PerformanceIcon = performance.icon

                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {product.product.images?.[0] ? (
                                  <img 
                                    src={product.product.images[0]} 
                                    alt={product.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {product.product.name}
                                  </p>
                                  {product.isClearance && (
                                    <Badge variant="destructive" className="text-xs">
                                      Clearance
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {product.product.sku} • {product.product.category.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`${stockStatus.color} text-xs`}>
                              {product.availableStock}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm">
                              <span className="font-medium">{product.quantitySold}</span>
                              <span className="text-gray-500">/{product.quantityTaken}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm">
                              <div className="font-medium">
                                {formatPrice(product.pricing.finalPrice, 'USD')}
                              </div>
                              {product.pricing.totalSavings > 0 && (
                                <div className="text-xs text-red-600">
                                  -{formatPrice(product.pricing.totalSavings, 'USD')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className={`flex items-center justify-center gap-1 text-sm ${performance.color}`}>
                              <PerformanceIcon className="w-4 h-4" />
                              <span className="font-medium">{performance.rate.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Footer */}
        {filteredAndSortedProducts.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">
                      {filteredAndSortedProducts.filter(p => p.availableStock > 5).length}
                    </span>
                    <span className="text-gray-600">in stock</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">
                      {filteredAndSortedProducts.filter(p => p.availableStock > 0 && p.availableStock <= 5).length}
                    </span>
                    <span className="text-gray-600">low stock</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">
                      {filteredAndSortedProducts.filter(p => p.availableStock === 0).length}
                    </span>
                    <span className="text-gray-600">out of stock</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Value</div>
                    <div className="font-medium">
                      {formatPrice(
                        filteredAndSortedProducts.reduce((sum, p) => 
                          sum + (p.pricing.finalPrice * p.availableStock), 0
                        ), 
                        'USD'
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Avg. Sell-Through</div>
                    <div className="font-medium">
                      {filteredAndSortedProducts.length > 0 ? (
                        filteredAndSortedProducts
                          .reduce((sum, p) => {
                            const rate = p.quantityTaken > 0 ? (p.quantitySold / p.quantityTaken) * 100 : 0
                            return sum + rate
                          }, 0) / filteredAndSortedProducts.length
                      ).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card for Staff */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-900 mb-1">Exhibition Inventory Guide</h4>
                <div className="text-blue-800 space-y-1">
                  <p>• <strong>Stock Status:</strong> Green = plenty in stock, Yellow = running low, Red = sold out</p>
                  <p>• <strong>Performance:</strong> Shows sell-through rate (sold/taken) for each product</p>
                  <p>• <strong>Pricing:</strong> Final customer price includes all store and exhibition discounts</p>
                  <p>• <strong>Clearance:</strong> Items marked for additional exhibition discounts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}