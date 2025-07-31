// src/app/api/barcode/lookup/route.ts
// 🔧 API: Barcode lookup endpoint for POS integration

import { NextRequest, NextResponse } from 'next/server'
import { lookupBarcode, validateBarcode } from '@/lib/barcode-lookup'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode parameter is required' },
        { status: 400 }
      )
    }

    // Validate barcode format
    const validation = validateBarcode(barcode)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Lookup barcode
    const result = await lookupBarcode(barcode)

    return NextResponse.json({
      success: true,
      barcode: barcode,
      timestamp: new Date().toISOString(),
      result
    })

  } catch (error) {
    console.error('Barcode lookup API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during barcode lookup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcode } = body

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required in request body' },
        { status: 400 }
      )
    }

    // Validate barcode format
    const validation = validateBarcode(barcode)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Lookup barcode
    const result = await lookupBarcode(barcode)

    return NextResponse.json({
      success: true,
      barcode: barcode,
      timestamp: new Date().toISOString(),
      result
    })

  } catch (error) {
    console.error('Barcode lookup API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during barcode lookup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}