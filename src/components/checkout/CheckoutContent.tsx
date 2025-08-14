// Updated src/components/checkout/CheckoutContent.tsx
// =====================================
// Dynamic shipping integrated checkout process
// =====================================

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
  Check,
  RefreshCw
} from 'lucide-react'
import Image from 'next/image'

// =================
// INTERFACES
// =================

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

// Shipping calculation interface
interface ShippingCalculationResult {
  success: boolean
  shippingCostUSD: number
  shippingCostFormatted: string
  isEligibleForFreeShipping: boolean
  freeShippingThreshold?: number
  remainingForFreeShipping?: number
  shippingZoneName: string
  estimatedDays?: string
  error?: string
}

export default function CheckoutContent() {
  const router = useRouter()
  const { items, totalItems, totalPriceUSD, clearCart, validateCartStock, hasStockIssues } = useCart()
  const { formatPrice, currency } = useCurrency()
  
  // Checkout Steps
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Shipping calculation state
  const [shippingData, setShippingData] = useState<ShippingCalculationResult | null>(null)
  const [isLoadingShipping, setIsLoadingShipping] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)
  
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
  
  // =================
  // SHIPPING CALCULATION
  // =================
  
  const calculateShipping = async (countryCode: string) => {
    if (!countryCode || totalPriceUSD <= 0) {
      setShippingData(null)
      return
    }

    setIsLoadingShipping(true)
    setShippingError(null)

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          countryCode: countryCode.toUpperCase(),
          subtotalUSD: totalPriceUSD,
          currency
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result: ShippingCalculationResult = await response.json()
      setShippingData(result)

      if (!result.success) {
        setShippingError(result.error || 'Failed to calculate shipping')
      }

    } catch (error) {
      console.error('Shipping calculation error:', error)
      setShippingError('Unable to calculate shipping costs')
      
      // Fallback shipping logic
      setShippingData({
        success: false,
        shippingCostUSD: totalPriceUSD >= 100 ? 0 : 15,
        shippingCostFormatted: totalPriceUSD >= 100 ? 'Free' : '$15.00',
        isEligibleForFreeShipping: totalPriceUSD >= 100,
        freeShippingThreshold: 100,
        remainingForFreeShipping: totalPriceUSD >= 100 ? 0 : 100 - totalPriceUSD,
        shippingZoneName: 'Standard',
        error: 'Using fallback shipping rates'
      })
    } finally {
      setIsLoadingShipping(false)
    }
  }

  // Calculate shipping when country changes
  useEffect(() => {
    if (shippingAddress.country && totalPriceUSD > 0) {
      calculateShipping(shippingAddress.country)
    }
  }, [shippingAddress.country, totalPriceUSD])

  // Initial shipping calculation
  useEffect(() => {
    if (totalPriceUSD > 0) {
      calculateShipping(shippingAddress.country || 'US')
    }
  }, [totalPriceUSD])

  // =================
  // CALCULATED VALUES
  // =================
  
  const subtotal = totalPriceUSD
  const shippingCost = shippingData?.shippingCostUSD || 0
  const taxRate = 0.08 // 8% tax
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + shippingCost + taxAmount
  
  // Redirect if cart is empty
  useEffect(() => {
    if (totalItems === 0) {
      router.push('/cart')
    }
  }, [totalItems, router])
  
  // =================
  // FORM VALIDATION
  // =================
  
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
      case 2: return isShippingAddressValid() && !isLoadingShipping
      case 3: return termsAccepted && !isLoadingShipping
      default: return false
    }
  }
  
  // =================
  // STEP NAVIGATION
  // =================
  
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
  
  // =================
  // ORDER SUBMISSION
  // =================
  
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

      // Ensure we have valid shipping data
      if (!shippingData || isLoadingShipping) {
        setError('Please wait for shipping calculation to complete.')
        setIsLoading(false)
        return
      }

      // Prepare order data with dynamic shipping
      const orderData = {
        customerInfo: {
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim()
        },
        shippingAddress: {
          street: shippingAddress.street.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          postalCode: shippingAddress.postalCode.trim(),
          country: shippingAddress.country.trim()
        },
        paymentMethod: paymentMethod === 'card' ? 'credit_card' : paymentMethod,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          pricePerItem: item.priceUSD,
          totalPrice: item.priceUSD * item.quantity
        })),
        subtotal: subtotal,
        shipping: shippingCost, // Dynamic shipping cost
        tax: taxAmount,
        total: totalAmount,
        currency: currency
      }

      console.log('Creating order with data:', orderData)
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      if (result.success) {
        console.log('Order created successfully:', result.order)
        
        // Clear the cart
        clearCart()
        
        // Redirect to order confirmation
        router.push(`/checkout/success?orderId=${result.order.id}`)
      } else {
        throw new Error(result.error || 'Order creation failed')
      }

    } catch (error) {
      console.error('Order submission error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // =================
  // RENDER HELPERS
  // =================

  const renderShippingInfo = () => {
    if (isLoadingShipping) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Calculating shipping...</span>
        </div>
      )
    }

    if (shippingError) {
      return (
        <div className="text-sm text-orange-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{shippingError}</span>
          </div>
        </div>
      )
    }

    if (shippingData) {
      return (
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>{shippingData.shippingZoneName}</span>
            {shippingData.estimatedDays && (
              <span className="text-gray-500">• {shippingData.estimatedDays}</span>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  // =================
  // MAIN RENDER
  // =================

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-2 text-gray-600">Complete your order securely</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-600'}
              `}>
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {step === 1 && 'Customer Info'}
                {step === 2 && 'Shipping'}
                {step === 3 && 'Payment & Review'}
              </span>
              {step < 3 && (
                <ArrowRight className="ml-8 h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 1 && <><User className="h-5 w-5" />Customer Information</>}
                {currentStep === 2 && <><MapPin className="h-5 w-5" />Shipping Address</>}
                {currentStep === 3 && <><CreditCard className="h-5 w-5" />Payment & Review</>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <Input
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        placeholder="Enter first name"
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
                        placeholder="Enter last name"
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
                      placeholder="Enter email address"
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
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company (Optional)
                    </label>
                    <Input
                      value={customerInfo.company || ''}
                      onChange={(e) => setCustomerInfo({...customerInfo, company: e.target.value})}
                      placeholder="Enter company name"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
                <div className="space-y-6">
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
                      Apartment, Suite, etc. (Optional)
                    </label>
                    <Input
                      value={shippingAddress.apartment || ''}
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
                        <option value="JP">Japan</option>
                        <option value="BR">Brazil</option>
                        <option value="MX">Mexico</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping Calculation Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Information</h4>
                    {renderShippingInfo()}
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
                        <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                        <span>Credit/Debit Card</span>
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
                        <Package className="h-5 w-5 mr-2 text-gray-600" />
                        <span>PayPal</span>
                      </label>
                    </div>
                  </div>

                  {/* Order Review */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Order</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Customer:</span>
                        <span>{customerInfo.firstName} {customerInfo.lastName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping to:</span>
                        <span>{shippingAddress.city}, {shippingAddress.state}, {shippingAddress.country}</span>
                      </div>
                      {shippingData && (
                        <div className="flex justify-between text-sm">
                          <span>Shipping method:</span>
                          <span>{shippingData.shippingZoneName} {shippingData.estimatedDays && `(${shippingData.estimatedDays})`}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the Terms and Conditions and Privacy Policy. 
                      I understand that my order will be processed securely.
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                {currentStep > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button 
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    className={currentStep === 1 ? 'ml-auto' : ''}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmitOrder}
                    disabled={!canProceedToNextStep() || isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-1" />
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
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Shipping</span>
                    {isLoadingShipping && <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />}
                  </div>
                  <span className="text-gray-900">
                    {isLoadingShipping ? '...' : (
                      shippingData?.isEligibleForFreeShipping ? 'Free' : formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {isLoadingShipping ? '...' : formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
              
              {/* Free Shipping Notice */}
              {shippingData && !shippingData.isEligibleForFreeShipping && shippingData.remainingForFreeShipping && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Truck className="h-4 w-4" />
                    Add {formatPrice(shippingData.remainingForFreeShipping)} more for free shipping!
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