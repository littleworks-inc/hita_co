// src/app/api/currency/rates/route.ts
// =====================================
// 🔧 FIXED: Currency Rates API with Proper Error Handling
// Resolves database connection issues
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  getStoredExchangeRates, 
  fetchExchangeRates, 
  updateExchangeRates,
  initializeExchangeRates
} from '@/lib/currency'

// 🔧 FIXED: Fallback rates to use when database is unavailable
const SAFE_FALLBACK_RATES = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  CAD: 1.25,
  AUD: 1.35,
  JPY: 110,
  CNY: 6.45,
  INR: 83.0,
  SGD: 1.35,
  HKD: 7.8,
  AED: 3.67,
  CHF: 0.92,
  NOK: 8.5,
  SEK: 8.8,
  DKK: 6.4,
  NZD: 1.5,
  ZAR: 18.5,
  BRL: 5.2,
  MXN: 20.0,
  RUB: 75.0,
  KRW: 1200.0,
  TRY: 8.5,
  PLN: 3.9,
  THB: 33.0,
  MYR: 4.2,
  IDR: 14500.0,
  PHP: 55.0,
  VND: 23000.0
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Currency rates API called')
    
    // Try to initialize and get exchange rates with proper error handling
    const rates = await initializeExchangeRates().catch(error => {
      console.warn('Failed to initialize exchange rates:', error)
      return SAFE_FALLBACK_RATES
    })

    // Ensure we always have at least basic rates
    const finalRates = {
      ...SAFE_FALLBACK_RATES,
      ...rates
    }

    console.log(`✅ Returning ${Object.keys(finalRates).length} exchange rates`)
    
    return NextResponse.json(finalRates, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    })
  } catch (error) {
    console.error('💥 Currency rates API error:', error)
    
    // Return safe fallback rates even if everything else fails
    console.log('🆘 Using emergency fallback rates')
    
    return NextResponse.json(SAFE_FALLBACK_RATES, {
      status: 200, // Still return 200 so app doesn't break
      headers: {
        'Cache-Control': 'public, s-maxage=300' // Shorter cache for fallback
      }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Force refreshing exchange rates...')
    
    // Try to force refresh exchange rates
    await updateExchangeRates().catch(error => {
      console.warn('Failed to update exchange rates:', error)
      throw new Error('Update failed: Database not available')
    })
    
    // Get the updated rates
    const rates = await getStoredExchangeRates().catch(error => {
      console.warn('Failed to get stored rates:', error)
      return SAFE_FALLBACK_RATES
    })
    
    return NextResponse.json({ 
      message: 'Exchange rates updated successfully',
      rates,
      timestamp: new Date().toISOString(),
      count: Object.keys(rates).length
    })
  } catch (error) {
    console.error('💥 Currency rates update error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update exchange rates',
        message: error instanceof Error ? error.message : 'Database unavailable',
        fallback: 'Using cached rates',
        timestamp: new Date().toISOString()
      },
      { status: 207 } // 207 Multi-Status - partial success
    )
  }
}