'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
  const [currency, setCurrencyState] = useState<SupportedCurrency>(initialCurrency)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(initialRates)
  const [isLoading, setIsLoading] = useState(false)

  // Load currency preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('preferred-currency')
    if (saved && isValidCurrency(saved)) {
      setCurrencyState(saved)
    }
  }, [])

  // Save currency preference to localStorage
  const setCurrency = (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('preferred-currency', newCurrency)
  }

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/currency/rates')
      if (response.ok) {
        const rates = await response.json()
        setExchangeRates(rates)
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh rates
  const refreshRates = async () => {
    await fetchExchangeRates()
  }

  // Load exchange rates on mount
  useEffect(() => {
    if (Object.keys(exchangeRates).length === 0) {
      fetchExchangeRates()
    }
  }, [])

  // Convert price from USD
  const convertPrice = (priceUSD: number): number => {
    if (currency === 'USD') return priceUSD
    const rate = exchangeRates[currency]
    return rate ? priceUSD * rate : priceUSD
  }

  // Format price with currency
  const formatPrice = (priceUSD: number): string => {
    return convertAndFormatPrice(priceUSD, currency, exchangeRates)
  }

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

// Custom hook to use currency context
export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
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