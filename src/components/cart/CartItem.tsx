'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  Plus,
  Minus,
  Trash2,
  Heart,
  Package,
  AlertCircle
} from 'lucide-react'

interface CartItemProps {
  item: {
    id: string
    sku: string
    name: string
    priceUSD: number
    quantity: number
    maxQuantity: number
    image?: string
    category?: {
      id: string
      name: string
      slug: string
    }
    country?: {
      id: string
      name: string
      currency: string
      currencySymbol: string
    }
  }
  // ✅ ADDED: Optional external handlers for CartDrawer
  onUpdateQuantity?: (newQuantity: number) => Promise<void>
  onRemove?: () => void
  isUpdating?: boolean
}

export default function CartItem({ 
  item, 
  onUpdateQuantity: externalOnUpdateQuantity,
  onRemove: externalOnRemove,
  isUpdating: externalIsUpdating 
}: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const { formatPrice } = useCurrency()
  const [internalIsUpdating, setInternalIsUpdating] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Use external isUpdating if provided, otherwise use internal state
  const isUpdating = externalIsUpdating ?? internalIsUpdating

  const productSlug = `${item.name.toLowerCase().replace(/\s+/g, '-')}-${item.sku}`
  const itemTotal = item.priceUSD * item.quantity
  const isAtMaxQuantity = item.quantity >= item.maxQuantity

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > item.maxQuantity) return
    
    // Use external handler if provided, otherwise use internal cart context
    if (externalOnUpdateQuantity) {
      await externalOnUpdateQuantity(newQuantity)
    } else {
      setInternalIsUpdating(true)
      await updateQuantity(item.id, newQuantity)
      // Small delay for user feedback
      setTimeout(() => setInternalIsUpdating(false), 500)
    }
  }

  const handleRemoveItem = () => {
    setIsRemoving(true)
    
    // Use external handler if provided, otherwise use internal cart context
    if (externalOnRemove) {
      // Small delay for animation
      setTimeout(() => {
        externalOnRemove()
      }, 200)
    } else {
      // Small delay for animation
      setTimeout(() => {
        removeItem(item.id)
      }, 200)
    }
  }

  return (
    <div className={`transition-all duration-200 ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <Link href={`/products/${productSlug}`} className="block">
            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${productSlug}`}
                className="font-medium text-gray-900 hover:text-purple-600 transition-colors line-clamp-2"
              >
                {item.name}
              </Link>
              
              {/* Product Meta */}
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>SKU: {item.sku}</span>
                {item.category && (
                  <>
                    <span>•</span>
                    <span>{item.category.name}</span>
                  </>
                )}
                {item.country && (
                  <>
                    <span>•</span>
                    <span>{item.country.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemoveItem}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-2"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Price and Quantity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleUpdateQuantity(item.quantity - 1)}
                  disabled={item.quantity <= 1 || isUpdating}
                  className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className={`px-3 py-1 text-sm font-medium min-w-[40px] text-center ${
                  isUpdating ? 'animate-pulse' : ''
                }`}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(item.quantity + 1)}
                  disabled={isAtMaxQuantity || isUpdating}
                  className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Stock Warning */}
              {isAtMaxQuantity && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Max quantity</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatPrice(itemTotal)}
              </div>
              {item.quantity > 1 && (
                <div className="text-xs text-gray-500">
                  {formatPrice(item.priceUSD)} each
                </div>
              )}
            </div>
          </div>

          {/* Stock Info */}
          {item.maxQuantity <= 5 && (
            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Only {item.maxQuantity} available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}