// =====================================
// ENHANCED: src/components/cart/AddToCartButton.tsx
// AddToCartButton with Complete Size Selection Support
// =====================================

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import ProductSizeSelector from '@/components/customer/ProductSizeSelector'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  AlertCircle,
  Loader2,
  Ruler
} from 'lucide-react'

// ✅ NEW: Enhanced product interface with size support
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
  // ✅ NEW: Size system fields
  requiresSizes?: boolean
  sizeType?: 'CLOTHING' | 'SHOE' | 'JEWELRY' | 'CUSTOM'
  productSizes?: ProductSize[]
}

interface AddToCartButtonProps {
  product: ProductForCart
  variant?: 'default' | 'large' | 'icon' | 'minimal'
  showQuantitySelector?: boolean
  showSizeSelector?: boolean // ✅ NEW: Control size selector display
  className?: string
  disabled?: boolean
}

export default function AddToCartButton({ 
  product, 
  variant = 'default',
  showQuantitySelector = false,
  showSizeSelector = true, // ✅ NEW: Default to true
  className = '',
  disabled = false
}: AddToCartButtonProps) {
  const { addItem, updateQuantity, getItemQuantity, isInCart, isLoading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null) // ✅ NEW: Selected size state
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

  // ✅ NEW: Calculate cart quantity considering size variants
  const getCartQuantityForSize = (sizeId?: string) => {
    if (product.requiresSizes && sizeId) {
      // For sized products, get quantity for specific size
      return getItemQuantity(`${product.id}-${sizeId}`)
    } else {
      // For non-sized products, get total quantity
      return getItemQuantity(product.id)
    }
  }

  const currentQuantity = getCartQuantityForSize(selectedSize?.id)
  
  // ✅ NEW: Calculate stock based on size selection
  const getAvailableStock = () => {
    if (product.requiresSizes && selectedSize) {
      return selectedSize.stockQuantity
    } else if (product.requiresSizes && product.productSizes?.length) {
      // Total stock across all sizes
      return product.productSizes.reduce((total, size) => total + size.stockQuantity, 0)
    } else {
      return product.stockQuantity
    }
  }

  const availableStock = getAvailableStock()
  const isOutOfStock = availableStock === 0
  const isLowStock = availableStock <= 5

  // Calculate available quantity considering cart contents
  const availableToAdd = Math.max(0, stockValidation.maxAllowed - currentQuantity)
  const effectiveMaxQuantity = Math.min(quantity, availableToAdd)

  // ✅ NEW: Size selection handler
  const handleSizeSelect = (size: ProductSize | null) => {
    setSelectedSize(size)
    // Reset quantity when size changes
    setQuantity(1)
  }

  // ✅ NEW: Check if product requires size selection
  const requiresSizeSelection = product.requiresSizes && product.productSizes?.length > 0
  const canAddToCart = !requiresSizeSelection || (requiresSizeSelection && selectedSize)

  // Real-time stock validation
  const validateStock = useCallback(async (requestedQuantity: number) => {
    setStockValidation(prev => ({ ...prev, isValidating: true }))

    try {
      const totalQuantity = currentQuantity + requestedQuantity
      const productIdForValidation = selectedSize ? `${product.id}-${selectedSize.id}` : product.id
      
      const response = await fetch(`/api/products/stock?productId=${productIdForValidation}&quantity=${totalQuantity}`)
      
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
      
      // ✅ NEW: Fallback validation using selected size stock
      const maxAllowed = selectedSize?.stockQuantity || product.stockQuantity
      setStockValidation({
        isValidating: false,
        available: maxAllowed > currentQuantity,
        maxAllowed: maxAllowed,
        message: 'Using local stock validation'
      })
      return maxAllowed > currentQuantity
    }
  }, [product.id, currentQuantity, selectedSize])

  // Validate stock when component mounts or cart changes
  useEffect(() => {
    if (canAddToCart) {
      validateStock(quantity)
    }
  }, [quantity, currentQuantity, selectedSize, canAddToCart])

  const handleAddToCart = async () => {
    if (isOutOfStock || isLoading || stockValidation.isValidating) return

    // ✅ NEW: Check size selection requirement
    if (requiresSizeSelection && !selectedSize) {
      console.warn('Cannot add to cart: Size selection required')
      return
    }

    // Validate stock before adding
    const stockIsValid = await validateStock(quantity)
    
    if (!stockIsValid) {
      console.warn('Cannot add to cart: Stock validation failed')
      return
    }

    let success = false

    // ✅ NEW: Create cart item with size information
    const cartProduct = {
      ...product,
      // For sized products, use size-specific data
      ...(selectedSize && {
        id: `${product.id}-${selectedSize.id}`, // Unique ID for size variant
        sku: selectedSize.sku, // Size-specific SKU
        stockQuantity: selectedSize.stockQuantity,
        sizeInfo: {
          sizeId: selectedSize.id,
          size: selectedSize.size,
          originalProductId: product.id
        }
      })
    }

    const cartItemId = selectedSize ? `${product.id}-${selectedSize.id}` : product.id

    if (isInCart(cartItemId)) {
      // Update quantity if already in cart
      const newQuantity = Math.min(currentQuantity + quantity, stockValidation.maxAllowed)
      success = await updateQuantity(cartItemId, newQuantity)
    } else {
      // Add new item to cart
      success = await addItem(cartProduct, quantity)
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
    
    // Check against available stock
    if (totalWithCart <= availableStock && newQuantity <= availableToAdd) {
      setQuantity(newQuantity)
    }
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
      large: 'px-8 py-4 text-lg rounded-lg',
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
      if (stockValidation.isValidating) {
        return 'bg-gray-400 text-white cursor-wait'
      }
      return 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
    })()

    return `${baseClasses} ${sizeClasses[variant]} ${stateClasses} ${className}`
  }

  const getButtonText = () => {
    if (!canAddToCart && requiresSizeSelection) return 'Select Size First'
    if (isOutOfStock) return 'Out of Stock'
    if (stockValidation.isValidating) return 'Checking Stock...'
    if (justAdded) return 'Added to Cart!'
    if (isInCart(selectedSize ? `${product.id}-${selectedSize.id}` : product.id)) return 'Update Cart'
    return 'Add to Cart'
  }

  const getButtonIcon = () => {
    if (stockValidation.isValidating) return <Loader2 className="h-5 w-5 animate-spin" />
    if (justAdded) return <Check className="h-5 w-5" />
    if (variant === 'icon') return <ShoppingCart className="h-5 w-5" />
    return <ShoppingCart className="h-5 w-5" />
  }

  const finalCanAddToCart = canAddToCart && availableToAdd > 0 && stockValidation.available && !stockValidation.isValidating

  return (
    <div className="space-y-4">
      {/* ✅ NEW: Size Selector */}
      {requiresSizeSelection && showSizeSelector && (
        <div className="border-t border-gray-200 pt-4">
          <ProductSizeSelector
            product={product}
            stockStatus={{
              isOutOfStock: false,
              isLowStock: false,
              totalStock: product.productSizes?.reduce((total, size) => total + size.stockQuantity, 0) || 0,
              availableSizes: product.productSizes?.filter(size => size.stockQuantity > 0).length || 0,
              lowStockSizes: product.productSizes?.filter(size => size.stockQuantity <= size.lowStockAlert).length || 0,
              hasMultipleSizes: (product.productSizes?.length || 0) > 1,
              requiresSizeSelection: true
            }}
            onSizeSelect={handleSizeSelect}
            selectedSize={selectedSize}
          />
        </div>
      )}

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
                {selectedSize && ` (Size ${selectedSize.size})`}
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
        disabled={disabled || isOutOfStock || !finalCanAddToCart || isLoading}
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
        {isInCart(selectedSize ? `${product.id}-${selectedSize.id}` : product.id) && (
          <div className="text-sm text-gray-600">
            Currently in cart: {currentQuantity} item{currentQuantity !== 1 ? 's' : ''}
            {selectedSize && ` (Size ${selectedSize.size})`}
          </div>
        )}

        {/* Low stock warning */}
        {selectedSize && selectedSize.stockQuantity <= selectedSize.lowStockAlert && selectedSize.stockQuantity > 0 && (
          <div className="text-sm text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Only {selectedSize.stockQuantity} left in size {selectedSize.size}
          </div>
        )}

        {/* Stock validation message */}
        {stockValidation.message && stockValidation.message !== 'Using local stock validation' && (
          <div className="text-sm text-gray-600">
            {stockValidation.message}
          </div>
        )}

        {/* Size requirement notice */}
        {requiresSizeSelection && !selectedSize && showSizeSelector && (
          <div className="text-sm text-amber-600 flex items-center gap-1">
            <Ruler className="h-4 w-4" />
            Please select a size to continue
          </div>
        )}
      </div>
    </div>
  )
}