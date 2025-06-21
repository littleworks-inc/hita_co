import { NextRequest, NextResponse } from 'next/server'
import { 
  getStoredExchangeRates, 
  fetchExchangeRates, 
  updateExchangeRates,
  initializeExchangeRates
} from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    // Initialize and get exchange rates with proper error handling
    const rates = await initializeExchangeRates()

    // Return the rates (will be fallback rates if database isn't available)
    return NextResponse.json(rates)
  } catch (error) {
    console.error('Currency rates API error:', error)
    
    // Return basic fallback rates even if everything else fails
    const fallbackRates = {
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
      DKK: 6.4
    }

    return NextResponse.json(fallbackRates)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force refresh exchange rates
    console.log('Force refreshing exchange rates...')
    await updateExchangeRates()
    
    // Get the updated rates
    const rates = await getStoredExchangeRates()
    
    return NextResponse.json({ 
      message: 'Exchange rates updated successfully',
      rates,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Currency rates update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update exchange rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}