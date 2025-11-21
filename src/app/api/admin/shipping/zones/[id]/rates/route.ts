// src/app/api/admin/shipping/zones/[id]/rates/route.ts
// =====================================
// Shipping Rates Management API
// CRUD operations for shipping rates within zones
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

// =================
// INTERFACES
// =================

interface CreateShippingRateRequest {
  name: string
  description?: string
  flatRate: number
  freeShippingThreshold?: number | null
  estimatedDays?: string
  maxWeightKg?: number | null
  isActive?: boolean
}

interface UpdateShippingRateRequest {
  name?: string
  description?: string
  flatRate?: number
  freeShippingThreshold?: number | null
  estimatedDays?: string
  maxWeightKg?: number | null
  isActive?: boolean
}

interface RouteParams {
  params: {
    id: string // Zone ID
  }
}

interface ShippingRateResponse {
  id: string
  name: string
  description: string | null
  flatRate: number
  freeShippingThreshold: number | null
  estimatedDays: string | null
  maxWeightKg: number | null
  isActive: boolean
  shippingZoneId: string
  createdAt: Date
  updatedAt: Date
}

// =================
// GET /api/admin/shipping/zones/[id]/rates
// Fetch all shipping rates for a specific zone
// =================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zoneId = params.id

    // Validate zone ID
    if (!zoneId || typeof zoneId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid zone ID' },
        { status: 400 }
      )
    }

    // Check if zone exists
    const zone = await db.shippingZone.findUnique({
      where: { id: zoneId },
      select: { id: true, name: true, isActive: true }
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const sortBy = searchParams.get('sortBy') || 'flatRate'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build where clause
    const whereClause: any = {
      shippingZoneId: zoneId
    }

    if (!includeInactive) {
      whereClause.isActive = true
    }

    // Build order by clause
    const validSortFields = ['flatRate', 'name', 'createdAt', 'freeShippingThreshold']
    const orderBy: any = {}
    
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.flatRate = 'asc' // Default sorting
    }

    // Fetch shipping rates
    const rates = await db.shippingRate.findMany({
      where: whereClause,
      orderBy
    })

    // Format response
    const formattedRates: ShippingRateResponse[] = rates.map(rate => ({
      id: rate.id,
      name: rate.name,
      description: rate.description,
      flatRate: rate.flatRate,
      freeShippingThreshold: rate.freeShippingThreshold,
      estimatedDays: rate.estimatedDays,
      maxWeightKg: rate.maxWeightKg,
      isActive: rate.isActive,
      shippingZoneId: rate.shippingZoneId,
      createdAt: rate.createdAt,
      updatedAt: rate.updatedAt
    }))

    return NextResponse.json({
      success: true,
      zone: {
        id: zone.id,
        name: zone.name,
        isActive: zone.isActive
      },
      rates: formattedRates,
      totalRates: rates.length,
      activeRates: rates.filter(r => r.isActive).length
    })

  } catch (error) {
    console.error('Shipping rates GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    )
  }
}

// =================
// POST /api/admin/shipping/zones/[id]/rates
// Create a new shipping rate for a specific zone
// =================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zoneId = params.id
    const data: CreateShippingRateRequest = await request.json()

    // Validate zone ID
    if (!zoneId || typeof zoneId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid zone ID' },
        { status: 400 }
      )
    }

    // Check if zone exists and is active
    const zone = await db.shippingZone.findUnique({
      where: { id: zoneId },
      select: { id: true, name: true, isActive: true }
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      )
    }

    if (!zone.isActive) {
      return NextResponse.json(
        { error: 'Cannot add rates to inactive shipping zone' },
        { status: 400 }
      )
    }

    // Validate rate data
    const validation = validateRateData(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check for rate name conflicts within the same zone
    const existingRate = await db.shippingRate.findFirst({
      where: {
        shippingZoneId: zoneId,
        name: {
          equals: data.name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingRate) {
      return NextResponse.json(
        { error: 'A shipping rate with this name already exists in this zone' },
        { status: 400 }
      )
    }

    // Create the shipping rate
    const newRate = await db.shippingRate.create({
      data: {
        shippingZoneId: zoneId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        flatRate: data.flatRate,
        freeShippingThreshold: data.freeShippingThreshold,
        estimatedDays: data.estimatedDays?.trim() || null,
        maxWeightKg: data.maxWeightKg,
        isActive: data.isActive !== false // Default to true
      }
    })

    // Format response
    const formattedRate: ShippingRateResponse = {
      id: newRate.id,
      name: newRate.name,
      description: newRate.description,
      flatRate: newRate.flatRate,
      freeShippingThreshold: newRate.freeShippingThreshold,
      estimatedDays: newRate.estimatedDays,
      maxWeightKg: newRate.maxWeightKg,
      isActive: newRate.isActive,
      shippingZoneId: newRate.shippingZoneId,
      createdAt: newRate.createdAt,
      updatedAt: newRate.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping rate created successfully',
      rate: formattedRate
    }, { status: 201 })

  } catch (error) {
    console.error('Shipping rate creation error:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A shipping rate with this name already exists in this zone' },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid shipping zone reference' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create shipping rate' },
      { status: 500 }
    )
  }
}

