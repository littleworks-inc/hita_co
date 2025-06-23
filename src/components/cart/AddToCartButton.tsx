'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { 
  ShoppingCart, 
  Plus, 
  Minus,
  Check,
  AlertCircle
} from 'lucide-react'

// Product interface matching your existing Product schema
interface ProductForCart {
  id: string
  sku: string
  name: string
  sellingPriceUSD: number
  stockQuantity: number
  images?: string[]
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

interface AddToCartButtonProps {
  product: ProductForCart
  variant?: 'default' | 'large' | 'icon' | 'minimal'
  showQuantitySelector?: boolean
  className?: string
  disabled?: boolean
}

export default function AddToCartButton({ 
  product, 
  variant = 'default',
  showQuantitySelector = false,
  className = '',
  disabled = false
}: AddToCartButtonProps) {
  const { addItem, updateQuantity, getItemQuantity, isInCart, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const currentQuantity = getItemQuantity(product.id)
  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity <= 5
  const maxQuantity = product.stockQuantity
  const canAddMore = currentQuantity < maxQuantity

  const handleAddToCart = () => {
    if (isOutOfStock || isLoading) return

    if (isInCart(product.id)) {
      // Update quantity if already in cart
      const newQuantity = Math.min(currentQuantity + quantity, maxQuantity)
      updateQuantity(product.id, newQuantity)
    } else {
      // Add new item to cart
      addItem(product, quantity)
    }

    // Show success feedback
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const increaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(prev => prev + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  // Button variants
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variantClasses = {
    default: "px-6 py-3 rounded-lg",
    large: "px-8 py-4 text-lg rounded-xl",
    icon: "p-3 rounded-full",
    minimal: "px-4 py-2 text-sm rounded-md"
  }

  const getButtonClasses = () => {
    const sizeClass = variantClasses[variant]
    
    if (disabled || isOutOfStock) {
      return `${baseClasses} ${sizeClass} bg-gray-100 text-gray-400 cursor-not-allowed ${className}`
    }
    
    if (justAdded) {
      return `${baseClasses} ${sizeClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 ${className}`
    }
    
    return `${baseClasses} ${sizeClass} bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 ${className}`
  }

  const getButtonText = () => {
    if (isOutOfStock) return 'Out of Stock'
    if (justAdded) return 'Added!'
    if (isInCart(product.id)) return 'Update Cart'
    return 'Add to Cart'
  }

  const getButtonIcon = () => {
    if (justAdded) return <Check className="h-5 w-5" />
    if (variant === 'icon') return <ShoppingCart className="h-5 w-5" />
    return <ShoppingCart className="h-5 w-5" />
  }

  return (
    <div className="space-y-3">
      {/* Quantity Selector */}
      {showQuantitySelector && !isOutOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Quantity:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-center min-w-[60px] border-x border-gray-300">
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              disabled={quantity >= maxQuantity}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {/* Stock info */}
          <div className="flex items-center gap-1 text-sm">
            {isLowStock && !isOutOfStock && (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-600">Only {product.stockQuantity} left</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={disabled || isOutOfStock || isLoading}
        className={getButtonClasses()}
      >
        {variant !== 'icon' && (
          <>
            {getButtonIcon()}
            <span className="ml-2">{getButtonText()}</span>
          </>
        )}
        {variant === 'icon' && getButtonIcon()}
      </button>

      {/* Current cart quantity indicator */}
      {isInCart(product.id) && (
        <div className="text-sm text-gray-600">
          Currently in cart: {currentQuantity} item{currentQuantity !== 1 ? 's' : ''}
        </div>
      )}

      {/* Stock warning */}
      {isLowStock && !isOutOfStock && !showQuantitySelector && (
        <div className="flex items-center gap-1 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span>Only {product.stockQuantity} left in stock</span>
        </div>
      )}
    </div>
  )
}