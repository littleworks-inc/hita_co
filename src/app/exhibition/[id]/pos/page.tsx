// src/app/exhibition/[id]/pos/page.tsx
// =====================================
// 🚀 TASK 3 ENHANCED: Exhibition POS Interface - Mobile Sales Processing
// NEW FEATURES: Quick discount buttons, improved negotiation, enhanced mobile UX
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
  X,
  Zap,
  TrendingDown
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

  // 🚀 NEW: Task 3 Enhancement States
  const [activeDiscountMode, setActiveDiscountMode] = useState<'percentage' | 'custom' | 'manual'>('percentage')
  const [showDiscountSuccess, setShowDiscountSuccess] = useState(false)

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

  // 🚀 NEW: Quick Discount Application with Visual Feedback
  const applyQuickDiscount = (percentage: number) => {
    const discountAmount = cartTotals.subtotal * (percentage / 100)
    setBundleDiscount(discountAmount)
    setCustomDiscount(0) // Clear manual discount
    setBargainReason(`${percentage}% Quick Discount`)
    setActiveDiscountMode('percentage')
    
    // Show success feedback
    setShowDiscountSuccess(true)
    setTimeout(() => setShowDiscountSuccess(false), 2000)
  }

  // 🚀 NEW: Custom Total Handler - "Customer wants $X"
  const handleCustomerTotal = (customerWants: number) => {
    if (customerWants > 0 && customerWants < cartTotals.subtotal) {
      const discountAmount = cartTotals.subtotal - customerWants
      setBundleDiscount(discountAmount)
      setCustomDiscount(0)
      setBargainReason(`Customer negotiated to ${formatPrice(customerWants, 'USD')}`)
      setActiveDiscountMode('custom')
    }
  }

  // 🚀 NEW: Clear All Discounts
  const clearAllDiscounts = () => {
    setBundleDiscount(0)
    setCustomDiscount(0)
    setBargainReason('')
    setActiveDiscountMode('manual')
  }

  // Calculate pricing for each product (existing logic preserved)
  const calculateProductPricing = (exhibitionProduct: ExhibitionProduct) => {
    const product = exhibitionProduct.product
    
    const originalStorePrice = product.discountPercentage > 0 
      ? product.sellingPriceUSD / (1 - product.discountPercentage / 100)
      : product.sellingPriceUSD
    
    const currentStorePrice = product.sellingPriceUSD
    const exhibitionPrice = exhibitionProduct.exhibitionPrice || currentStorePrice
    
    const finalPrice = exhibitionProduct.isClearance && exhibitionProduct.discountPercentage
      ? exhibitionPrice * (1 - exhibitionProduct.discountPercentage / 100)
      : exhibitionPrice
    
    return {
      originalPrice: originalStorePrice,
      exhibitionPrice,
      finalPrice,
      hasStoreDiscount: product.discountPercentage > 0,
      hasExhibitionPrice: !!exhibitionProduct.exhibitionPrice,
      hasExhibitionDiscount: exhibitionProduct.isClearance && exhibitionProduct.discountPercentage > 0,
      storeDiscountPercent: product.discountPercentage || 0,
      exhibitionDiscountPercent: exhibitionProduct.discountPercentage || 0
    }
  }

  // Add to cart (existing logic preserved)
  const addToCart = (exhibitionProduct: ExhibitionProduct, quantity: number = 1) => {
    const pricing = calculateProductPricing(exhibitionProduct)
    const availableStock = exhibitionProduct.quantityTaken - exhibitionProduct.quantitySold
    
    const existingItem = cart.find(item => item.exhibitionProductId === exhibitionProduct.id)
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity <= availableStock) {
        setCart(cart.map(item => 
          item.exhibitionProductId === exhibitionProduct.id 
            ? { ...item, quantity: newQuantity }
            : item
        ))
      }
    } else {
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

  // Process sale (existing logic preserved)
  const processSale = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

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
        cashAmount: paymentMethod === 'CASH' || paymentMethod === 'SPLIT_PAYMENT' ? 
          (paymentMethod === 'CASH' ? cartTotals.finalTotal : cashAmount) : null,
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

  // Filter products for display
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === '' || 
      product.product.category.name === selectedCategory
    
    const hasStock = (product.quantityTaken - product.quantitySold) > 0
    
    return matchesSearch && matchesCategory && hasStock
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">POS System</h1>
                <p className="text-sm text-gray-600">{exhibition.title}</p>
              </div>
            </div>
            
            {/* Cart Items Count */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-600">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Animation */}
      {showDiscountSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Discount Applied!</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-2">
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
                        className="whitespace-nowrap"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((exhibitionProduct) => {
                const pricing = calculateProductPricing(exhibitionProduct)
                const availableStock = exhibitionProduct.quantityTaken - exhibitionProduct.quantitySold
                const cartItem = cart.find(item => item.exhibitionProductId === exhibitionProduct.id)
                
                return (
                  <Card key={exhibitionProduct.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Product Image */}
                        {exhibitionProduct.product.images.length > 0 && (
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={exhibitionProduct.product.images[0]}
                              alt={exhibitionProduct.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Product Info */}
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2">
                            {exhibitionProduct.product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            SKU: {exhibitionProduct.product.sku}
                          </p>
                          <p className="text-sm text-gray-500">
                            {exhibitionProduct.product.category.name}
                          </p>
                        </div>
                        
                        {/* Pricing */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(pricing.finalPrice, 'USD')}
                            </span>
                            {pricing.hasStoreDiscount && (
                              <Badge variant="secondary" className="text-xs">
                                {pricing.storeDiscountPercent}% OFF
                              </Badge>
                            )}
                          </div>
                          
                          {pricing.originalPrice !== pricing.finalPrice && (
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(pricing.originalPrice, 'USD')}
                            </p>
                          )}
                        </div>
                        
                        {/* Stock Info */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Stock: {availableStock}
                          </span>
                          {exhibitionProduct.isClearance && (
                            <Badge variant="destructive" className="text-xs">
                              CLEARANCE
                            </Badge>
                          )}
                        </div>
                        
                        {/* Add to Cart */}
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity(exhibitionProduct.id, cartItem.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="flex-1 text-center font-medium">
                              {cartItem.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity(exhibitionProduct.id, cartItem.quantity + 1)}
                              disabled={cartItem.quantity >= availableStock}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFromCart(exhibitionProduct.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(exhibitionProduct)}
                            disabled={availableStock === 0}
                            className="w-full h-10"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Cart and Checkout */}
          <div className="space-y-6">
            {/* 🚀 ENHANCED ORDER SUMMARY - Task 3 Implementation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                {cart.length > 0 && (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.exhibitionProductId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {item.productName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} × {formatPrice(item.finalPrice, 'USD')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.finalPrice * item.quantity, 'USD')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Cart is empty</p>
                    <p className="text-sm text-gray-400">Add products to start a sale</p>
                  </div>
                )}

                {cart.length > 0 && (
                  <>
                    {/* Subtotal */}
                    <div className="flex justify-between border-t pt-3">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatPrice(cartTotals.subtotal, 'USD')}</span>
                    </div>

                    {/* 🚀 NEW: Quick Discount Buttons */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Quick Discounts
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-14 text-xs font-bold bg-blue-50 border-blue-200 hover:bg-blue-100 flex-col"
                          onClick={() => applyQuickDiscount(5)}
                        >
                          <div className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            5% OFF
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {formatPrice(cartTotals.subtotal * 0.05, 'USD')}
                          </span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-14 text-xs font-bold bg-green-50 border-green-200 hover:bg-green-100 flex-col"
                          onClick={() => applyQuickDiscount(10)}
                        >
                          <div className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            10% OFF
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {formatPrice(cartTotals.subtotal * 0.10, 'USD')}
                          </span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-14 text-xs font-bold bg-orange-50 border-orange-200 hover:bg-orange-100 flex-col"
                          onClick={() => applyQuickDiscount(15)}
                        >
                          <div className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            15% OFF
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {formatPrice(cartTotals.subtotal * 0.15, 'USD')}
                          </span>
                        </Button>
                      </div>
                    </div>

                    {/* 🚀 NEW: Custom Total Input - "Customer wants $X" */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Calculator className="h-4 w-4 text-purple-500" />
                        Customer Wants To Pay
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={cartTotals.finalTotal.toFixed(2)}
                            className="pl-8 h-12 text-lg font-medium"
                            onChange={(e) => {
                              const customerTotal = parseFloat(e.target.value) || 0
                              if (customerTotal > 0 && customerTotal < cartTotals.subtotal) {
                                handleCustomerTotal(customerTotal)
                              }
                            }}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-12 px-3"
                          onClick={clearAllDiscounts}
                          title="Clear all discounts"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {bundleDiscount > 0 && activeDiscountMode === 'custom' && (
                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                          <TrendingDown className="h-3 w-3" />
                          Saving customer {formatPrice(bundleDiscount, 'USD')} from original subtotal
                        </div>
                      )}
                    </div>

                    {/* Enhanced Manual Discount Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Staff Discount */}
                      <div className="space-y-2">
                        <Label htmlFor="customDiscount" className="text-xs">Staff Discount ($)</Label>
                        <Input
                          id="customDiscount"
                          type="number"
                          step="0.01"
                          value={customDiscount}
                          onChange={(e) => {
                            setCustomDiscount(parseFloat(e.target.value) || 0)
                            setActiveDiscountMode('manual')
                          }}
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>

                      {/* Bundle/Negotiation Discount */}
                      <div className="space-y-2">
                        <Label htmlFor="bundleDiscount" className="text-xs">Negotiation ($)</Label>
                        <Input
                          id="bundleDiscount"
                          type="number"
                          step="0.01"
                          value={bundleDiscount}
                          onChange={(e) => {
                            setBundleDiscount(parseFloat(e.target.value) || 0)
                            setActiveDiscountMode('manual')
                          }}
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>
                    </div>

                    {/* 🚀 NEW: Enhanced Discount Reason with Quick Select */}
                    {(customDiscount > 0 || bundleDiscount > 0) && (
                      <div className="space-y-3">
                        <Label htmlFor="bargainReason" className="text-sm font-medium">
                          Discount Reason
                        </Label>
                        
                        {/* Quick Reason Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            'Customer negotiation',
                            'Bulk purchase',
                            'Repeat customer',
                            'End of day sale',
                            'Minor defect',
                            'Floor model'
                          ].map((reason) => (
                            <Button
                              key={reason}
                              variant="outline"
                              size="sm"
                              className={`h-8 text-xs transition-all ${
                                bargainReason === reason 
                                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setBargainReason(reason)}
                            >
                              {reason}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Custom Reason Input */}
                        <Input
                          id="bargainReason"
                          value={bargainReason}
                          onChange={(e) => setBargainReason(e.target.value)}
                          placeholder="Or enter custom reason..."
                          className="h-10"
                        />
                      </div>
                    )}

                    {/* Total Discount Display */}
                    {cartTotals.totalDiscount > 0 && (
                      <div className="flex justify-between text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        <span className="font-medium">Total Discount:</span>
                        <span className="font-bold">-{formatPrice(cartTotals.totalDiscount, 'USD')}</span>
                      </div>
                    )}

                    {/* Final Total */}
                    <div className="flex justify-between text-xl font-bold border-t-2 pt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                      <span>TOTAL:</span>
                      <span className="text-green-700">{formatPrice(cartTotals.finalTotal, 'USD')}</span>
                    </div>

                    {/* Savings Summary */}
                    {cartTotals.totalDiscount > 0 && (
                      <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            🎉 Customer saves {formatPrice(cartTotals.totalDiscount, 'USD')} • 
                            {((cartTotals.totalDiscount / cartTotals.subtotal) * 100).toFixed(1)}% off!
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Customer Information Button */}
                    <Button
                      variant="outline"
                      className="w-full h-12"
                      onClick={() => setShowCustomerForm(!showCustomerForm)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {showCustomerForm ? 'Hide' : 'Add'} Customer Info
                    </Button>

                    {/* Customer Form */}
                    {showCustomerForm && (
                      <Card className="border-dashed">
                        <CardContent className="p-4 space-y-3">
                          <Input
                            placeholder="Customer Name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                          <Input
                            placeholder="Phone Number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                          <Input
                            placeholder="Email Address"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Process Payment Button */}
                    <Button
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full h-12 text-lg font-semibold"
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Process Payment
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Modal */}
            {showPaymentForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Payment
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPaymentForm(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'CASH', label: 'Cash', icon: DollarSign },
                          { value: 'ZELLE', label: 'Zelle', icon: Smartphone },
                          { value: 'CARD', label: 'Card', icon: CreditCard },
                          { value: 'SPLIT_PAYMENT', label: 'Split', icon: Receipt }
                        ].map(({ value, label, icon: Icon }) => (
                          <Button
                            key={value}
                            variant={paymentMethod === value ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod(value as any)}
                            className="h-12 flex-col"
                          >
                            <Icon className="w-4 h-4 mb-1" />
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Split Payment Details */}
                    {paymentMethod === 'SPLIT_PAYMENT' && (
                      <div className="space-y-3">
                        <Label>Split Payment Amounts</Label>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Label htmlFor="cashAmount" className="text-sm">Cash ($)</Label>
                            <Input
                              id="cashAmount"
                              type="number"
                              step="0.01"
                              value={cashAmount}
                              onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Label htmlFor="zelleAmount" className="text-sm">Zelle ($)</Label>
                            <Input
                              id="zelleAmount"
                              type="number"
                              step="0.01"
                              value={zelleAmount}
                              onChange={(e) => setZelleAmount(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Label htmlFor="cardAmount" className="text-sm">Card ($)</Label>
                            <Input
                              id="cardAmount"
                              type="number"
                              step="0.01"
                              value={cardAmount}
                              onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: {formatPrice(cashAmount + zelleAmount + cardAmount, 'USD')} / 
                            {formatPrice(cartTotals.finalTotal, 'USD')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sales Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="salesNotes">Sales Notes (Optional)</Label>
                      <Textarea
                        id="salesNotes"
                        placeholder="Any additional notes about this sale..."
                        value={salesNotes}
                        onChange={(e) => setSalesNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Error Display */}
                    {error && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Payment Total */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total to Pay:</span>
                        <span>{formatPrice(cartTotals.finalTotal, 'USD')}</span>
                      </div>
                    </div>

                    {/* Complete Sale Button */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowPaymentForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={processSale}
                        disabled={processingPayment}
                        className="flex-1"
                      >
                        {processingPayment ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          'Complete Sale'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}