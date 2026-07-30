'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCurrency } from '@/contexts/CurrencyContext'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Download,
  Share2,
  ShoppingBag,
  Calendar,
  Clock
} from 'lucide-react'

// Order type (matches Prisma schema)
interface OrderData {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: any // JSON object
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
  paymentMethod: string
  paymentStatus: string
  status: string
  createdAt: string
  items: {
    id: string
    quantity: number
    pricePerItem: number
    totalPrice: number
    product: {
      id: string
      name: string
      sku: string
      images: string[]
      category?: {
        name: string
        slug: string
      }
    }
  }[]
}

interface StoreSettings {
  storeName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface OrderConfirmationProps {
  order: OrderData
  storeSettings: StoreSettings | null
}

export default function OrderConfirmation({ order, storeSettings }: OrderConfirmationProps) {
  const { formatPrice } = useCurrency()
  const [emailSent, setEmailSent] = useState(false)
  
  // Format order date
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  // Parse shipping address
  const shippingAddr = order.shippingAddress
  
  // Payment method display names
  const paymentMethodNames: Record<string, string> = {
    'CREDIT_CARD': 'Credit/Debit Card',
    'PAYPAL': 'PayPal',
    'BANK_TRANSFER': 'Bank Transfer'
  }
  
  // Order status colors and messages
  const statusInfo = {
    'PENDING': { 
      color: 'text-yellow-600 bg-yellow-50', 
      message: 'Your order is being processed' 
    },
    'CONFIRMED': { 
      color: 'text-blue-600 bg-blue-50', 
      message: 'Your order has been confirmed' 
    },
    'SHIPPED': { 
      color: 'text-purple-600 bg-purple-50', 
      message: 'Your order is on its way' 
    },
    'DELIVERED': { 
      color: 'text-green-600 bg-green-50', 
      message: 'Your order has been delivered' 
    }
  }
  
  const currentStatus = statusInfo[order.status as keyof typeof statusInfo] || statusInfo.PENDING
  
  // Estimated delivery date (5-7 business days from order date)
  const estimatedDelivery = new Date(order.createdAt)
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7)
  
  // Handle email receipt request
  const handleEmailReceipt = async () => {
    try {
      // TODO: Implement email receipt functionality
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (error) {
      console.error('Failed to send email receipt:', error)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Thank you for your purchase. Your order has been successfully placed.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 inline-block">
          <p className="text-sm text-gray-500">Order Number</p>
          <p className="text-xl font-mono font-bold text-gray-900">{order.orderNumber}</p>
        </div>
      </div>
      
      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`p-3 rounded-lg ${currentStatus.color}`}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{currentStatus.message}</span>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">{orderDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="font-medium">{estimatedDelivery.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Items ({order.items.length} item{order.items.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                {item.product.images.length > 0 && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                  {item.product.category && (
                    <p className="text-sm text-gray-500">Category: {item.product.category.name}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Quantity: {item.quantity} × {formatPrice(item.pricePerItem)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatPrice(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <div className="text-sm text-gray-600 mt-1">
                <p>{shippingAddr.street}</p>
                {shippingAddr.apartment && <p>{shippingAddr.apartment}</p>}
                <p>{shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}</p>
                <p>{shippingAddr.country}</p>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {order.customerEmail}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Phone className="h-4 w-4" />
                {order.customerPhone}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Payment & Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment & Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">{paymentMethodNames[order.paymentMethod] || order.paymentMethod}</p>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleEmailReceipt}
              variant="outline"
              className="flex items-center gap-2"
              disabled={emailSent}
            >
              <Mail className="h-4 w-4" />
              {emailSent ? 'Email Sent!' : 'Email Receipt'}
            </Button>
            
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Print Order
            </Button>
            
            <Button
              asChild
              className="flex items-center gap-2"
            >
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Store Contact Information */}
      {storeSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, please don't hesitate to contact us.
            </p>
            <div className="space-y-2 text-sm">
              {storeSettings.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${storeSettings.email}`} className="text-primary hover:underline">
                    {storeSettings.email}
                  </a>
                </div>
              )}
              {storeSettings.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${storeSettings.phone}`} className="text-primary hover:underline">
                    {storeSettings.phone}
                  </a>
                </div>
              )}
              {storeSettings.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{storeSettings.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Order Tracking Info */}
      <div className="bg-blue-50 p-6 rounded-lg text-center">
        <h3 className="font-medium text-blue-900 mb-2">Track Your Order</h3>
        <p className="text-blue-700 text-sm mb-4">
          You'll receive an email with tracking information once your order ships.
        </p>
        <p className="text-blue-600 text-sm">
          Order Number: <span className="font-mono font-bold">{order.orderNumber}</span>
        </p>
      </div>
    </div>
  )
}