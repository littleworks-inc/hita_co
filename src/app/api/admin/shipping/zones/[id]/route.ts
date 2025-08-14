// FIXED src/app/api/admin/shipping/zones/[id]/route.ts
// Updated to work with new explicit many-to-many relationship

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// =================
// INTERFACES
// =================

interface UpdateShippingZoneRequest {
  name?: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
  countryIds?: string[] // Countries to assign/reassign to this zone
}

interface RouteParams {
  params: {
    id: string
  }
}

// =================
// GET /api/admin/shipping/zones/[id] (FIXED)
// Fetch a specific shipping zone with full details
// =================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zoneId = params.id

    // Validate zone ID format
    if (!zoneId || typeof zoneId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid zone ID' },
        { status: 400 }
      )
    }

    // Fetch the shipping zone with all related data (FIXED)
    const zone = await db.shippingZone.findUnique({
      where: { id: zoneId },
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
          orderBy: { flatRate: 'asc' }
        },
        storeSettings: {
          select: {
            id: true,
            storeName: true
          }
        }
      }
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      )
    }

    // Format response (FIXED)
    const formattedZone = {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      isDefault: zone.isDefault,
      isActive: zone.isActive,
      countries: zone.zoneCountries.map(zc => ({
        id: zc.country.id,
        name: zc.country.name,
        code: zc.country.code,
        currency: zc.country.currency,
        currencySymbol: zc.country.currencySymbol
      })),
      shippingRates: zone.shippingRates.map(rate => ({
        id: rate.id,
        name: rate.name,
        flatRate: rate.flatRate,
        freeShippingThreshold: rate.freeShippingThreshold,
        estimatedDays: rate.estimatedDays,
        isActive: rate.isActive,
        maxWeightKg: rate.maxWeightKg
      })),
      isUsedAsDefault: zone.storeSettings.length > 0,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt
    }

    return NextResponse.json({
      success: true,
      zone: formattedZone
    })

  } catch (error) {
    console.error('Shipping zone GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping zone' },
      { status: 500 }
    )
  }
}

