'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useCartWithCurrency } from '@/contexts/CartContext'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Heart,
  Shield,
  Truck,
  Package,
  Star,
  ChevronRight
} from 'lucide-react'

export default function CartPageContent() {
  const { items, totalItems, clearCart, isClient } = useCart()
  const { totalPriceFormatted } = useCartWithCurrency()
  const [isClearing, setIsClearing] = useState(false)

  // Don't render cart details until client-side to prevent hydration issues
  if (!isClient) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      setIsClearing(true)
      clearCart()
      setTimeout(() => setIsClearing(false), 500)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Shopping Cart
          </h1>
          {totalItems > 0 && (
            <p className="text-gray-600 mt-2">
              {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
            </p>
          )}
        </div>

        {/* Continue Shopping */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/90 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      {/* Empty Cart State */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added any items to your cart yet. 
            Discover our amazing collection and find something you love!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Start Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Featured Categories */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link href="/categories" className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Package className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Browse Categories</h3>
              <p className="text-sm text-gray-600">Explore our organized collection</p>
            </Link>
            <Link href="/products?featured=true" className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Star className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Featured Products</h3>
              <p className="text-sm text-gray-600">Our handpicked favorites</p>
            </Link>
            <Link href="/products?sort=newest" className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Heart className="h-8 w-8 text-red-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">New Arrivals</h3>
              <p className="text-sm text-gray-600">Latest additions to our store</p>
            </Link>
          </div>
        </div>
      ) : (
        /* Cart with Items */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clear Cart Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Cart Items ({totalItems})
              </h2>
              <button
                onClick={handleClearCart}
                disabled={isClearing}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear Cart
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                  <CartItem item={item} />
                </div>
              ))}
            </div>

            {/* Suggested Actions */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">You might also like</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href="/products?featured=true"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary/50 hover:bg-primary/10 transition-colors group"
                >
                  <Star className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary">Featured Products</div>
                    <div className="text-sm text-gray-500">Discover our top picks</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
                <Link
                  href="/products?sort=newest"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary/50 hover:bg-primary/10 transition-colors group"
                >
                  <Package className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary">New Arrivals</div>
                    <div className="text-sm text-gray-500">Check out what's new</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                {/* Cart Summary */}
                <CartSummary />

                {/* Action Buttons */}
                <div className="space-y-3 mt-6">
                  <Link
                    href="/checkout"
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-4 rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  
                  <Link
                    href="/products"
                    className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Continue Shopping
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Why shop with us?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Secure SSL encryption</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-600">Free shipping over $100</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-gray-600">30-day return policy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}