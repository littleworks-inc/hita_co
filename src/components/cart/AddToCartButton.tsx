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

// Product interface for the button
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
  const [stockValidation, setStockValidation] = useState<{
    isValidating: boolean
    available: boolean
    maxAllowed: number
    message: string
  }>({
    isValidating: false,
    available: true,
    maxAllowed: product.stockQuantity,
    message: ''
  })

  const currentQuantity = getItemQuantity(product.id)
  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = product.stockQuantity <= 5

  // Calculate available quantity considering cart contents
  const availableToAdd = Math.max(0, stockValidation.maxAllowed - currentQuantity)
  const effectiveMaxQuantity = Math.min(quantity, availableToAdd)

  // Real-time stock validation
  const validateStock = useCallback(async (requestedQuantity: number) => {
    setStockValidation(prev => ({ ...prev, isValidating: true }))

    try {
      const totalQuantity = currentQuantity + requestedQuantity
      const response = await fetch(`/api/products/stock?productId=${product.id}&quantity=${totalQuantity}`)
      
      if (!response.ok) {
        throw new Error('Stock validation failed')
      }

      const result = await response.json()
      
      setStockValidation({
        isValidating: false,
        available: result.available,
        maxAllowed: result.maxAllowed,
        message: result.message
      })

      return result.available
    } catch (error) {
      console.error('Stock validation error:', error)
      setStockValidation({
        isValidating: false,
        available: false,
        maxAllowed: 0,
        message: 'Unable to verify stock'
      })
      return false
    }
  }, [product.id, currentQuantity])

  // Validate stock when component mounts or cart changes
  useEffect(() => {
    validateStock(quantity)
  }, [quantity, currentQuantity])

  const handleAddToCart = async () => {
    if (isOutOfStock || isLoading || stockValidation.isValidating) return

    // Validate stock before adding
    const stockIsValid = await validateStock(quantity)
    
    if (!stockIsValid) {
      console.warn('Cannot add to cart: Stock validation failed')
      return
    }

    let success = false

    if (isInCart(product.id)) {
      // Update quantity if already in cart
      const newQuantity = Math.min(currentQuantity + quantity, stockValidation.maxAllowed)
      success = await updateQuantity(product.id, newQuantity)
    } else {
      // Add new item to cart
      success = await addItem(product, quantity)
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

  const increaseQuantity = async () => {
    const newQuantity = quantity + 1
    const totalWithCart = currentQuantity + newQuantity
    
    // Validate before increasing
    if (totalWithCart <= stockValidation.maxAllowed) {
      setQuantity(newQuantity)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  // Button styling
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed"
  
  const variantClasses = {
    default: "px-6 py-3 rounded-lg",
    large: "px-8 py-4 text-lg rounded-xl",
    icon: "p-3 rounded-full",
    minimal: "px-4 py-2 text-sm rounded-md"
  }

  const getButtonClasses = () => {
    const sizeClass = variantClasses[variant]
    
    if (disabled || isOutOfStock || !stockValidation.available) {
      return `${baseClasses} ${sizeClass} bg-gray-100 text-gray-400 cursor-not-allowed ${className}`
    }
    
    if (stockValidation.isValidating) {
      return `${baseClasses} ${sizeClass} bg-gray-200 text-gray-600 cursor-wait ${className}`
    }
    
    if (justAdded) {
      return `${baseClasses} ${sizeClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 ${className}`
    }
    
    return `${baseClasses} ${sizeClass} bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 ${className}`
  }

  const getButtonText = () => {
    if (isOutOfStock) return 'Out of Stock'
    if (!stockValidation.available) return 'Unavailable'
    if (stockValidation.isValidating) return 'Checking...'
    if (justAdded) return 'Added!'
    if (isInCart(product.id)) return 'Update Cart'
    return 'Add to Cart'
  }

  const getButtonIcon = () => {
    if (stockValidation.isValidating) return <Loader2 className="h-5 w-5 animate-spin" />
    if (justAdded) return <Check className="h-5 w-5" />
    if (variant === 'icon') return <ShoppingCart className="h-5 w-5" />
    return <ShoppingCart className="h-5 w-5" />
  }

  const canAddToCart = availableToAdd > 0 && stockValidation.available && !stockValidation.isValidating

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
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-center min-w-[60px] border-x border-gray-300">
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              disabled={quantity >= availableToAdd || stockValidation.isValidating}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {/* Available quantity info */}
          <div className="flex items-center gap-1 text-sm">
            {availableToAdd > 0 ? (
              <span className="text-gray-600">
                {availableToAdd} available to add
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Cannot add more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={disabled || isOutOfStock || !canAddToCart || isLoading}
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

      {/* Stock Status Information */}
      <div className="space-y-1">
        {/* Current cart quantity indicator */}
        {isInCart(product.id) && (
          <div className="text-sm text-gray-600">
            Currently in cart: {currentQuantity} item{currentQuantity !== 1 ? 's' : ''}
          </div>
        )}

        {/* Stock warnings and info */}
        {!isOutOfStock && (
          <div className="space-y-1">
            {/* Low stock warning */}
            {isLowStock && (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Only {product.stockQuantity} left in stock</span>
              </div>
            )}

            {/* Stock validation message */}
            {!stockValidation.available && stockValidation.message && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{stockValidation.message}</span>
              </div>
            )}

            {/* Max quantity reached */}
            {availableToAdd === 0 && currentQuantity > 0 && (
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>Maximum quantity in cart ({currentQuantity}/{stockValidation.maxAllowed})</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}