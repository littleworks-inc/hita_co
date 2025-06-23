'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'

// Cart Item Interface - matches your Product structure
interface CartItem {
  id: string // Product ID
  sku: string
  name: string
  priceUSD: number // Always store in USD for consistency
  quantity: number
  maxQuantity: number // Stock limit
  image?: string // First product image
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
  // Enhanced stock validation fields
  stockValidated?: boolean
  stockIssue?: string
  lastStockCheck?: Date
  stockStatus?: 'available' | 'low' | 'out_of_stock' | 'unknown'
}

// Cart Context Interface
interface CartContextType {
  // Cart State
  items: CartItem[]
  totalItems: number
  totalPriceUSD: number
  isLoading: boolean
  isClient: boolean
  hasStockIssues: boolean

  // Cart Actions
  addItem: (product: ProductForCart, quantity?: number) => Promise<boolean>
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>
  clearCart: () => void
  
  // Cart Utilities
  getItemQuantity: (productId: string) => number
  isInCart: (productId: string) => boolean
  
  // Enhanced Stock Management
  validateCartStock: () => Promise<boolean>
  refreshItemStock: (productId: string) => Promise<void>
  getStockIssues: () => CartItem[]
  hasStockIssuesForItem: (productId: string) => boolean
  
  // UI State
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

// Product interface for adding to cart (matches your existing Product schema)
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

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
    // Load cart from localStorage
    const savedCart = localStorage.getItem('hitaco-cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setItems(parsedCart)
      } catch (error) {
        console.error('Failed to parse saved cart:', error)
        localStorage.removeItem('hitaco-cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('hitaco-cart', JSON.stringify(items))
    }
  }, [items, isClient])

  // Enhanced stock validation utility
  const checkProductStock = async (productId: string, requestedQuantity: number): Promise<{
    available: boolean
    maxAllowed: number
    message: string
    stockStatus: 'available' | 'low' | 'out_of_stock' | 'unknown'
  }> => {
    try {
      const response = await fetch(`/api/products/stock?productId=${productId}&quantity=${requestedQuantity}`)
      
      if (!response.ok) {
        console.error('Stock check failed:', response.status, response.statusText)
        return {
          available: false,
          maxAllowed: 0,
          message: 'Unable to verify stock',
          stockStatus: 'unknown'
        }
      }
      
      const result = await response.json()
      
      // Determine stock status
      let stockStatus: 'available' | 'low' | 'out_of_stock' | 'unknown' = 'available'
      if (result.stockQuantity === 0) {
        stockStatus = 'out_of_stock'
      } else if (result.stockQuantity <= 5) {
        stockStatus = 'low'
      }
      
      return {
        available: result.available,
        maxAllowed: result.maxAllowed,
        message: result.message,
        stockStatus
      }
    } catch (error) {
      console.error('Stock check failed:', error)
      return {
        available: false,
        maxAllowed: 0,
        message: 'Stock check failed',
        stockStatus: 'unknown'
      }
    }
  }

  // Add item to cart with enhanced stock validation
  const addItem = useCallback(async (product: ProductForCart, quantity: number = 1): Promise<boolean> => {
    if (quantity <= 0) {
      console.warn('Cannot add item with zero or negative quantity')
      return false
    }

    setIsLoading(true)

    try {
      // Get current quantity in cart
      const existingItem = items.find(item => item.id === product.id)
      const currentQuantity = existingItem?.quantity || 0
      const totalRequestedQuantity = currentQuantity + quantity

      // Check stock availability
      const stockCheck = await checkProductStock(product.id, totalRequestedQuantity)
      
      if (!stockCheck.available) {
        console.warn(`Cannot add ${quantity} items: ${stockCheck.message}`)
        // Optionally trigger UI notification here
        return false
      }

      setItems(currentItems => {
        if (existingItem) {
          // Update existing item
          return currentItems.map(item =>
            item.id === product.id
              ? { 
                  ...item, 
                  quantity: totalRequestedQuantity,
                  maxQuantity: stockCheck.maxAllowed,
                  stockValidated: true,
                  stockIssue: undefined,
                  lastStockCheck: new Date(),
                  stockStatus: stockCheck.stockStatus
                }
              : item
          )
        } else {
          // Add new item
          const newItem: CartItem = {
            id: product.id,
            sku: product.sku,
            name: product.name,
            priceUSD: product.sellingPriceUSD,
            quantity: quantity,
            maxQuantity: stockCheck.maxAllowed,
            image: product.images?.[0],
            category: product.category,
            country: product.country,
            stockValidated: true,
            stockIssue: undefined,
            lastStockCheck: new Date(),
            stockStatus: stockCheck.stockStatus
          }
          return [...currentItems, newItem]
        }
      })

      return true
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [items])

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId))
  }, [])

  // Update item quantity with stock validation
  const updateQuantity = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      removeItem(productId)
      return true
    }

    setIsLoading(true)

    try {
      // Check stock availability for new quantity
      const stockCheck = await checkProductStock(productId, quantity)
      
      if (!stockCheck.available) {
        console.warn(`Cannot update to ${quantity} items: ${stockCheck.message}`)
        return false
      }

      setItems(currentItems =>
        currentItems.map(item =>
          item.id === productId
            ? { 
                ...item, 
                quantity: Math.min(quantity, stockCheck.maxAllowed),
                maxQuantity: stockCheck.maxAllowed,
                stockValidated: true,
                stockIssue: undefined,
                lastStockCheck: new Date(),
                stockStatus: stockCheck.stockStatus
              }
            : item
        )
      )

      return true
    } catch (error) {
      console.error('Failed to update quantity:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [removeItem])

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([])
    setIsOpen(false)
  }, [])

  // Validate entire cart stock with enhanced error handling
  const validateCartStock = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) return true

    setIsLoading(true)

    try {
      const stockRequests = items.map(item => ({
        productId: item.id,
        requestedQuantity: item.quantity
      }))

      const response = await fetch('/api/products/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: stockRequests }),
      })

      if (!response.ok) {
        throw new Error(`Stock validation failed: ${response.status}`)
      }

      const result = await response.json()
      
      // Update cart items with stock validation results
      setItems(currentItems => 
        currentItems.map(item => {
          const stockInfo = result.items.find((si: any) => si.productId === item.id)
          if (stockInfo) {
            let stockStatus: 'available' | 'low' | 'out_of_stock' | 'unknown' = 'available'
            if (stockInfo.stockQuantity === 0) {
              stockStatus = 'out_of_stock'
            } else if (stockInfo.stockQuantity <= 5) {
              stockStatus = 'low'
            }

            return {
              ...item,
              maxQuantity: stockInfo.maxAllowed,
              stockValidated: true,
              stockIssue: stockInfo.available ? undefined : stockInfo.message,
              lastStockCheck: new Date(),
              stockStatus,
              quantity: stockInfo.available ? item.quantity : Math.min(item.quantity, stockInfo.maxAllowed)
            }
          }
          return item
        })
      )

      return result.isValid
    } catch (error) {
      console.error('Cart stock validation failed:', error)
      
      // Mark all items as unvalidated
      setItems(currentItems => 
        currentItems.map(item => ({
          ...item,
          stockValidated: false,
          stockIssue: 'Unable to verify stock',
          lastStockCheck: new Date(),
          stockStatus: 'unknown' as const
        }))
      )
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [items])

  // Refresh stock for specific item
  const refreshItemStock = useCallback(async (productId: string) => {
    const item = items.find(i => i.id === productId)
    if (!item) return

    const stockCheck = await checkProductStock(productId, item.quantity)
    
    setItems(currentItems =>
      currentItems.map(cartItem =>
        cartItem.id === productId
          ? {
              ...cartItem,
              maxQuantity: stockCheck.maxAllowed,
              stockValidated: true,
              stockIssue: stockCheck.available ? undefined : stockCheck.message,
              lastStockCheck: new Date(),
              stockStatus: stockCheck.stockStatus,
              quantity: stockCheck.available ? cartItem.quantity : Math.min(cartItem.quantity, stockCheck.maxAllowed)
            }
          : cartItem
      )
    )
  }, [items])

  // Get items with stock issues
  const getStockIssues = useCallback((): CartItem[] => {
    return items.filter(item => 
      item.stockIssue || 
      item.stockStatus === 'out_of_stock' || 
      !item.stockValidated ||
      (item.stockValidated && item.quantity > item.maxQuantity)
    )
  }, [items])

  // Check if specific item has stock issues
  const hasStockIssuesForItem = useCallback((productId: string): boolean => {
    const item = items.find(i => i.id === productId)
    if (!item) return false
    
    return !!(
      item.stockIssue || 
      item.stockStatus === 'out_of_stock' || 
      !item.stockValidated ||
      (item.stockValidated && item.quantity > item.maxQuantity)
    )
  }, [items])

  // Utility functions
  const getItemQuantity = useCallback((productId: string): number => {
    const item = items.find(item => item.id === productId)
    return item?.quantity || 0
  }, [items])

  const isInCart = useCallback((productId: string): boolean => {
    return items.some(item => item.id === productId)
  }, [items])

  // UI state functions
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  // Computed values
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPriceUSD = items.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0)
  const hasStockIssues = getStockIssues().length > 0

  // Auto-validate cart when items change (with debouncing)
  useEffect(() => {
    if (items.length > 0) {
      // Debounce validation to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        validateCartStock()
      }, 1000) // Increased to 1 second for better UX

      return () => clearTimeout(timeoutId)
    }
  }, [items.length]) // Only trigger on item count change, not quantity changes

  return (
    <CartContext.Provider value={{
      // Cart State
      items,
      totalItems,
      totalPriceUSD,
      isLoading,
      isClient,
      hasStockIssues,

      // Cart Actions
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      
      // Cart Utilities
      getItemQuantity,
      isInCart,
      
      // Enhanced Stock Management
      validateCartStock,
      refreshItemStock,
      getStockIssues,
      hasStockIssuesForItem,
      
      // UI State
      isOpen,
      openCart,
      closeCart,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// Hook for cart with currency formatting (ESSENTIAL FOR EXISTING COMPONENTS)
export function useCartWithCurrency() {
  const cart = useCart()
  const { formatPrice, convertPrice, currency } = useCurrency()

  return {
    ...cart,
    // Add currency-aware totals
    totalPriceFormatted: formatPrice(cart.totalPriceUSD),
    totalPriceConverted: convertPrice(cart.totalPriceUSD),
    currency,
    
    // Enhanced items with currency formatting
    itemsWithCurrency: cart.items.map(item => ({
      ...item,
      priceFormatted: formatPrice(item.priceUSD),
      priceConverted: convertPrice(item.priceUSD),
      totalPriceFormatted: formatPrice(item.priceUSD * item.quantity),
      totalPriceConverted: convertPrice(item.priceUSD * item.quantity)
    }))
  }
}