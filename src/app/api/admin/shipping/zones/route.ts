// FIXED src/app/api/admin/shipping/zones/route.ts
// Updated to work with new explicit many-to-many relationship

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

// =================
// INTERFACES (Updated)
// =================

interface CreateShippingZoneRequest {
  name: string
  description?: string
  isDefault?: boolean
  countryIds?: string[] // Optional country assignment during creation
}

interface ShippingZoneResponse {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  countries: Array<{
    id: string
    name: string
    code: string
  }>
  shippingRates: Array<{
    id: string
    name: string
    flatRate: number
    freeShippingThreshold: number | null
    estimatedDays: string | null
    isActive: boolean
  }>
  createdAt: Date
  updatedAt: Date
}

// =================
// GET /api/admin/shipping/zones (FIXED)
// Fetch all shipping zones with their countries and rates
// =================

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get shipping zones with their related data (FIXED)
    const zones = await db.shippingZone.findMany({
      include: {
        zoneCountries: {
          include: {
            country: true
          },
          orderBy: {
            country: {
              name: 'asc'
            }
          }
        },
        shippingRates: {
          where: { isActive: true },
          orderBy: { flatRate: 'asc' }
        }
      },
      orderBy: [
        { isDefault: 'desc' }, // Default zones first
        { name: 'asc' }
      ]
    })

    // Get unassigned countries (FIXED)
    const unassignedCountries = await db.country.findMany({
      where: {
        countryZones: {
          none: {}
        }
      },
      orderBy: { name: 'asc' }
    })

    // Format response (FIXED)
    const formattedZones: ShippingZoneResponse[] = zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      description: zone.description,
      isDefault: zone.isDefault,
      isActive: zone.isActive,
      countries: zone.zoneCountries.map(zc => ({
        id: zc.country.id,
        name: zc.country.name,
        code: zc.country.code
      })),
      shippingRates: zone.shippingRates.map(rate => ({
        id: rate.id,
        name: rate.name,
        flatRate: rate.flatRate,
        freeShippingThreshold: rate.freeShippingThreshold,
        estimatedDays: rate.estimatedDays,
        isActive: rate.isActive
      })),
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt
    }))

    return NextResponse.json({
      success: true,
      zones: formattedZones,
      unassignedCountries: unassignedCountries.map(country => ({
        id: country.id,
        name: country.name,
        code: country.code,
        currency: country.currency,
        currencySymbol: country.currencySymbol
      }))
    })

  } catch (error) {
    console.error('Shipping zones GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping zones' },
      { status: 500 }
    )
  }
}

// =================
// POST /api/admin/shipping/zones (FIXED)
// Create a new shipping zone
// =================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: CreateShippingZoneRequest = await request.json()

    // Validation
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 }
      )
    }

    if (data.name.trim().length < 2 || data.name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Zone name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    // Check if zone name already exists
    const existingZone = await db.shippingZone.findFirst({
      where: {
        name: {
          equals: data.name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingZone) {
      return NextResponse.json(
        { error: 'A shipping zone with this name already exists' },
        { status: 400 }
      )
    }

    // If setting as default, remove default from other zones
    if (data.isDefault) {
      await db.shippingZone.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    // Validate country IDs if provided (FIXED)
    let validCountryIds: string[] = []
    if (data.countryIds && data.countryIds.length > 0) {
      const validCountries = await db.country.findMany({
        where: {
          id: { in: data.countryIds },
          // Ensure countries are not already assigned to other zones
          countryZones: {
            none: {}
          }
        },
        select: { id: true }
      })

      if (validCountries.length !== data.countryIds.length) {
        return NextResponse.json(
          { error: 'Some countries are invalid or already assigned to other zones' },
          { status: 400 }
        )
      }

      validCountryIds = validCountries.map(c => c.id)
    }

    // Create the shipping zone with transaction (FIXED)
    const newZone = await db.$transaction(async (tx) => {
      // Create the zone
      const zone = await tx.shippingZone.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          isDefault: data.isDefault || false,
          isActive: true
        }
      })

      // Assign countries if provided (FIXED)
      if (validCountryIds.length > 0) {
        await tx.countryShippingZone.createMany({
          data: validCountryIds.map(countryId => ({
            countryId,
            shippingZoneId: zone.id
          }))
        })
      }

      // If this is the default zone, update store settings
      if (data.isDefault) {
        await tx.storeSetting.updateMany({
          where: { id: 'default' },
          data: { defaultShippingZoneId: zone.id }
        })
      }

      return zone
    })

    // Fetch the created zone with its relations (FIXED)
    const createdZone = await db.shippingZone.findUnique({
      where: { id: newZone.id },
      include: {
        zoneCountries: {
          include: {
            country: true
          },
          orderBy: {
            country: {
              name: 'asc'
            }
          }
        },
        shippingRates: {
          where: { isActive: true },
          orderBy: { flatRate: 'asc' }
        }
      }
    })

    if (!createdZone) {
      return NextResponse.json(
        { error: 'Failed to retrieve created zone' },
        { status: 500 }
      )
    }

    // Format response (FIXED)
    const formattedZone: ShippingZoneResponse = {
      id: createdZone.id,
      name: createdZone.name,
      description: createdZone.description,
      isDefault: createdZone.isDefault,
      isActive: createdZone.isActive,
      countries: createdZone.zoneCountries.map(zc => ({
        id: zc.country.id,
        name: zc.country.name,
        code: zc.country.code
      })),
      shippingRates: createdZone.shippingRates.map(rate => ({
        id: rate.id,
        name: rate.name,
        flatRate: rate.flatRate,
        freeShippingThreshold: rate.freeShippingThreshold,
        estimatedDays: rate.estimatedDays,
        isActive: rate.isActive
      })),
      createdAt: createdZone.createdAt,
      updatedAt: createdZone.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping zone created successfully',
      zone: formattedZone
    }, { status: 201 })

  } catch (error) {
    console.error('Shipping zone creation error:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A shipping zone with this name already exists' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create shipping zone' },
      { status: 500 }
    )
  }
}

// =================
// HELPER FUNCTIONS
// =================

/**
 * Validate shipping zone data
 */
function validateShippingZoneData(data: CreateShippingZoneRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Zone name is required')
  } else if (data.name.trim().length < 2) {
    errors.push('Zone name must be at least 2 characters long')
  } else if (data.name.trim().length > 100) {
    errors.push('Zone name must be less than 100 characters')
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters')
  }

  // Country IDs validation
  if (data.countryIds && !Array.isArray(data.countryIds)) {
    errors.push('Country IDs must be an array')
  }

  if (data.countryIds && data.countryIds.length > 50) {
    errors.push('Cannot assign more than 50 countries at once')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Log shipping zone operation for audit
 */
function logShippingZoneOperation(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  zoneName: string,
  userId?: string
): void {
  try {
    console.log(`[SHIPPING_ZONE_${operation}]`, {
      zoneName,
      userId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Ignore logging errors
    console.warn('Failed to log shipping zone operation:', error)
  }
}