// =================
// PUT /api/admin/shipping/zones/[id]/rates/[rateId]
// Update a specific shipping rate (we'll handle this via query parameter)
// =================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zoneId = params.id
    const { searchParams } = new URL(request.url)
    const rateId = searchParams.get('rateId')
    const data: UpdateShippingRateRequest = await request.json()

    // Validate IDs
    if (!zoneId || !rateId) {
      return NextResponse.json(
        { error: 'Zone ID and Rate ID are required' },
        { status: 400 }
      )
    }

    // Check if rate exists and belongs to the specified zone
    const existingRate = await db.shippingRate.findFirst({
      where: {
        id: rateId,
        shippingZoneId: zoneId
      },
      include: {
        shippingZone: {
          select: { id: true, name: true, isActive: true }
        }
      }
    })

    if (!existingRate) {
      return NextResponse.json(
        { error: 'Shipping rate not found in the specified zone' },
        { status: 404 }
      )
    }

    // Validate update data
    const validation = validateUpdateRateData(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check for name conflicts (if name is being updated)
    if (data.name && data.name.trim() !== existingRate.name) {
      const nameConflict = await db.shippingRate.findFirst({
        where: {
          shippingZoneId: zoneId,
          name: {
            equals: data.name.trim(),
            mode: 'insensitive'
          },
          id: { not: rateId }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A shipping rate with this name already exists in this zone' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.flatRate !== undefined) updateData.flatRate = data.flatRate
    if (data.freeShippingThreshold !== undefined) updateData.freeShippingThreshold = data.freeShippingThreshold
    if (data.estimatedDays !== undefined) updateData.estimatedDays = data.estimatedDays?.trim() || null
    if (data.maxWeightKg !== undefined) updateData.maxWeightKg = data.maxWeightKg
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Update the shipping rate
    const updatedRate = await db.shippingRate.update({
      where: { id: rateId },
      data: updateData
    })

    // Format response
    const formattedRate: ShippingRateResponse = {
      id: updatedRate.id,
      name: updatedRate.name,
      description: updatedRate.description,
      flatRate: updatedRate.flatRate,
      freeShippingThreshold: updatedRate.freeShippingThreshold,
      estimatedDays: updatedRate.estimatedDays,
      maxWeightKg: updatedRate.maxWeightKg,
      isActive: updatedRate.isActive,
      shippingZoneId: updatedRate.shippingZoneId,
      createdAt: updatedRate.createdAt,
      updatedAt: updatedRate.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping rate updated successfully',
      rate: formattedRate
    })

  } catch (error) {
    console.error('Shipping rate update error:', error)
    return NextResponse.json(
      { error: 'Failed to update shipping rate' },
      { status: 500 }
    )
  }
}

// =================
// DELETE /api/admin/shipping/zones/[id]/rates
// Delete a shipping rate (via query parameter)
// =================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zoneId = params.id
    const { searchParams } = new URL(request.url)
    const rateId = searchParams.get('rateId')

    // Validate IDs
    if (!zoneId || !rateId) {
      return NextResponse.json(
        { error: 'Zone ID and Rate ID are required' },
        { status: 400 }
      )
    }

    // Check if rate exists and belongs to the specified zone
    const existingRate = await db.shippingRate.findFirst({
      where: {
        id: rateId,
        shippingZoneId: zoneId
      },
      include: {
        shippingZone: {
          select: { id: true, name: true }
        }
      }
    })

    if (!existingRate) {
      return NextResponse.json(
        { error: 'Shipping rate not found in the specified zone' },
        { status: 404 }
      )
    }

    // Check if this is the only active rate in the zone
    const activeRatesCount = await db.shippingRate.count({
      where: {
        shippingZoneId: zoneId,
        isActive: true
      }
    })

    if (activeRatesCount === 1 && existingRate.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete the only active shipping rate in this zone. Please add another rate first or deactivate this rate instead.' },
        { status: 400 }
      )
    }

    // Delete the shipping rate
    const deletedRate = await db.shippingRate.delete({
      where: { id: rateId }
    })

    return NextResponse.json({
      success: true,
      message: `Shipping rate "${deletedRate.name}" deleted successfully`,
      deletedRate: {
        id: deletedRate.id,
        name: deletedRate.name,
        flatRate: deletedRate.flatRate
      },
      zone: {
        id: existingRate.shippingZone.id,
        name: existingRate.shippingZone.name
      }
    })

  } catch (error) {
    console.error('Shipping rate deletion error:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Cannot delete shipping rate due to existing dependencies' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete shipping rate' },
      { status: 500 }
    )
  }
}

