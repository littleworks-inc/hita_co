// ✅ FIXED: src/components/cart/AddToCartButton.tsx
// Simplified and working version

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react'

// Product interfaces
interface ProductSize {
  id: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  sortOrder: number
}

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
  requiresSizes?: boolean
  productSizes?: ProductSize[]
}

interface AddToCartButtonProps {
  product: ProductForCart
  variant?: 'default' | 'large' | 'icon' | 'minimal'
  showQuantitySelector?: boolean
  className?: string
  disabled?: boolean
  selectedSize?: ProductSize | null
}

export default function AddToCartButton({ 
  product, 
  variant = 'default',
  showQuantitySelector = false,
  className = '',
  disabled = false,
  selectedSize = null
}: AddToCartButtonProps) {
  const { addItem, updateQuantity, getItemQuantity, isInCart, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Calculate available stock based on size selection
  const getAvailableStock = () => {
    if (product.requiresSizes && selectedSize) {
      return selectedSize.stockQuantity
    }
    return product.stockQuantity
  }

  const availableStock = getAvailableStock()
  const isOutOfStock = availableStock === 0

  // Generate cart item ID (unique for size variants)
  const getCartItemId = () => {
    if (product.requiresSizes && selectedSize) {
      return `${product.id}-${selectedSize.id}`
    }
    return product.id
  }

  const cartItemId = getCartItemId()
  const currentQuantity = getItemQuantity(cartItemId)
  const availableToAdd = Math.max(0, availableStock - currentQuantity)

  // Check if product requires size selection
  const requiresSizeSelection = product.requiresSizes && product.productSizes?.length > 0
  const canAddToCart = !requiresSizeSelection || (requiresSizeSelection && selectedSize)

  // Validate stock with API
  const validateStock = useCallback(async (requestedQuantity: number) => {
    if (!canAddToCart) return false

    setIsValidating(true)

    try {
      const params = new URLSearchParams({
        productId: product.id,
        quantity: requestedQuantity.toString()
      })

      // Add size information if applicable
      if (selectedSize) {
        params.append('sizeId', selectedSize.id)
      }

      const response = await fetch(`/api/products/stock?${params}`)
      
      if (!response.ok) {
        throw new Error('Stock validation failed')
      }

      const result = await response.json()
      return result.available

    } catch (error) {
      console.error('Stock validation error:', error)
      // Fallback to local validation
      return availableToAdd >= requestedQuantity
    } finally {
      setIsValidating(false)
    }
  }, [product.id, selectedSize, availableToAdd, canAddToCart])

  const handleAddToCart = async () => {
    if (isOutOfStock || isLoading || isValidating || disabled) return

    // Check size selection requirement
    if (requiresSizeSelection && !selectedSize) {
      console.warn('Size selection required')
      return
    }

    // Validate stock before adding
    const stockIsValid = await validateStock(quantity)
    
    if (!stockIsValid) {
      console.warn('Insufficient stock available')
      return
    }

    let success = false

    // Create cart product with size information
    const cartProduct = {
      ...product,
      // For sized products, store size-specific information
      ...(selectedSize && {
        sizeInfo: {
          sizeId: selectedSize.id,
          size: selectedSize.size,
          sku: selectedSize.sku,
          stockQuantity: selectedSize.stockQuantity
        }
      })
    }

    if (isInCart(cartItemId)) {
      // Update quantity if already in cart
      const newQuantity = Math.min(currentQuantity + quantity, availableStock)
      success = await updateQuantity(cartItemId, newQuantity)
    } else {
      // Add new item to cart
      success = await addItem(cartProduct, quantity, selectedSize?.id)
    }

    if (success) {
      // Show success feedback
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
      
      // Reset quantity selector
      if (showQuantitySelector) {
        setQuantity(1)
      }
    }
  }

  const increaseQuantity = () => {
    const newQuantity = Math.min(quantity + 1, availableToAdd)
    setQuantity(newQuantity)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
    
    const sizeClasses = {
      default: 'px-6 py-3 text-base rounded-lg',
      large: 'px-8 py-4 text-lg rounded-lg w-full',
      icon: 'p-3 rounded-full',
      minimal: 'px-4 py-2 text-sm rounded-md'
    }

    const stateClasses = (() => {
      if (disabled || isOutOfStock || !canAddToCart) {
        return 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }
      if (justAdded) {
        return 'bg-green-600 text-white'
      }
      if (isValidating) {
        return 'bg-gray-400 text-white cursor-wait'
      }
      return 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
    })()

    return `${baseClasses} ${sizeClasses[variant]} ${stateClasses} ${className}`
  }

  const getButtonText = () => {
    if (!canAddToCart && requiresSizeSelection) return 'Select Size First'
    if (isOutOfStock) return 'Out of Stock'
    if (isValidating) return 'Checking Stock...'
    if (justAdded) return 'Added to Cart!'
    if (isInCart(cartItemId)) return 'Update Cart'
    return 'Add to Cart'
  }

  const getButtonIcon = () => {
    if (isValidating) return <Loader2 className="h-5 w-5 animate-spin" />
    if (justAdded) return <Check className="h-5 w-5" />
    if (variant === 'icon') return <ShoppingCart className="h-5 w-5" />
    return <ShoppingCart className="h-5 w-5" />
  }

  const finalCanAddToCart = canAddToCart && availableToAdd > 0 && !isValidating

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {showQuantitySelector && !isOutOfStock && canAddToCart && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Quantity:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-center min-w-[60px] border-x border-gray-300">
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              disabled={quantity >= availableToAdd || isValidating}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {/* Available quantity info */}
          <div className="flex items-center gap-1 text-sm">
            {availableToAdd > 0 ? (
              <span className="text-green-600">
                {availableToAdd} available
              </span>
            ) : (
              <span className="text-red-600">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                No more available
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={disabled || isOutOfStock || !finalCanAddToCart || isLoading}
        className={getButtonClasses()}
      >
        <div className="flex items-center gap-2">
          {getButtonIcon()}
          <span>{getButtonText()}</span>
        </div>
      </button>

      {/* Stock Information */}
      {availableStock <= 5 && availableStock > 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <AlertCircle className="h-4 w-4" />
          <span>Only {availableStock} left in stock</span>
        </div>
      )}
    </div>
  )
}