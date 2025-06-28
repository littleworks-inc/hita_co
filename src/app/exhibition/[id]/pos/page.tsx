// src/app/exhibition/[id]/pos/page.tsx
// =====================================
// Exhibition POS Interface - Mobile Sales Processing
// Handles product selection, pricing, discounts, and payment processing
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
  X
} from 'lucide-react'

// Types based on database schema
interface ExhibitionProduct {
  id: string
  productId: string
  quantityTaken: number
  quantitySold: number
  exhibitionPrice?: number
  originalPrice?: number
  discountPercentage?: number
  isClearance: boolean
  product: {
    id: string
    name: string
    sku: string
    sellingPriceUSD: number
    discountPercentage: number
    images: string[]
    stockQuantity: number
    category: { name: string }
    country: { name: string }
  }
}

interface CartItem {
  exhibitionProductId: string
  productId: string
  productName: string
  productSku: string
  categoryName: string
  originalPrice: number
  exhibitionPrice: number
  finalPrice: number
  quantity: number
  availableStock: number
  priceBreakdown: {
    hasStoreDiscount: boolean
    hasExhibitionPrice: boolean
    hasExhibitionDiscount: boolean
    storeDiscountPercent: number
    exhibitionDiscountPercent: number
  }
}

interface POSProps {
  params: {
    id: string
  }
}

