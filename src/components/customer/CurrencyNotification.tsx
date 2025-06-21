'use client'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { X, Globe } from 'lucide-react'

export default function CurrencyNotification() {
  const { currency, currencyInfo } = useCurrency()
  const [isVisible, setIsVisible] = useState(false)
  const [isDetected, setIsDetected] = useState(false)

  useEffect(() => {
    // Check if this is the first visit and currency was auto-detected
    const hasSeenNotification = localStorage.getItem('currency-notification-seen')
    const savedCurrency = localStorage.getItem('preferred-currency')
    
    // Show notification if:
    // 1. Haven't seen it before
    // 2. No saved currency preference (auto-detected)
    // 3. Current currency is not USD (was detected)
    if (!hasSeenNotification && !savedCurrency && currency !== 'USD') {
      setIsDetected(true)
      setIsVisible(true)
    }
  }, [currency])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('currency-notification-seen', 'true')
  }

  if (!isVisible || !isDetected) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{currencyInfo.flag}</span>
            <span className="text-sm font-medium">
              Prices are shown in {currencyInfo.name} ({currency}) based on your location.
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-90 hidden sm:block">
            You can change this anytime using the currency selector
          </span>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}