// =================
// HELPER FUNCTIONS
// =================

/**
 * Validate shipping rate creation data
 */
function validateRateData(data: CreateShippingRateRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Rate name is required')
  } else if (data.name.trim().length < 2) {
    errors.push('Rate name must be at least 2 characters long')
  } else if (data.name.trim().length > 100) {
    errors.push('Rate name must be less than 100 characters')
  }

  // Flat rate validation
  if (typeof data.flatRate !== 'number') {
    errors.push('Flat rate must be a number')
  } else if (data.flatRate < 0) {
    errors.push('Flat rate cannot be negative')
  } else if (data.flatRate > 10000) {
    errors.push('Flat rate cannot exceed $10,000')
  }

  // Free shipping threshold validation
  if (data.freeShippingThreshold !== undefined && data.freeShippingThreshold !== null) {
    if (typeof data.freeShippingThreshold !== 'number') {
      errors.push('Free shipping threshold must be a number')
    } else if (data.freeShippingThreshold < 0) {
      errors.push('Free shipping threshold cannot be negative')
    } else if (data.freeShippingThreshold > 100000) {
      errors.push('Free shipping threshold cannot exceed $100,000')
    }
  }

  // Estimated days validation
  if (data.estimatedDays && data.estimatedDays.length > 100) {
    errors.push('Estimated delivery days must be less than 100 characters')
  }

  // Max weight validation
  if (data.maxWeightKg !== undefined && data.maxWeightKg !== null) {
    if (typeof data.maxWeightKg !== 'number') {
      errors.push('Max weight must be a number')
    } else if (data.maxWeightKg <= 0) {
      errors.push('Max weight must be greater than 0')
    } else if (data.maxWeightKg > 10000) {
      errors.push('Max weight cannot exceed 10,000 kg')
    }
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate shipping rate update data
 */
function validateUpdateRateData(data: UpdateShippingRateRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('Rate name cannot be empty')
    } else if (data.name.trim().length < 2) {
      errors.push('Rate name must be at least 2 characters long')
    } else if (data.name.trim().length > 100) {
      errors.push('Rate name must be less than 100 characters')
    }
  }

  // Flat rate validation (if provided)
  if (data.flatRate !== undefined) {
    if (typeof data.flatRate !== 'number') {
      errors.push('Flat rate must be a number')
    } else if (data.flatRate < 0) {
      errors.push('Flat rate cannot be negative')
    } else if (data.flatRate > 10000) {
      errors.push('Flat rate cannot exceed $10,000')
    }
  }

  // Free shipping threshold validation (if provided)
  if (data.freeShippingThreshold !== undefined && data.freeShippingThreshold !== null) {
    if (typeof data.freeShippingThreshold !== 'number') {
      errors.push('Free shipping threshold must be a number')
    } else if (data.freeShippingThreshold < 0) {
      errors.push('Free shipping threshold cannot be negative')
    } else if (data.freeShippingThreshold > 100000) {
      errors.push('Free shipping threshold cannot exceed $100,000')
    }
  }

  // Estimated days validation (if provided)
  if (data.estimatedDays !== undefined && data.estimatedDays && data.estimatedDays.length > 100) {
    errors.push('Estimated delivery days must be less than 100 characters')
  }

  // Max weight validation (if provided)
  if (data.maxWeightKg !== undefined && data.maxWeightKg !== null) {
    if (typeof data.maxWeightKg !== 'number') {
      errors.push('Max weight must be a number')
    } else if (data.maxWeightKg <= 0) {
      errors.push('Max weight must be greater than 0')
    } else if (data.maxWeightKg > 10000) {
      errors.push('Max weight cannot exceed 10,000 kg')
    }
  }

  // Description validation (if provided)
  if (data.description !== undefined && data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format currency amount for display
 */
function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}