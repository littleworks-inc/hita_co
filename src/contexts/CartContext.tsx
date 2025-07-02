// ✅ FIXED: src/contexts/CartContext.tsx
// Updated to handle size variants properly

'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'

// Enhanced Cart Item Interface
interface CartItem {
  id: string // Unique cart item ID (productId-sizeId for sized products)
  productId: string // Original product ID
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
  // Size information (if applicable)
  sizeInfo?: {
    sizeId: string
    size: string
    sku: string
    stockQuantity: number
  }
  // Stock validation fields
  stockValidated?: boolean
  stockIssue?: string
  lastStockCheck?: Date
  stockStatus?: 'available' | 'low' | 'out_of_stock' | 'unknown'
}

// Cart Context Interface
interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPriceUSD: number
  isLoading: boolean
  isClient: boolean
  hasStockIssues: boolean

  addItem: (product: ProductForCart, quantity?: number, sizeId?: string) => Promise<boolean>
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>
  clearCart: () => void
  
  getItemQuantity: (cartItemId: string) => number
  isInCart: (cartItemId: string) => boolean
  
  validateCartStock: () => Promise<boolean>
  refreshItemStock: (cartItemId: string) => Promise<void>
  getStockIssues: () => CartItem[]
  
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

// Product interface
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
  productSizes?: Array<{
    id: string
    size: string
    sku: string
    stockQuantity: number
  }>
  sizeInfo?: {
    sizeId: string
    size: string
    sku: string
    stockQuantity: number
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
    // Load cart from localStorage if needed
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to load cart from storage:', error)
      }
    }
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, isClient])

  // Enhanced stock check function
  const checkProductStock = async (productId: string, sizeId: string | null, quantity: number) => {
    try {
      const params = new URLSearchParams({
        productId,
        quantity: quantity.toString()
      })

      if (sizeId) {
        params.append('sizeId', sizeId)
      }

      const response = await fetch(`/api/products/stock?${params}`)
      
      if (!response.ok) {
        throw new Error(`Stock check failed: ${response.status}`)
      }

      const result = await response.json()
      
      return {
        available: result.available,
        maxAllowed: result.maxAllowed,
        message: result.message,
        stockStatus: result.stockQuantity === 0 ? 'out_of_stock' : 
                    result.stockQuantity <= 5 ? 'low' : 'available'
      }
    } catch (error) {
      console.error('Stock check failed:', error)
      return {
        available: false,
        maxAllowed: 0,
        message: 'Unable to verify stock',
        stockStatus: 'unknown' as const
      }
    }
  }

  // Generate unique cart item ID
  const generateCartItemId = (productId: string, sizeId?: string) => {
    return sizeId ? `${productId}-${sizeId}` : productId
  }

  // Add item to cart
  const addItem = useCallback(async (
    product: ProductForCart, 
    quantity: number = 1, 
    sizeId?: string
  ): Promise<boolean> => {
    if (quantity <= 0) {
      console.warn('Cannot add item with zero or negative quantity')
      return false
    }

    setIsLoading(true)

    try {
      const cartItemId = generateCartItemId(product.id, sizeId)
      const existingItem = items.find(item => item.id === cartItemId)
      const currentQuantity = existingItem?.quantity || 0
      const totalRequestedQuantity = currentQuantity + quantity

      // Check stock availability
      const stockCheck = await checkProductStock(product.id, sizeId || null, totalRequestedQuantity)
      
      if (!stockCheck.available) {
        console.warn(`Cannot add ${quantity} items: ${stockCheck.message}`)
        return false
      }

      // Find size information if applicable
      const sizeInfo = sizeId && product.productSizes 
        ? product.productSizes.find(size => size.id === sizeId)
        : product.sizeInfo

      setItems(currentItems => {
        if (existingItem) {
          // Update existing item
          return currentItems.map(item =>
            item.id === cartItemId
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
            id: cartItemId,
            productId: product.id,
            sku: sizeInfo?.sku || product.sku,
            name: product.name,
            priceUSD: product.sellingPriceUSD,
            quantity: quantity,
            maxQuantity: stockCheck.maxAllowed,
            image: product.images?.[0],
            category: product.category,
            country: product.country,
            sizeInfo: sizeInfo ? {
              sizeId: sizeInfo.id,
              size: sizeInfo.size,
              sku: sizeInfo.sku,
              stockQuantity: sizeInfo.stockQuantity
            } : undefined,
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
  const removeItem = useCallback((cartItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== cartItemId))
  }, [])

  // Update item quantity
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      removeItem(cartItemId)
      return true
    }

    setIsLoading(true)

    try {
      const item = items.find(i => i.id === cartItemId)
      if (!item) return false

      // Check stock availability for new quantity
      const stockCheck = await checkProductStock(
        item.productId, 
        item.sizeInfo?.sizeId || null, 
        quantity
      )
      
      if (!stockCheck.available) {
        console.warn(`Cannot update to ${quantity} items: ${stockCheck.message}`)
        return false
      }

      setItems(currentItems =>
        currentItems.map(cartItem =>
          cartItem.id === cartItemId
            ? { 
                ...cartItem, 
                quantity: Math.min(quantity, stockCheck.maxAllowed),
                maxQuantity: stockCheck.maxAllowed,
                stockValidated: true,
                stockIssue: undefined,
                lastStockCheck: new Date(),
                stockStatus: stockCheck.stockStatus
              }
            : cartItem
        )
      )

      return true
    } catch (error) {
      console.error('Failed to update quantity:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [items, removeItem])

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([])
    setIsOpen(false)
  }, [])

  // Validate entire cart stock
  const validateCartStock = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) return true

    setIsLoading(true)

    try {
      // Prepare stock check requests with size information
      const stockRequests = items.map(item => ({
        productId: item.productId,
        sizeId: item.sizeInfo?.sizeId,
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
      
      // Update cart items with validation results
      setItems(currentItems => 
        currentItems.map(item => {
          const stockInfo = result.items.find((si: any) => {
            if (item.sizeInfo) {
              return si.productId === item.productId && si.sizeId === item.sizeInfo.sizeId
            }
            return si.productId === item.productId
          })
          
          if (stockInfo) {
            return {
              ...item,
              maxQuantity: stockInfo.maxAllowed,
              stockValidated: true,
              stockIssue: stockInfo.available ? undefined : stockInfo.message,
              lastStockCheck: new Date(),
              stockStatus: stockInfo.stockQuantity === 0 ? 'out_of_stock' : 
                          stockInfo.stockQuantity <= 5 ? 'low' : 'available',
              quantity: stockInfo.available ? item.quantity : Math.min(item.quantity, stockInfo.maxAllowed)
            }
          }
          return item
        })
      )

      return result.isValid
    } catch (error) {
      console.error('Cart stock validation failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [items])

  // Refresh stock for specific item
  const refreshItemStock = useCallback(async (cartItemId: string) => {
    const item = items.find(i => i.id === cartItemId)
    if (!item) return

    const stockCheck = await checkProductStock(
      item.productId, 
      item.sizeInfo?.sizeId || null, 
      item.quantity
    )
    
    setItems(currentItems =>
      currentItems.map(cartItem =>
        cartItem.id === cartItemId
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

  // Utility functions
  const getItemQuantity = useCallback((cartItemId: string): number => {
    const item = items.find(item => item.id === cartItemId)
    return item?.quantity || 0
  }, [items])

  const isInCart = useCallback((cartItemId: string): boolean => {
    return items.some(item => item.id === cartItemId)
  }, [items])

  const getStockIssues = useCallback((): CartItem[] => {
    return items.filter(item => 
      item.stockIssue || 
      item.stockStatus === 'out_of_stock' || 
      !item.stockValidated ||
      (item.stockValidated && item.quantity > item.maxQuantity)
    )
  }, [items])

  // UI state functions
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  // Computed values
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPriceUSD = items.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0)
  const hasStockIssues = getStockIssues().length > 0

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalPriceUSD,
      isLoading,
      isClient,
      hasStockIssues,

      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      
      getItemQuantity,
      isInCart,
      
      validateCartStock,
      refreshItemStock,
      getStockIssues,
      
      isOpen,
      openCart,
      closeCart,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// ✅ RESTORED: Hook for cart with currency formatting (ESSENTIAL FOR EXISTING COMPONENTS)
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