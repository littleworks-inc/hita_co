'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  SupportedCurrency, 
  SUPPORTED_CURRENCIES,
  convertAndFormatPrice,
  isValidCurrency 
} from '@/lib/currency'

interface CurrencyContextType {
  // Current state
  currency: SupportedCurrency
  exchangeRates: Record<string, number>
  isLoading: boolean
  
  // Actions
  setCurrency: (currency: SupportedCurrency) => void
  convertPrice: (priceUSD: number) => number
  formatPrice: (priceUSD: number) => string
  refreshRates: () => Promise<void>
  
  // Currency info
  currencyInfo: typeof SUPPORTED_CURRENCIES[SupportedCurrency]
  availableCurrencies: Array<{
    code: SupportedCurrency
    name: string
    symbol: string
    flag: string
  }>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
  initialCurrency?: SupportedCurrency
  initialRates?: Record<string, number>
}

export function CurrencyProvider({ 
  children, 
  initialCurrency = 'USD',
  initialRates = {}
}: CurrencyProviderProps) {
  // State with proper initialization to prevent hydration issues
  const [currency, setCurrencyState] = useState<SupportedCurrency>(initialCurrency)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(initialRates)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load currency preference from localStorage (only on client)
  useEffect(() => {
    if (!isClient) return
    
    try {
      const saved = localStorage.getItem('preferred-currency')
      if (saved && isValidCurrency(saved)) {
        setCurrencyState(saved)
      }
    } catch (error) {
      console.warn('Error loading currency preference:', error)
    }
  }, [isClient])

  // Save currency preference to localStorage
  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency)
    
    if (isClient) {
      try {
        localStorage.setItem('preferred-currency', newCurrency)
      } catch (error) {
        console.warn('Error saving currency preference:', error)
      }
    }
  }, [isClient])

  // Fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/currency/rates')
      if (response.ok) {
        const rates = await response.json()
        setExchangeRates(rates)
      } else {
        console.warn('Failed to fetch exchange rates:', response.status)
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh rates
  const refreshRates = useCallback(async () => {
    await fetchExchangeRates()
  }, [fetchExchangeRates])

  // Load exchange rates on mount (only on client)
  useEffect(() => {
    if (!isClient) return
    
    if (Object.keys(exchangeRates).length === 0) {
      fetchExchangeRates()
    }
  }, [isClient, exchangeRates, fetchExchangeRates])

  // Convert price from USD
  const convertPrice = useCallback((priceUSD: number): number => {
    if (currency === 'USD') return priceUSD
    const rate = exchangeRates[currency]
    return rate ? priceUSD * rate : priceUSD
  }, [currency, exchangeRates])

  // Format price with currency
  const formatPrice = useCallback((priceUSD: number): string => {
    const convertedPrice = convertPrice(priceUSD)
    const currencyInfo = SUPPORTED_CURRENCIES[currency]
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'JPY' ? 0 : 2,
        maximumFractionDigits: currency === 'JPY' ? 0 : 2,
      }).format(convertedPrice)
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      return `${currencyInfo.symbol}${convertedPrice.toFixed(currency === 'JPY' ? 0 : 2)}`
    }
  }, [currency, convertPrice])

  // Get current currency info
  const currencyInfo = SUPPORTED_CURRENCIES[currency]

  // Get available currencies
  const availableCurrencies = Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code: code as SupportedCurrency,
    name: info.name,
    symbol: info.symbol,
    flag: info.flag
  }))

  const value: CurrencyContextType = {
    currency,
    exchangeRates,
    isLoading,
    setCurrency,
    convertPrice,
    formatPrice,
    refreshRates,
    currencyInfo,
    availableCurrencies
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

// Custom hook to use currency context with better error handling
export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider. Make sure to wrap your component with CurrencyProvider.')
  }
  return context
}

// Hook for converting prices (can be used without full context)
export function usePrice(priceUSD: number) {
  const { convertPrice, formatPrice, currency } = useCurrency()
  
  return {
    originalPriceUSD: priceUSD,
    convertedPrice: convertPrice(priceUSD),
    formattedPrice: formatPrice(priceUSD),
    currency
  }
}

// Safe hook that doesn't throw if used outside provider (for edge cases)
export function useCurrencySafe() {
  const context = useContext(CurrencyContext)
  return context || {
    currency: 'USD' as SupportedCurrency,
    exchangeRates: {},
    isLoading: false,
    setCurrency: () => {},
    convertPrice: (price: number) => price,
    formatPrice: (price: number) => `$${price.toFixed(2)}`,
    refreshRates: async () => {},
    currencyInfo: SUPPORTED_CURRENCIES.USD,
    availableCurrencies: []
  }
}