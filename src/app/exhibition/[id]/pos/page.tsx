// src/app/exhibition/[id]/pos/page.tsx
// =====================================
// 🚀 Complete Exhibition POS Interface with Barcode Scanner Integration
// Features: Mobile POS, Barcode scanning, SKU search, Quick add, Payment processing
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import BarcodeSearch from '@/components/exhibition/BarcodeSearch'
import { BarcodeResult } from '@/lib/barcode-lookup-working'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Scan,
  DollarSign,
  CreditCard,
  Smartphone,
  Users,
  Tag,
  Percent,
  CheckCircle,
  AlertCircle,
  Calculator,
  Receipt,
  ArrowLeft,
  X,
  Zap,
  TrendingDown,
  Package,
  Clock,
  User,
  Phone,
  Mail
} from 'lucide-react'

import {
  ExhibitionProduct,
  CartItem,
  PaymentMethod,
  Exhibition,
  CartTotals,
  SaleData,
  PaymentDetails,
  calculateAvailableStock,
  calculateFinalPrice,
  hasStock,
  formatPrice as formatPriceUtil
} from '@/types/exhibition-pos'

interface POSProps {
  params: {
    id: string
  }
}

export default function ExhibitionPOS({ params }: POSProps) {
  const router = useRouter()
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [products, setProducts] = useState<ExhibitionProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Product selection and cart
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false)
  const [quickAddMode, setQuickAddMode] = useState(false)

  // Customer information
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  // Payment and discounts
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [customDiscount, setCustomDiscount] = useState(0)
  const [bundleDiscount, setBundleDiscount] = useState(0)
  const [bargainReason, setBargainReason] = useState('')
  const [salesNotes, setSalesNotes] = useState('')

  // Split payment amounts
  const [cashAmount, setCashAmount] = useState(0)
  const [zelleAmount, setZelleAmount] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Load exhibition and products data
  useEffect(() => {
    loadExhibitionData()
  }, [params.id])

  const loadExhibitionData = async () => {
    try {
      setLoading(true)

      // Load products for this exhibition (this will also give us exhibition info)
      const productsResponse = await fetch(`/api/exhibition/${params.id}/inventory?includeOutOfStock=false`)
      if (!productsResponse.ok) {
        throw new Error('Failed to load exhibition data')
      }

      const productsData = await productsResponse.json()

      // Extract exhibition info from products response and ensure it matches Exhibition type
      const exhibitionInfo: Exhibition = {
        id: params.id,
        title: productsData.exhibition?.title || 'Exhibition',
        description: productsData.exhibition?.description || undefined,
        location: productsData.exhibition?.location || 'Unknown Location',
        startDate: productsData.exhibition?.startDate || new Date().toISOString(),
        endDate: productsData.exhibition?.endDate || new Date().toISOString(),
        participationFee: productsData.exhibition?.participationFee || 0,
        images: productsData.exhibition?.images || [],
        isActive: productsData.exhibition?.isActive ?? true,
        createdAt: productsData.exhibition?.createdAt || new Date().toISOString(),
        updatedAt: productsData.exhibition?.updatedAt || new Date().toISOString()
      }

      setExhibition(exhibitionInfo)
      setProducts(productsData.products || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle product found from barcode scanner
  const handleProductFoundFromScanner = (result: BarcodeResult) => {
    if (!result.found || !result.product) {
      setError('Product not found in barcode lookup')
      return
    }

    // Find the matching exhibition product from our products array
    const exhibitionProduct = products.find(p => p.productId === result.product?.id)

    if (exhibitionProduct) {
      addToCart(exhibitionProduct)
      setQuickAddMode(false)
      setShowBarcodeSearch(false)
    } else {
      setError('Product not found in this exhibition')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Handle scanner errors
  const handleScannerError = (error: string) => {
    setError(error)
    setTimeout(() => setError(''), 3000)
  }

  // Quick add mode toggle
  const toggleQuickAddMode = () => {
    setQuickAddMode(!quickAddMode)
    setShowBarcodeSearch(!showBarcodeSearch)
  }

  // Add product to cart
  const addToCart = (product: ExhibitionProduct, quantity: number = 1) => {
    const availableStock = calculateAvailableStock(product)

    if (availableStock <= 0) {
      setError(`${product.product.name} is out of stock`)
      return
    }

    // Check if product already in cart
    const existingItem = cart.find(item => item.exhibitionProductId === product.id)

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > availableStock) {
        setError(`Only ${availableStock} items available for ${product.product.name}`)
        return
      }

      updateCartQuantity(product.id, newQuantity)
    } else {
      if (quantity > availableStock) {
        setError(`Only ${availableStock} items available for ${product.product.name}`)
        return
      }

      // Calculate pricing using helper function
      const finalPrice = calculateFinalPrice(product)
      const originalPrice = product.originalPrice || product.product.sellingPriceUSD
      const exhibitionPrice = product.exhibitionPrice || originalPrice

      const newItem: CartItem = {
        exhibitionProductId: product.id,
        productId: product.productId,
        productName: product.product.name,
        productSku: product.product.sku,
        categoryName: product.product.category.name,
        originalPrice,
        exhibitionPrice,
        finalPrice,
        quantity,
        availableStock,
        priceBreakdown: {
          hasStoreDiscount: (product.product.discountPercentage || 0) > 0,
          hasExhibitionPrice: product.exhibitionPrice !== null,
          hasExhibitionDiscount: (product.discountPercentage || 0) > 0,
          storeDiscountPercent: product.product.discountPercentage || 0,
          exhibitionDiscountPercent: product.discountPercentage || 0
        }
      }

      setCart([...cart, newItem])
    }
  }

  // Update cart item quantity
  const updateCartQuantity = (exhibitionProductId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(exhibitionProductId)
      return
    }

    setCart(cart.map(item =>
      item.exhibitionProductId === exhibitionProductId
        ? { ...item, quantity: Math.min(newQuantity, item.availableStock) }
        : item
    ))
  }

  // Remove item from cart
  const removeFromCart = (exhibitionProductId: string) => {
    setCart(cart.filter(item => item.exhibitionProductId !== exhibitionProductId))
  }

  // Apply quick discount percentage
  const applyQuickDiscount = (percentage: number) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
    const discountAmount = subtotal * (percentage / 100)
    setCustomDiscount(discountAmount)
    setBargainReason(`${percentage}% discount applied`)
  }

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
    const totalDiscount = customDiscount + bundleDiscount
    const finalTotal = Math.max(0, subtotal - totalDiscount)

    return {
      subtotal,
      totalDiscount,
      finalTotal,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    }
  }, [cart, customDiscount, bundleDiscount])

  // Process payment
  const processPayment = async () => {
    try {
      setProcessingPayment(true)
      setError('')

      // Validate cart
      if (cart.length === 0) {
        setError('Cart is empty')
        return
      }

      // Validate split payment amounts
      if (paymentMethod === 'SPLIT_PAYMENT') {
        const totalPaid = cashAmount + zelleAmount + cardAmount
        if (Math.abs(totalPaid - cartTotals.finalTotal) > 0.01) {
          setError(`Split payment total (${totalPaid.toFixed(2)}) must equal order total (${cartTotals.finalTotal.toFixed(2)})`)
          return
        }
      }

      // Prepare sale data
      const saleData = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        subtotal: cartTotals.subtotal,
        tax: 0,
        discount: cartTotals.totalDiscount,
        total: cartTotals.finalTotal,
        paymentMethod: paymentMethod,
        paymentDetails: {
          cashAmount: paymentMethod === 'CASH' || paymentMethod === 'SPLIT_PAYMENT' ?
            (paymentMethod === 'CASH' ? cartTotals.finalTotal : cashAmount) : null,
          zelleAmount: paymentMethod === 'ZELLE' || paymentMethod === 'SPLIT_PAYMENT' ? zelleAmount : null,
          cardAmount: paymentMethod === 'CARD' || paymentMethod === 'SPLIT_PAYMENT' ? cardAmount : null,
          bargainApplied: customDiscount > 0 || bundleDiscount > 0,
          bargainReason: bargainReason || null,
          salesPersonNotes: salesNotes || null
        },
        items: cart.map(item => ({
          exhibitionProductId: item.exhibitionProductId,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          categoryName: item.categoryName,
          originalPrice: item.originalPrice,
          exhibitionPrice: item.exhibitionPrice,
          finalPrice: item.finalPrice,
          quantity: item.quantity,
          lineTotal: item.finalPrice * item.quantity
        }))
      }

      const response = await fetch(`/api/exhibition/${params.id}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process sale')
      }

      const result = await response.json()

      // Success - show receipt and reset
      alert(`Sale completed! Sale #${result.saleNumber}`)

      // Reset form
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setCustomDiscount(0)
      setBundleDiscount(0)
      setBargainReason('')
      setSalesNotes('')
      setShowCustomerForm(false)
      setShowPaymentForm(false)
      setCashAmount(0)
      setZelleAmount(0)
      setCardAmount(0)

      // Refresh product data
      loadExhibitionData()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingPayment(false)
    }
  }

  // Filter products for display
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product.sku.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === '' ||
      product.product.category.name === selectedCategory

    return matchesSearch && matchesCategory && hasStock(product)
  })

  // Get unique categories
  const categories = [...new Set(products.map(p => p.product.category.name))].sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS system...</p>
        </div>
      </div>
    )
  }

  if (!exhibition) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Exhibition not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">{exhibition.title}</h1>
                <p className="text-sm text-gray-600">Point of Sale</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Add Toggle */}
              <Button
                variant={quickAddMode ? "default" : "outline"}
                size="sm"
                onClick={toggleQuickAddMode}
                className="flex items-center gap-2"
              >
                <Scan className="h-4 w-4" />
                {quickAddMode ? "Exit Scan" : "Quick Add"}
              </Button>

              {/* Cart Summary */}
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError('')}
              className="absolute right-2 top-2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 p-4">
        {/* Left Column: Product Selection */}
        <div className="space-y-4">
          {/* Barcode Scanner Section */}
          {quickAddMode && (
            <BarcodeSearch
              exhibitionId={params.id}
              products={products}
              onProductFound={handleProductFoundFromScanner}
              onError={handleScannerError}
            />
          )}

          {/* Traditional Product Search */}
          {!quickAddMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Browse Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filters */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleQuickAddMode}
                    className="shrink-0"
                  >
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={selectedCategory === '' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory('')}
                      className="shrink-0"
                    >
                      All
                    </Button>
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="shrink-0"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Products Grid */}
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const availableStock = calculateAvailableStock(product)
                    const finalPrice = calculateFinalPrice(product)
                    const originalPrice = product.originalPrice || product.product.sellingPriceUSD

                    // Get the first image or use a placeholder
                    const productImage = product.product.images && product.product.images.length > 0
                      ? product.product.images[0]
                      : null

                    return (
                      <div
                        key={product.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* Product Header with Image */}
                        <div className="flex gap-3 mb-3">
                          {/* Product Image */}
                          <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            {productImage ? (
                              <>
                                <img
                                  src={productImage}
                                  alt={product.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to placeholder if image fails to load
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const fallback = target.nextElementSibling as HTMLElement
                                    if (fallback) {
                                      fallback.classList.remove('hidden')
                                    }
                                  }}
                                />
                                {/* Fallback Icon (hidden by default when image exists) */}
                                <div className="hidden w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                  <Package className="h-6 w-6" />
                                </div>
                              </>
                            ) : (
                              /* No image URL - show placeholder immediately */
                              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {product.product.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  SKU: {product.product.sku}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Stock: {availableStock}
                                </p>
                              </div>

                              <div className="text-right ml-3">
                                <p className="font-bold text-sm">
                                  {formatPriceUtil(finalPrice)}
                                </p>
                                {originalPrice !== finalPrice && (
                                  <p className="text-xs text-gray-400 line-through">
                                    {formatPriceUtil(originalPrice)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Product Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {product.product.category.name}
                            </Badge>
                            {product.isClearance && (
                              <Badge variant="destructive" className="text-xs">
                                Clearance
                              </Badge>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => addToCart(product)}
                            disabled={availableStock <= 0}
                            className="h-7 px-3"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No products found</p>
                    {searchQuery && (
                      <p className="text-sm">Try adjusting your search</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Shopping Cart & Checkout */}
        <div className="space-y-4">
          {/* Shopping Cart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Shopping Cart ({cart.length})
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCart([])}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm">
                    {quickAddMode ? "Scan or search for products" : "Add products to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {cart.map((item) => {
                    // Find the original product to get image
                    const originalProduct = products.find(p => p.id === item.exhibitionProductId)
                    const productImage = originalProduct?.product.images && originalProduct.product.images.length > 0
                      ? originalProduct.product.images[0]
                      : null

                    return (
                      <div key={item.exhibitionProductId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {/* Product Image */}
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          {/* Fallback Icon */}
                          <div className={`w-full h-full flex items-center justify-center text-gray-400 ${productImage ? 'hidden' : ''}`}>
                            <Package className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                          <p className="text-xs text-gray-500">SKU: {item.productSku}</p>
                          <p className="text-xs font-medium text-green-600">
                            {formatPriceUtil(item.finalPrice)} each
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.exhibitionProductId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.exhibitionProductId, item.quantity + 1)}
                            disabled={item.quantity >= item.availableStock}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.exhibitionProductId)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Totals & Checkout */}
          {cart.length > 0 && (
            <>
              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({cartTotals.itemCount} items)</span>
                      <span>${cartTotals.subtotal.toFixed(2)}</span>
                    </div>

                    {customDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Custom Discount</span>
                        <span>-${customDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {bundleDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Bundle Discount</span>
                        <span>-${bundleDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${cartTotals.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quick Discount Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[5, 10, 15, 20].map(discount => (
                      <Button
                        key={discount}
                        variant="outline"
                        size="sm"
                        onClick={() => applyQuickDiscount(discount)}
                        className="text-xs"
                      >
                        -{discount}%
                      </Button>
                    ))}
                  </div>

                  {/* Proceed to Checkout */}
                  <Button
                    onClick={() => setShowCustomerForm(true)}
                    className="w-full mt-4"
                    size="lg"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Customer Information
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomerForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customDiscount">Custom Discount ($)</Label>
                <Input
                  id="customDiscount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bargainReason">Discount Reason</Label>
                <Input
                  id="bargainReason"
                  value={bargainReason}
                  onChange={(e) => setBargainReason(e.target.value)}
                  placeholder="Reason for discount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesNotes">Sales Notes</Label>
                <Textarea
                  id="salesNotes"
                  value={salesNotes}
                  onChange={(e) => setSalesNotes(e.target.value)}
                  placeholder="Add any sales notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowCustomerForm(false)
                    setShowPaymentForm(true)
                  }}
                  className="flex-1"
                >
                  Continue to Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Payment Method
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${cartTotals.subtotal.toFixed(2)}</span>
                </div>
                {cartTotals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Total Discount:</span>
                    <span>-${cartTotals.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${cartTotals.finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Select Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'CASH' ? "default" : "outline"}
                    onClick={() => setPaymentMethod('CASH')}
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'ZELLE' ? "default" : "outline"}
                    onClick={() => setPaymentMethod('ZELLE')}
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Zelle
                  </Button>
                  <Button
                    variant={paymentMethod === 'CARD' ? "default" : "outline"}
                    onClick={() => setPaymentMethod('CARD')}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'SPLIT_PAYMENT' ? "default" : "outline"}
                    onClick={() => setPaymentMethod('SPLIT_PAYMENT')}
                    className="flex items-center gap-2"
                  >
                    <Tag className="h-4 w-4" />
                    Split
                  </Button>
                </div>
              </div>

              {/* Split Payment Details */}
              {paymentMethod === 'SPLIT_PAYMENT' && (
                <div className="space-y-3 p-3 border rounded-lg">
                  <Label className="text-sm font-medium">Split Payment Amounts</Label>

                  <div className="space-y-2">
                    <Label htmlFor="cashAmount" className="text-xs">Cash Amount</Label>
                    <Input
                      id="cashAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zelleAmount" className="text-xs">Zelle Amount</Label>
                    <Input
                      id="zelleAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={zelleAmount}
                      onChange={(e) => setZelleAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardAmount" className="text-xs">Card Amount</Label>
                    <Input
                      id="cardAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <div className="flex justify-between">
                      <span>Total Entered:</span>
                      <span>${(cashAmount + zelleAmount + cardAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Total:</span>
                      <span>${cartTotals.finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Difference:</span>
                      <span className={
                        Math.abs((cashAmount + zelleAmount + cardAmount) - cartTotals.finalTotal) < 0.01
                          ? "text-green-600"
                          : "text-red-600"
                      }>
                        ${((cashAmount + zelleAmount + cardAmount) - cartTotals.finalTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Info Summary */}
              {(customerName || customerPhone) && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Customer Details</h4>
                  {customerName && (
                    <p className="text-xs flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {customerName}
                    </p>
                  )}
                  {customerPhone && (
                    <p className="text-xs flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {customerPhone}
                    </p>
                  )}
                  {customerEmail && (
                    <p className="text-xs flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {customerEmail}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1"
                  disabled={processingPayment}
                >
                  Back
                </Button>
                <Button
                  onClick={processPayment}
                  className="flex-1"
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Complete Sale
                    </>
                  )}
                </Button>
              </div>

              {/* Payment Instructions */}
              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                {paymentMethod === 'CASH' && "Collect cash payment from customer"}
                {paymentMethod === 'ZELLE' && "Request customer to send Zelle payment"}
                {paymentMethod === 'CARD' && "Process card payment using terminal"}
                {paymentMethod === 'SPLIT_PAYMENT' && "Collect multiple payment methods as specified"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}