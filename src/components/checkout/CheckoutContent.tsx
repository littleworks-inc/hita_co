'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '@/components/ui'
import {
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Lock,
  Package,
  Truck,
  AlertCircle,
  Check
} from 'lucide-react'
import Image from 'next/image'

// Customer Information Interface
interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
}

// Shipping Address Interface
interface ShippingAddress {
  street: string
  apartment?: string
  city: string
  state: string
  postalCode: string
  country: string
}

// Payment Method Type
type PaymentMethod = 'card' | 'paypal' | 'bank_transfer'

export default function CheckoutContent() {
  const router = useRouter()
  const { items, totalItems, totalPriceUSD, clearCart, validateCartStock, hasStockIssues } = useCart()
  const { formatPrice, currency } = useCurrency()
  
  // Checkout Steps
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form Data
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: ''
  })
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  })
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [termsAccepted, setTermsAccepted] = useState(false)
  
  // Calculated Values
  const subtotal = totalPriceUSD
  const shippingCost = subtotal > 100 ? 0 : 15 // Free shipping over $100
  const taxRate = 0.08 // 8% tax
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + shippingCost + taxAmount
  
  // Redirect if cart is empty
  useEffect(() => {
    if (totalItems === 0) {
      router.push('/cart')
    }
  }, [totalItems, router])
  
  // Form Validation
  const isCustomerInfoValid = () => {
    return customerInfo.firstName.trim() !== '' &&
           customerInfo.lastName.trim() !== '' &&
           customerInfo.email.trim() !== '' &&
           customerInfo.phone.trim() !== ''
  }
  
  const isShippingAddressValid = () => {
    return shippingAddress.street.trim() !== '' &&
           shippingAddress.city.trim() !== '' &&
           shippingAddress.state.trim() !== '' &&
           shippingAddress.postalCode.trim() !== '' &&
           shippingAddress.country.trim() !== ''
  }
  
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return isCustomerInfoValid()
      case 2: return isShippingAddressValid()
      case 3: return termsAccepted
      default: return false
    }
  }
  
  // Handle Step Navigation
  const nextStep = () => {
    if (canProceedToNextStep() && currentStep < 3) {
      setError('') // Clear any previous errors
      setCurrentStep(currentStep + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 1) {
      setError('') // Clear any previous errors
      setCurrentStep(currentStep - 1)
    }
  }
  
  // Handle Order Submission with Enhanced Stock Validation
  const handleSubmitOrder = async () => {
    if (!canProceedToNextStep()) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // First, validate cart stock before proceeding
      console.log('Validating cart stock before checkout...')
      const stockValid = await validateCartStock()
      
      if (!stockValid || hasStockIssues) {
        setError('Some items in your cart are no longer available or have limited stock. Please review your cart and try again.')
        setIsLoading(false)
        return
      }
      
      const orderData = {
        customerInfo,
        shippingAddress,
        paymentMethod,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          pricePerItem: item.priceUSD,
          totalPrice: item.priceUSD * item.quantity
        })),
        subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total: totalAmount,
        currency: currency.code
      }
      
      // Call Order Creation API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Order created successfully
        console.log('Order created:', result.order)
        
        // Clear cart and redirect to success page with order number
        clearCart()
        router.push(`/checkout/success?orderNumber=${result.order.orderNumber}`)
      } else {
        // Handle API errors with specific stock-related messaging
        let errorMessage = result.error || 'Failed to create order. Please try again.'
        
        // Enhanced error handling for stock issues
        if (result.error && result.error.includes('stock')) {
          errorMessage = 'Some items are no longer available. Please refresh your cart and try again.'
        } else if (result.error && result.error.includes('Price has changed')) {
          errorMessage = 'Product prices have been updated. Please refresh your cart to see current prices.'
        }
        
        setError(errorMessage)
        console.error('Order creation failed:', result.error)
      }
      
    } catch (error) {
      console.error('Order submission failed:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Steps Configuration
  const steps = [
    { number: 1, title: 'Customer Information', icon: User },
    { number: 2, title: 'Shipping Address', icon: MapPin },
    { number: 3, title: 'Payment & Review', icon: CreditCard }
  ]
  
  if (totalItems === 0) {
    return null // Will redirect
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Complete your purchase securely</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/cart')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-purple-100 text-purple-700' :
                  isCompleted ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-purple-600 text-white' :
                    isCompleted ? 'bg-green-600 text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-2" />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Stock Issues Warning */}
        {hasStockIssues && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Stock Alert</span>
            </div>
            <p className="text-amber-600 mt-1">
              Some items in your cart have limited availability. Please review quantities before proceeding.
            </p>
            <button 
              onClick={() => router.push('/cart')}
              className="text-amber-700 hover:text-amber-800 underline text-sm mt-2"
            >
              Review Cart →
            </button>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = steps[currentStep - 1].icon
                  return <Icon className="h-5 w-5" />
                })()}
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <Input
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <Input
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company (Optional)
                    </label>
                    <Input
                      value={customerInfo.company}
                      onChange={(e) => setCustomerInfo({...customerInfo, company: e.target.value})}
                      placeholder="Enter company name"
                    />
                  </div>
                </div>
              )}
              
              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <Input
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      placeholder="Enter street address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apartment, suite, etc. (Optional)
                    </label>
                    <Input
                      value={shippingAddress.apartment}
                      onChange={(e) => setShippingAddress({...shippingAddress, apartment: e.target.value})}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <Input
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        placeholder="Enter city"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province *
                      </label>
                      <Input
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        placeholder="Enter state/province"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code *
                      </label>
                      <Input
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                        placeholder="Enter postal code"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <select 
                        value={shippingAddress.country} 
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select country</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="IN">India</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 3: Payment & Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="mr-3"
                        />
                        <CreditCard className="h-5 w-5 mr-3 text-gray-600" />
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-gray-500">Visa, MasterCard, American Express</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="mr-3"
                        />
                        <div className="h-5 w-5 mr-3 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                          PP
                        </div>
                        <div>
                          <div className="font-medium">PayPal</div>
                          <div className="text-sm text-gray-500">Pay with your PayPal account</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <div className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" className="text-purple-600 hover:underline">Terms and Conditions</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
                      </div>
                    </label>
                  </div>
                  
                  {/* Security Notice */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                    <Lock className="h-4 w-4 text-green-600" />
                    Your payment information is encrypted and secure
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={!canProceedToNextStep() || isLoading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Complete Order
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                    {item.image && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.priceUSD * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Pricing Breakdown */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(totalAmount)}</span>
                </div>
              </div>
              
              {/* Free Shipping Notice */}
              {subtotal < 100 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Truck className="h-4 w-4" />
                    Add {formatPrice(100 - subtotal)} more for free shipping!
                  </div>
                </div>
              )}
              
              {/* Security Badges */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Secure
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Tracked
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Fast Delivery
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}