// src/app/exhibition/mobile/[id]/pos/page.tsx
// Mobile-optimized Exhibition POS System with touch-friendly interface

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  QrCode,
  DollarSign,
  CreditCard,
  Smartphone,
  User,
  Phone,
  Mail,
  Calculator,
  Receipt,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  Tag,
  Percent,
  Camera,
  Grid,
  List,
  Filter,
  Zap,
  Clock,
  Star
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  originalPrice: number
  discountPercentage: number
  image?: string
  category: string
  stock: number
  sizes?: Array<{ size: string; quantity: number; price?: number }>
}

interface CartItem extends Product {
  quantity: number
  selectedSize?: string
  unitPrice: number
  totalPrice: number
}

interface Exhibition {
  id: string
  title: string
  location: string
  startDate: string
  endDate: string
}

interface POSMobileProps {
  params: { id: string }
}

export default function ExhibitionMobilePOS({ params }: POSMobileProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [error, setError] = useState('')
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCart, setShowCart] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  
  // Customer & Payment
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ZELLE' | 'CARD' | 'SPLIT_PAYMENT'>('CASH')
  const [customDiscount, setCustomDiscount] = useState(0)
  const [cashAmount, setCashAmount] = useState(0)
  const [zelleAmount, setZelleAmount] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)
  const [salesNotes, setSalesNotes] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  // Load exhibition and products
  useEffect(() => {
    loadExhibitionData()
  }, [params.id])

  const loadExhibitionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/exhibitions/${params.id}/pos-data`)
      if (!response.ok) throw new Error('Failed to load exhibition data')
      
      const data = await response.json()
      setExhibition(data.exhibition)
      setProducts(data.products || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const discountAmount = (cartSubtotal * customDiscount) / 100
  const cartTotal = cartSubtotal - discountAmount

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    
    return matchesSearch && matchesCategory && product.stock > 0
  })

  // Get categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  // Add to cart
  const addToCart = (product: Product, selectedSize?: string) => {
    const existingIndex = cart.findIndex(item => 
      item.id === product.id && item.selectedSize === selectedSize
    )

    if (existingIndex >= 0) {
      const updatedCart = [...cart]
      updatedCart[existingIndex].quantity += 1
      updatedCart[existingIndex].totalPrice = updatedCart[existingIndex].quantity * updatedCart[existingIndex].unitPrice
      setCart(updatedCart)
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedSize,
        unitPrice: product.price,
        totalPrice: product.price
      }
      setCart([...cart, newItem])
    }
  }

  // Update cart item quantity
  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }

    const updatedCart = [...cart]
    updatedCart[index].quantity = quantity
    updatedCart[index].totalPrice = quantity * updatedCart[index].unitPrice
    setCart(updatedCart)
  }

  // Remove from cart
  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
  }

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    try {
      setProcessingPayment(true)
      setError('')

      const saleData = {
        exhibitionId: params.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.selectedSize
        })),
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        customerEmail: customerEmail.trim() || null,
        paymentMethod,
        customDiscount,
        cashAmount: paymentMethod === 'SPLIT_PAYMENT' ? cashAmount : paymentMethod === 'CASH' ? cartTotal : 0,
        zelleAmount: paymentMethod === 'SPLIT_PAYMENT' ? zelleAmount : paymentMethod === 'ZELLE' ? cartTotal : 0,
        cardAmount: paymentMethod === 'SPLIT_PAYMENT' ? cardAmount : paymentMethod === 'CARD' ? cartTotal : 0,
        salesPersonNotes: salesNotes.trim() || null
      }

      const response = await fetch(`/api/exhibitions/${params.id}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete sale')
      }

      const result = await response.json()

      // Success - Reset form
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setCustomDiscount(0)
      setSalesNotes('')
      setShowPayment(false)
      setShowCart(false)
      setCashAmount(0)
      setZelleAmount(0)
      setCardAmount(0)

      alert(`Sale completed successfully! Sale #${result.saleNumber}`)

      // Refresh products
      loadExhibitionData()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading POS System...</p>
        </div>
      </div>
    )
  }

  if (!exhibition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Exhibition not found or inactive</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="font-bold text-lg text-gray-900">{exhibition.title}</h1>
                <p className="text-sm text-gray-600">Mobile POS</p>
              </div>
            </div>

            {/* Cart Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCart(true)}
              className="relative"
              disabled={cart.length === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
                className="px-3"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category === 'all' ? 'All' : category}
                  </Button>
                ))}
              </div>

              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Products Grid/List */}
      <main className="p-4 pb-20">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No products found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  viewMode === 'list' ? 'flex-row' : ''
                }`}
                onClick={() => addToCart(product)}
              >
                <CardContent className={`p-4 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
                  {/* Product Image Placeholder */}
                  <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${
                    viewMode === 'grid' ? 'aspect-square mb-3' : 'w-16 h-16 flex-shrink-0'
                  }`}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {product.stock}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-purple-600">${product.price.toFixed(2)}</p>
                        {product.originalPrice > product.price && (
                          <p className="text-xs text-gray-500 line-through">
                            ${product.originalPrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button size="sm" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowCart(false)}>
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">Cart ({cart.length})</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={`${item.id}-${item.selectedSize || 'default'}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                          {item.selectedSize && (
                            <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                          )}
                          <p className="text-sm font-semibold text-purple-600">${item.totalPrice.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateCartQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateCartQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="border-t p-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    {customDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({customDiscount}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowCart(false)
                      setShowPayment(true)
                    }}
                  >
                    Proceed to Payment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-xl">Complete Payment</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPayment(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Customer Information */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="customerName">Customer Name (Optional)</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerPhone">Phone (Optional)</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email (Optional)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customDiscount">Discount %</Label>
                  <Input
                    id="customDiscount"
                    type="number"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4 mb-6">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'ZELLE', 'CARD', 'SPLIT_PAYMENT'] as const).map(method => (
                    <Button
                      key={method}
                      variant={paymentMethod === method ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === 'CASH' && <DollarSign className="h-4 w-4 mr-2" />}
                      {method === 'ZELLE' && <Smartphone className="h-4 w-4 mr-2" />}
                      {method === 'CARD' && <CreditCard className="h-4 w-4 mr-2" />}
                      {method === 'SPLIT_PAYMENT' && <Calculator className="h-4 w-4 mr-2" />}
                      {method.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Split Payment Details */}
              {paymentMethod === 'SPLIT_PAYMENT' && (
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-semibold">Split Payment Amounts</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Cash</Label>
                      <Input
                        type="number"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(Number(e.target.value))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Zelle</Label>
                      <Input
                        type="number"
                        value={zelleAmount}
                        onChange={(e) => setZelleAmount(Number(e.target.value))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Card</Label>
                      <Input
                        type="number"
                        value={cardAmount}
                        onChange={(e) => setCardAmount(Number(e.target.value))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Total: ${(cashAmount + zelleAmount + cardAmount).toFixed(2)} / Required: ${cartTotal.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Sales Notes */}
              <div className="mb-6">
                <Label htmlFor="salesNotes">Sales Notes (Optional)</Label>
                <Textarea
                  id="salesNotes"
                  value={salesNotes}
                  onChange={(e) => setSalesNotes(e.target.value)}
                  placeholder="Add any notes about this sale..."
                  rows={2}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  {customDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({customDiscount}%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t pt-1">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Complete Sale Button */}
              <Button
                className="w-full h-12"
                onClick={completeSale}
                disabled={processingPayment || cart.length === 0}
              >
                {processingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Complete Sale - ${cartTotal.toFixed(2)}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}