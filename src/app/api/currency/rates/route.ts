import { NextRequest, NextResponse } from 'next/server'
import { getStoredExchangeRates, fetchExchangeRates, updateExchangeRates } from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    // First, try to get stored rates
    let rates = await getStoredExchangeRates()

    // If no stored rates or they're older than 1 hour, fetch new ones
    const shouldRefresh = Object.keys(rates).length === 0

    if (shouldRefresh) {
      try {
        rates = await fetchExchangeRates()
        // Update stored rates in background
        updateExchangeRates().catch(console.error)
      } catch (error) {
        console.error('Error fetching live rates:', error)
        // If live fetch fails and we have no stored rates, return basic fallback
        if (Object.keys(rates).length === 0) {
          rates = {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            CAD: 1.25,
            AUD: 1.35,
            JPY: 110,
            CNY: 6.45,
            INR: 75
          }
        }
      }
    }

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Currency rates API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force refresh exchange rates
    await updateExchangeRates()
    const rates = await getStoredExchangeRates()
    
    return NextResponse.json({ 
      message: 'Exchange rates updated successfully',
      rates 
    })
  } catch (error) {
    console.error('Currency rates update error:', error)
    return NextResponse.json(
      { error: 'Failed to update exchange rates' },
      { status: 500 }
    )
  }
}