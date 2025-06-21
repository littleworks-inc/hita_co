'use client'

import { useState, useRef, useEffect } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { ChevronDown, Globe, Check } from 'lucide-react'

interface CurrencySelectorProps {
  className?: string
  showFlag?: boolean
  showName?: boolean
}

export default function CurrencySelector({ 
  className = '',
  showFlag = true,
  showName = false
}: CurrencySelectorProps) {
  const { currency, setCurrency, currencyInfo, availableCurrencies, isLoading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCurrencySelect = (newCurrency: string) => {
    setCurrency(newCurrency as any)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        aria-label="Select currency"
        disabled={isLoading}
      >
        <Globe className="h-4 w-4 text-gray-500" />
        {showFlag && <span className="text-lg">{currencyInfo.flag}</span>}
        <span className="font-medium text-sm">
          {showName ? currencyInfo.name : currency}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
              Select Currency
            </div>
            
            {availableCurrencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencySelect(curr.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left ${
                  curr.code === currency ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{curr.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{curr.code}</span>
                    {curr.code === currency && (
                      <Check className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate">{curr.name}</div>
                </div>
                <span className="text-sm text-gray-400">{curr.symbol}</span>
              </button>
            ))}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 p-3">
            <p className="text-xs text-gray-500 text-center">
              Prices converted using live exchange rates
            </p>
          </div>
        </div>
      )}
    </div>
  )
}