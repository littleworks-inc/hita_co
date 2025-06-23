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
}

// Cart Context Interface
interface CartContextType {
  // Cart State
  items: CartItem[]
  totalItems: number
  totalPriceUSD: number
  isLoading: boolean
  isClient: boolean

  // Cart Actions
  addItem: (product: ProductForCart, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  
  // Cart Utilities
  getItemQuantity: (productId: string) => number
  isInCart: (productId: string) => boolean
  
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
  // State initialization with proper hydration handling
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Currency context for price calculations
  const { convertPrice, formatPrice } = useCurrency()

  // Ensure we're on client side before localStorage access
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load cart from localStorage on client-side mount
  useEffect(() => {
    if (!isClient) return

    try {
      const savedCart = localStorage.getItem('hita-cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart)
        }
      }
    } catch (error) {
      console.warn('Error loading cart from localStorage:', error)
    }
  }, [isClient])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isClient) return

    try {
      localStorage.setItem('hita-cart', JSON.stringify(items))
    } catch (error) {
      console.warn('Error saving cart to localStorage:', error)
    }
  }, [items, isClient])

  // Add item to cart
  const addItem = useCallback((product: ProductForCart, quantity: number = 1) => {
    setIsLoading(true)

    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id)
      
      if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          product.stockQuantity
        )
        
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: product.id,
          sku: product.sku,
          name: product.name,
          priceUSD: product.sellingPriceUSD,
          quantity: Math.min(quantity, product.stockQuantity),
          maxQuantity: product.stockQuantity,
          image: product.images?.[0],
          category: product.category,
          country: product.country
        }
        
        return [...currentItems, newItem]
      }
    })

    setIsLoading(false)
  }, [])

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setItems(currentItems => 
      currentItems.filter(item => item.id !== productId)
    )
  }, [])

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item
      )
    )
  }, [removeItem])

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([])
    setIsOpen(false)
  }, [])

  // Get quantity of specific item
  const getItemQuantity = useCallback((productId: string): number => {
    const item = items.find(item => item.id === productId)
    return item?.quantity || 0
  }, [items])

  // Check if item is in cart
  const isInCart = useCallback((productId: string): boolean => {
    return items.some(item => item.id === productId)
  }, [items])

  // Cart UI controls
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPriceUSD = items.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0)

  const value: CartContextType = {
    // Cart State
    items,
    totalItems,
    totalPriceUSD,
    isLoading,
    isClient,

    // Cart Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Cart Utilities
    getItemQuantity,
    isInCart,
    
    // UI State
    isOpen,
    openCart,
    closeCart,
    toggleCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use cart context with error handling
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider. Make sure to wrap your component with CartProvider.')
  }
  return context
}

// Hook for cart with currency formatting
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

// Safe hook that doesn't throw if used outside provider (for edge cases)
export function useCartSafe() {
  const context = useContext(CartContext)
  return context || {
    items: [],
    totalItems: 0,
    totalPriceUSD: 0,
    isLoading: false,
    isClient: false,
    addItem: () => {},
    removeItem: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    getItemQuantity: () => 0,
    isInCart: () => false,
    isOpen: false,
    openCart: () => {},
    closeCart: () => {},
    toggleCart: () => {}
  }
}