// =================
// PUT /api/admin/shipping/zones/[id] (FIXED)
// Update a specific shipping zone
// =================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zoneId = params.id
    const data: UpdateShippingZoneRequest = await request.json()

    // Validate zone ID
    if (!zoneId || typeof zoneId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid zone ID' },
        { status: 400 }
      )
    }

    // Check if zone exists (FIXED)
    const existingZone = await db.shippingZone.findUnique({
      where: { id: zoneId },
      include: {
        zoneCountries: {
          include: {
            country: true
          }
        },
        shippingRates: true
      }
    })

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      )
    }

    // Validate update data
    const validation = validateUpdateData(data)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check for name conflicts (if name is being updated)
    if (data.name && data.name.trim() !== existingZone.name) {
      const nameConflict = await db.shippingZone.findFirst({
        where: {
          name: {
            equals: data.name.trim(),
            mode: 'insensitive'
          },
          id: { not: zoneId }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A shipping zone with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Validate country assignments if provided (FIXED)
    let validCountryIds: string[] = []
    if (data.countryIds !== undefined) {
      if (data.countryIds.length > 0) {
        const validCountries = await db.country.findMany({
          where: {
            id: { in: data.countryIds },
            OR: [
              // Countries not assigned to any zone
              { countryZones: { none: {} } },
              // Countries already assigned to this zone
              { countryZones: { some: { shippingZoneId: zoneId } } }
            ]
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
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Handle default zone logic
    if (data.isDefault !== undefined) {
      updateData.isDefault = data.isDefault
      
      // If setting as default, remove default from other zones
      if (data.isDefault) {
        await db.shippingZone.updateMany({
          where: { 
            isDefault: true,
            id: { not: zoneId }
          },
          data: { isDefault: false }
        })
      }
    }

    // Update zone with transaction (FIXED)
    const updatedZone = await db.$transaction(async (tx) => {
      // Update the zone
      const zone = await tx.shippingZone.update({
        where: { id: zoneId },
        data: updateData
      })

      // Handle country reassignment if provided (FIXED)
      if (data.countryIds !== undefined) {
        // First, disconnect all current countries from this zone
        await tx.countryShippingZone.deleteMany({
          where: {
            shippingZoneId: zoneId
          }
        })

        // Then connect the new countries
        if (validCountryIds.length > 0) {
          await tx.countryShippingZone.createMany({
            data: validCountryIds.map(countryId => ({
              countryId,
              shippingZoneId: zoneId
            }))
          })
        }
      }

      // Update store settings if this zone is being set as default
      if (data.isDefault) {
        await tx.storeSetting.updateMany({
          where: { id: 'default' },
          data: { defaultShippingZoneId: zoneId }
        })
      }

      return zone
    })

    // Fetch updated zone with relations (FIXED)
    const finalZone = await db.shippingZone.findUnique({
      where: { id: zoneId },
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

    if (!finalZone) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated zone' },
        { status: 500 }
      )
    }

    // Format response (FIXED)
    const formattedZone = {
      id: finalZone.id,
      name: finalZone.name,
      description: finalZone.description,
      isDefault: finalZone.isDefault,
      isActive: finalZone.isActive,
      countries: finalZone.zoneCountries.map(zc => ({
        id: zc.country.id,
        name: zc.country.name,
        code: zc.country.code
      })),
      shippingRates: finalZone.shippingRates.map(rate => ({
        id: rate.id,
        name: rate.name,
        flatRate: rate.flatRate,
        freeShippingThreshold: rate.freeShippingThreshold,
        estimatedDays: rate.estimatedDays,
        isActive: rate.isActive
      })),
      createdAt: finalZone.createdAt,
      updatedAt: finalZone.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping zone updated successfully',
      zone: formattedZone
    })

  } catch (error) {
    console.error('Shipping zone update error:', error)
    return NextResponse.json(
      { error: 'Failed to update shipping zone' },
      { status: 500 }
    )
  }
}

// =================
// DELETE /api/admin/shipping/zones/[id] (FIXED)
// Delete a specific shipping zone
// =================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if zone exists and get details (FIXED)
    const existingZone = await db.shippingZone.findUnique({
      where: { id: zoneId },
      include: {
        zoneCountries: {
          include: {
            country: true
          }
        },
        shippingRates: true,
        storeSettings: true
      }
    })

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of default zone if it's being used in store settings
    if (existingZone.storeSettings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete shipping zone that is set as default in store settings. Please set a different default zone first.' },
        { status: 400 }
      )
    }

    // Prevent deletion if zone has active shipping rates
    const activeRates = existingZone.shippingRates.filter(rate => rate.isActive)
    if (activeRates.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete shipping zone that has ${activeRates.length} active shipping rate(s). Please deactivate or delete the rates first.` },
        { status: 400 }
      )
    }

    // Delete the zone with transaction (FIXED)
    const deletionResult = await db.$transaction(async (tx) => {
      // First, disconnect all countries from this zone (FIXED)
      if (existingZone.zoneCountries.length > 0) {
        await tx.countryShippingZone.deleteMany({
          where: {
            shippingZoneId: zoneId
          }
        })
      }

      // Delete all shipping rates for this zone
      await tx.shippingRate.deleteMany({
        where: { shippingZoneId: zoneId }
      })

      // Finally, delete the zone
      const deletedZone = await tx.shippingZone.delete({
        where: { id: zoneId }
      })

      return {
        deletedZone,
        unassignedCountries: existingZone.zoneCountries.map(zc => zc.country)
      }
    })

    // Get updated list of unassigned countries (FIXED)
    const unassignedCountries = await db.country.findMany({
      where: {
        countryZones: {
          none: {}
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      message: `Shipping zone "${existingZone.name}" deleted successfully`,
      deletedZone: {
        id: existingZone.id,
        name: existingZone.name
      },
      unassignedCountries: unassignedCountries.map(country => ({
        id: country.id,
        name: country.name,
        code: country.code,
        currency: country.currency,
        currencySymbol: country.currencySymbol
      }))
    })

  } catch (error) {
    console.error('Shipping zone deletion error:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Cannot delete shipping zone due to existing dependencies' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete shipping zone' },
      { status: 500 }
    )
  }
}

// =================
// HELPER FUNCTIONS
// =================

/**
 * Validate update data
 */
function validateUpdateData(data: UpdateShippingZoneRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Name validation
  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      errors.push('Zone name cannot be empty')
    } else if (data.name.trim().length < 2) {
      errors.push('Zone name must be at least 2 characters long')
    } else if (data.name.trim().length > 100) {
      errors.push('Zone name must be less than 100 characters')
    }
  }

  // Description validation
  if (data.description !== undefined && data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters')
  }

  // Country IDs validation
  if (data.countryIds !== undefined) {
    if (!Array.isArray(data.countryIds)) {
      errors.push('Country IDs must be an array')
    } else if (data.countryIds.length > 50) {
      errors.push('Cannot assign more than 50 countries at once')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if zone can be safely deleted
 */
async function canDeleteZone(zoneId: string): Promise<{
  canDelete: boolean
  reasons: string[]
}> {
  try {
    const zone = await db.shippingZone.findUnique({
      where: { id: zoneId },
      include: {
        shippingRates: { where: { isActive: true } },
        storeSettings: true
      }
    })

    if (!zone) {
      return { canDelete: false, reasons: ['Zone not found'] }
    }

    const reasons: string[] = []

    if (zone.storeSettings.length > 0) {
      reasons.push('Zone is set as default in store settings')
    }

    if (zone.shippingRates.length > 0) {
      reasons.push(`Zone has ${zone.shippingRates.length} active shipping rate(s)`)
    }

    return {
      canDelete: reasons.length === 0,
      reasons
    }

  } catch (error) {
    console.error('Error checking if zone can be deleted:', error)
    return { canDelete: false, reasons: ['Error checking zone dependencies'] }
  }
}