export default function ExhibitionPOS({ params }: POSProps) {
  const router = useRouter()
  const [exhibition, setExhibition] = useState<any>(null)
  const [products, setProducts] = useState<ExhibitionProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Product selection and cart
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')

  // Customer information
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  // Payment and discounts
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ZELLE' | 'CARD' | 'SPLIT_PAYMENT'>('CASH')
  const [customDiscount, setCustomDiscount] = useState(0)
  const [bundleDiscount, setBundleDiscount] = useState(0)
  const [bargainReason, setBargainReason] = useState('')
  const [salesNotes, setSalesNotes] = useState('')

  // Split payment amounts
  const [cashAmount, setCashAmount] = useState(0)
  const [zelleAmount, setZelleAmount] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)

  // UI states
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  // Load exhibition and products
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/exhibition/${params.id}/inventory`)
        if (!response.ok) throw new Error('Failed to load exhibition data')
        
        const data = await response.json()
        setExhibition(data.exhibition)
        setProducts(data.products)
      } catch (err) {
        setError('Failed to load exhibition data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [params.id])

  // Calculate pricing for each product
  const calculateProductPricing = (exhibitionProduct: ExhibitionProduct) => {
    const product = exhibitionProduct.product
    
    // Original store price (before any discounts)
    const originalStorePrice = product.discountPercentage > 0 
      ? product.sellingPriceUSD / (1 - product.discountPercentage / 100)
      : product.sellingPriceUSD
    
    // Current store price (with store discount applied)
    const currentStorePrice = product.sellingPriceUSD
    
    // Exhibition price (custom or defaults to store price)
    const exhibitionPrice = exhibitionProduct.exhibitionPrice || currentStorePrice
    
    // Final price after exhibition clearance discount
    const finalPrice = exhibitionProduct.isClearance && exhibitionProduct.discountPercentage
      ? exhibitionPrice * (1 - exhibitionProduct.discountPercentage / 100)
      : exhibitionPrice
    
    return {
      originalPrice: originalStorePrice,
      exhibitionPrice,
      finalPrice,
      hasStoreDiscount: (product.discountPercentage || 0) > 0,
      hasExhibitionPrice: exhibitionProduct.exhibitionPrice && exhibitionProduct.exhibitionPrice !== currentStorePrice,
      hasExhibitionDiscount: exhibitionProduct.isClearance && (exhibitionProduct.discountPercentage || 0) > 0,
      storeDiscountPercent: product.discountPercentage || 0,
      exhibitionDiscountPercent: exhibitionProduct.discountPercentage || 0
    }
  }

  // Filter products for search
  const filteredProducts = useMemo(() => {
    return products.filter(ep => {
      const product = ep.product
      const availableStock = ep.quantityTaken - ep.quantitySold
      
      // Only show products with available stock
      if (availableStock <= 0) return false
      
      // Search filter
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Category filter
      const matchesCategory = !selectedCategory || product.category.name === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(ep => ep.product.category.name))]
    return cats.sort()
  }, [products])

  // Add product to cart
  const addToCart = (exhibitionProduct: ExhibitionProduct, quantity: number = 1) => {
    const pricing = calculateProductPricing(exhibitionProduct)
    const availableStock = exhibitionProduct.quantityTaken - exhibitionProduct.quantitySold
    
    // Check if already in cart
    const existingItem = cart.find(item => item.exhibitionProductId === exhibitionProduct.id)
    
    if (existingItem) {
      // Update quantity if there's stock
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity <= availableStock) {
        setCart(cart.map(item => 
          item.exhibitionProductId === exhibitionProduct.id
            ? { ...item, quantity: newQuantity }
            : item
        ))
      }
    } else {
      // Add new item
      if (quantity <= availableStock) {
        const cartItem: CartItem = {
          exhibitionProductId: exhibitionProduct.id,
          productId: exhibitionProduct.product.id,
          productName: exhibitionProduct.product.name,
          productSku: exhibitionProduct.product.sku,
          categoryName: exhibitionProduct.product.category.name,
          originalPrice: pricing.originalPrice,
          exhibitionPrice: pricing.exhibitionPrice,
          finalPrice: pricing.finalPrice,
          quantity,
          availableStock,
          priceBreakdown: {
            hasStoreDiscount: pricing.hasStoreDiscount,
            hasExhibitionPrice: pricing.hasExhibitionPrice,
            hasExhibitionDiscount: pricing.hasExhibitionDiscount,
            storeDiscountPercent: pricing.storeDiscountPercent,
            exhibitionDiscountPercent: pricing.exhibitionDiscountPercent
          }
        }
        setCart([...cart, cartItem])
      }
    }
  }

  // Remove from cart
  const removeFromCart = (exhibitionProductId: string) => {
    setCart(cart.filter(item => item.exhibitionProductId !== exhibitionProductId))
  }

  // Update cart item quantity
  const updateCartQuantity = (exhibitionProductId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(exhibitionProductId)
      return
    }
    
    setCart(cart.map(item => {
      if (item.exhibitionProductId === exhibitionProductId) {
        return { ...item, quantity: Math.min(newQuantity, item.availableStock) }
      }
      return item
    }))
  }

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
    const totalDiscount = customDiscount + bundleDiscount
    const finalTotal = Math.max(0, subtotal - totalDiscount)
    
    return { subtotal, totalDiscount, finalTotal }
  }, [cart, customDiscount, bundleDiscount])

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    // Validate split payment if selected
    if (paymentMethod === 'SPLIT_PAYMENT') {
      const totalPaid = cashAmount + zelleAmount + cardAmount
      if (Math.abs(totalPaid - cartTotals.finalTotal) > 0.01) {
        setError('Split payment amounts must equal the total')
        return
      }
    }

    setProcessingPayment(true)
    setError('')

    try {
      const saleData = {
        exhibitionId: params.id,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        subtotal: cartTotals.subtotal,
        customDiscount,
        bundleDiscount,
        finalTotal: cartTotals.finalTotal,
        paymentMethod,
        cashAmount: paymentMethod === 'CASH' || paymentMethod === 'SPLIT_PAYMENT' ? cashAmount || cartTotals.finalTotal : null,
        zelleAmount: paymentMethod === 'ZELLE' || paymentMethod === 'SPLIT_PAYMENT' ? zelleAmount : null,
        cardAmount: paymentMethod === 'CARD' || paymentMethod === 'SPLIT_PAYMENT' ? cardAmount : null,
        bargainApplied: customDiscount > 0 || bundleDiscount > 0,
        bargainReason: bargainReason || null,
        salesPersonNotes: salesNotes || null,
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
      
      // Refresh product data
      window.location.reload()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingPayment(false)
    }
  }

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
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exhibition Not Found</h2>
          <p className="text-gray-600 mb-4">The exhibition could not be loaded.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
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
              <h1 className="text-lg font-semibold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600">{exhibition.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {cart.length} items
            </Badge>
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              {formatPrice(cartTotals.finalTotal, 'USD')}
            </Badge>
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

      <div className="grid lg:grid-cols-2 gap-6 p-4">
        {/* Left Column - Product Selection */}
        <div className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                >
                  All Categories
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Barcode Scanner Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowBarcodeScanner(true)}
              >
                <Scan className="w-4 h-4 mr-2" />
                Scan Barcode
              </Button>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {filteredProducts.map(exhibitionProduct => {
              const pricing = calculateProductPricing(exhibitionProduct)
              const availableStock = exhibitionProduct.quantityTaken - exhibitionProduct.quantitySold
              const product = exhibitionProduct.product
              
              return (
                <Card key={exhibitionProduct.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Product Image */}
                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>SKU: {product.sku}</span>
                        <span>{availableStock} available</span>
                      </div>

                      {/* Price Display */}
                      <div className="space-y-1">
                        {pricing.hasStoreDiscount && (
                          <div className="text-xs text-gray-500">
                            <span className="line-through">
                              {formatPrice(pricing.originalPrice, 'USD')}
                            </span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                              -{pricing.storeDiscountPercent}%
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(pricing.finalPrice, 'USD')}
                            </span>
                            {pricing.hasExhibitionDiscount && (
                              <Badge variant="destructive" className="ml-1 text-xs">
                                Clearance
                              </Badge>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => addToCart(exhibitionProduct)}
                            disabled={availableStock <= 0}
                            className="px-3"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Products Found</h3>
              <p className="text-gray-500">
                {searchQuery || selectedCategory 
                  ? 'Try adjusting your search or filters'
                  : 'No products available for sale'
                }
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Cart and Checkout */}
        <div className="space-y-4">
          {/* Shopping Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Shopping Cart
                </span>
                {cart.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCart([])}
                  >
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Cart is empty</p>
                  <p className="text-sm text-gray-400">Add products to start a sale</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.exhibitionProductId} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {item.productName}
                        </h4>
                        <p className="text-xs text-gray-500">SKU: {item.productSku}</p>
                        
                        {/* Price breakdown */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium">
                            {formatPrice(item.finalPrice, 'USD')}
                          </span>
                          {item.priceBreakdown.hasStoreDiscount && (
                            <Badge variant="secondary" className="text-xs">
                              Store -{item.priceBreakdown.storeDiscountPercent}%
                            </Badge>
                          )}
                          {item.priceBreakdown.hasExhibitionDiscount && (
                            <Badge variant="destructive" className="text-xs">
                              Clearance
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.exhibitionProductId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.exhibitionProductId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatPrice(item.finalPrice * item.quantity, 'USD')}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.exhibitionProductId)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Totals and Discounts */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(cartTotals.subtotal, 'USD')}</span>
                </div>

                {/* Custom Discount */}
                <div className="space-y-2">
                  <Label htmlFor="customDiscount">Custom Discount ($)</Label>
                  <Input
                    id="customDiscount"
                    type="number"
                    step="0.01"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                {/* Bundle Discount */}
                <div className="space-y-2">
                  <Label htmlFor="bundleDiscount">Bundle/Negotiation Discount ($)</Label>
                  <Input
                    id="bundleDiscount"
                    type="number"
                    step="0.01"
                    value={bundleDiscount}
                    onChange={(e) => setBundleDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                {/* Bargain Reason */}
                {(customDiscount > 0 || bundleDiscount > 0) && (
                  <div className="space-y-2">
                    <Label htmlFor="bargainReason">Discount Reason</Label>
                    <Input
                      id="bargainReason"
                      value={bargainReason}
                      onChange={(e) => setBargainReason(e.target.value)}
                      placeholder="Why was discount given?"
                    />
                  </div>
                )}

                {/* Total Discount */}
                {cartTotals.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Total Discount:</span>
                    <span>-{formatPrice(cartTotals.totalDiscount, 'USD')}</span>
                  </div>
                )}

                {/* Final Total */}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(cartTotals.finalTotal, 'USD')}</span>
                </div>

                {/* Customer Information Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCustomerForm(!showCustomerForm)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {showCustomerForm ? 'Hide' : 'Add'} Customer Info
                </Button>

                {/* Customer Form */}
                {showCustomerForm && (
                  <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
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
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                )}

                {/* Sales Notes */}
                <div className="space-y-2">
                  <Label htmlFor="salesNotes">Sales Notes (Optional)</Label>
                  <Textarea
                    id="salesNotes"
                    value={salesNotes}
                    onChange={(e) => setSalesNotes(e.target.value)}
                    placeholder="Internal notes about this sale..."
                    rows={2}
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CASH')}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Cash
                    </Button>
                    <Button
                      variant={paymentMethod === 'ZELLE' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('ZELLE')}
                      className="flex items-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      Zelle
                    </Button>
                    <Button
                      variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('CARD')}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </Button>
                    <Button
                      variant={paymentMethod === 'SPLIT_PAYMENT' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('SPLIT_PAYMENT')}
                      className="flex items-center gap-2"
                    >
                      <Tag className="w-4 h-4" />
                      Split
                    </Button>
                  </div>
                </div>

                {/* Split Payment Details */}
                {paymentMethod === 'SPLIT_PAYMENT' && (
                  <div className="space-y-3 p-3 border rounded-lg bg-blue-50">
                    <h4 className="font-medium text-sm">Split Payment Amounts</h4>
                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="cashAmount">Cash Amount</Label>
                        <Input
                          id="cashAmount"
                          type="number"
                          step="0.01"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="zelleAmount">Zelle Amount</Label>
                        <Input
                          id="zelleAmount"
                          type="number"
                          step="0.01"
                          value={zelleAmount}
                          onChange={(e) => setZelleAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cardAmount">Card Amount</Label>
                        <Input
                          id="cardAmount"
                          type="number"
                          step="0.01"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex justify-between text-sm font-medium border-t pt-2">
                        <span>Total Paid:</span>
                        <span>{formatPrice(cashAmount + zelleAmount + cardAmount, 'USD')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Amount Due:</span>
                        <span className={cartTotals.finalTotal === (cashAmount + zelleAmount + cardAmount) ? 'text-green-600' : 'text-red-600'}>
                          {formatPrice(cartTotals.finalTotal, 'USD')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Process Sale Button */}
                <Button
                  className="w-full h-12 text-lg font-medium"
                  onClick={processSale}
                  disabled={processingPayment || cart.length === 0}
                >
                  {processingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Complete Sale • {formatPrice(cartTotals.finalTotal, 'USD')}
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  Barcode Scanner
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBarcodeScanner(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Barcode Scanner
              </h3>
              <p className="text-gray-600 mb-4">
                Camera-based barcode scanning would be implemented here using a library like QuaggaJS or ZXing.
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="Or manually enter barcode/SKU"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const sku = e.currentTarget.value
                      const product = products.find(ep => ep.product.sku === sku)
                      if (product) {
                        addToCart(product)
                        setShowBarcodeScanner(false)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowBarcodeScanner(false)}
                >
                  Close Scanner
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}