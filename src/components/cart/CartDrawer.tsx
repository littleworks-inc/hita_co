'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useCartWithCurrency } from '@/contexts/CartContext'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'
import {
  X,
  ShoppingBag,
  ArrowRight,
  Trash2,
  Heart,
  Package
} from 'lucide-react'

export default function CartDrawer() {
  const { isOpen, closeCart, items, totalItems, clearCart, isClient } = useCart()
  const { totalPriceFormatted } = useCartWithCurrency()
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle drawer animations
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Don't render on server side to prevent hydration issues
  if (!isClient) return null

  return (
    <>
      {/* Backdrop */}
      {(isOpen || isAnimating) && (
        <div
          className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeCart}
        />
      )}

      {/* Cart Drawer */}
      {(isOpen || isAnimating) && (
        <div
          className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Shopping Cart
                </h2>
                {totalItems > 0 && (
                  <span className="bg-purple-100 text-purple-600 text-sm font-medium px-2 py-1 rounded-full">
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-hidden">
              {items.length === 0 ? (
                /* Empty Cart State */
                <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-sm">
                    Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
                  </p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Start Shopping
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                /* Cart Items */
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {items.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Only show when items exist */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 bg-white">
                {/* Clear Cart Button */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear your cart?')) {
                        clearCart()
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Cart
                  </button>
                </div>

                {/* Cart Summary */}
                <CartSummary />

                {/* Action Buttons */}
                <div className="p-4 space-y-3">
                  {/* View Cart Button */}
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                  >
                    <Package className="h-4 w-4" />
                    View Cart
                  </Link>

                  {/* Checkout Button */}
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="px-4 pb-4 text-center">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Secure Checkout
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Free Shipping $100+
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}