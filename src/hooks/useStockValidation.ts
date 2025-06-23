'use client'

import { useState, useCallback, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'

interface StockValidationItem {
  productId: string
  available: boolean
  stockQuantity: number
  requestedQuantity: number
  maxAllowed: number
  message: string
}

interface StockValidationResult {
  isValid: boolean
  items: StockValidationItem[]
  errors: string[]
}

interface UseStockValidationReturn {
  // State
  isValidating: boolean
  lastValidation: StockValidationResult | null
  isCartValid: boolean
  
  // Actions
  validateSingleProduct: (productId: string, quantity: number) => Promise<StockValidationItem | null>
  validateCart: () => Promise<StockValidationResult>
  validateCartItem: (productId: string, quantity: number) => Promise<boolean>
  refreshCartValidation: () => Promise<void>
  
  // Utilities
  getProductStockInfo: (productId: string) => StockValidationItem | null
  canAddToCart: (productId: string, additionalQuantity: number) => Promise<boolean>
}

export function useStockValidation(): UseStockValidationReturn {
  const { items: cartItems } = useCart()
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidation, setLastValidation] = useState<StockValidationResult | null>(null)
  const [isCartValid, setIsCartValid] = useState(true)

  // Validate a single product's availability
  const validateSingleProduct = useCallback(async (
    productId: string, 
    quantity: number
  ): Promise<StockValidationItem | null> => {
    try {
      const response = await fetch(`/api/products/stock?productId=${productId}&quantity=${quantity}`)
      
      if (!response.ok) {
        console.error('Stock validation failed:', await response.text())
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.error('Stock validation error:', error)
      return null
    }
  }, [])

  // Validate entire cart
  const validateCart = useCallback(async (): Promise<StockValidationResult> => {
    if (cartItems.length === 0) {
      const emptyResult: StockValidationResult = {
        isValid: true,
        items: [],
        errors: []
      }
      setLastValidation(emptyResult)
      setIsCartValid(true)
      return emptyResult
    }

    setIsValidating(true)
    
    try {
      const requestItems = cartItems.map(item => ({
        productId: item.id,
        requestedQuantity: item.quantity
      }))

      const response = await fetch('/api/products/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: requestItems }),
      })

      if (!response.ok) {
        throw new Error('Failed to validate cart stock')
      }

      const result: StockValidationResult = await response.json()
      
      setLastValidation(result)
      setIsCartValid(result.isValid)
      
      return result
    } catch (error) {
      console.error('Cart validation error:', error)
      
      const errorResult: StockValidationResult = {
        isValid: false,
        items: [],
        errors: ['Failed to validate cart. Please try again.']
      }
      
      setLastValidation(errorResult)
      setIsCartValid(false)
      
      return errorResult
    } finally {
      setIsValidating(false)
    }
  }, [cartItems])

  // Validate specific cart item
  const validateCartItem = useCallback(async (
    productId: string, 
    quantity: number
  ): Promise<boolean> => {
    const result = await validateSingleProduct(productId, quantity)
    return result?.available || false
  }, [validateSingleProduct])

  // Refresh cart validation
  const refreshCartValidation = useCallback(async () => {
    await validateCart()
  }, [validateCart])

  // Get stock info for specific product from last validation
  const getProductStockInfo = useCallback((productId: string): StockValidationItem | null => {
    if (!lastValidation) return null
    return lastValidation.items.find(item => item.productId === productId) || null
  }, [lastValidation])

  // Check if we can add more of a product to cart
  const canAddToCart = useCallback(async (
    productId: string, 
    additionalQuantity: number
  ): Promise<boolean> => {
    // Get current quantity in cart
    const currentCartItem = cartItems.find(item => item.id === productId)
    const currentQuantity = currentCartItem?.quantity || 0
    const totalQuantity = currentQuantity + additionalQuantity

    // Validate total quantity
    const result = await validateSingleProduct(productId, totalQuantity)
    return result?.available || false
  }, [cartItems, validateSingleProduct])

  // Auto-validate cart when items change
  useEffect(() => {
    if (cartItems.length > 0) {
      // Debounce validation to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        validateCart()
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      // Clear validation for empty cart
      setLastValidation(null)
      setIsCartValid(true)
    }
  }, [cartItems, validateCart])

  return {
    // State
    isValidating,
    lastValidation,
    isCartValid,
    
    // Actions
    validateSingleProduct,
    validateCart,
    validateCartItem,
    refreshCartValidation,
    
    // Utilities
    getProductStockInfo,
    canAddToCart
  }
}