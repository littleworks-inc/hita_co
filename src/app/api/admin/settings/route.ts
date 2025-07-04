// ✅ COMPLETE: src/app/api/admin/settings/route.ts - Fixed catalog mode save issue

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET: Fetch store settings
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get store settings (create default if doesn't exist)
    let storeSettings = await db.storeSettings.findFirst({
      where: { id: 'default' }
    })

    if (!storeSettings) {
      // Create default settings
      storeSettings = await db.storeSettings.create({
        data: {
          id: 'default',
          storeName: 'Hita&Co',
          tagline: 'Authentic Handcrafted Products',
          primaryColor: '#1f2937',
          secondaryColor: '#ffffff',
          accentColor: '#f59e0b',
          email: 'admin@hitaco.com',
          currency: 'USD',
          timezone: 'America/New_York',
          disableShoppingCart: false,
          catalogModeSettings: JSON.stringify({
            whatsappNumber: '',
            instagramHandle: '',
            contactMessage: 'Hi! I\'m interested in this product. Can you provide more details?',
            showWhatsApp: true,
            showInstagram: true,
            customContactText: 'Contact us for pricing and availability'
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      storeSettings
    })

  } catch (error) {
    console.error('Store settings fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch store settings',
        storeSettings: {
          storeName: 'Hita&Co',
          primaryColor: '#1f2937'
        }
      },
      { status: 500 }
    )
  }
}

// PUT: Update store settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('📝 Received settings update:', data)

    // Validate required fields
    if (!data.storeName?.trim()) {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate color formats
    const colorFields = ['primaryColor', 'secondaryColor', 'accentColor']
    for (const field of colorFields) {
      if (data[field] && !/^#[0-9A-F]{6}$/i.test(data[field])) {
        return NextResponse.json(
          { error: `Invalid color format for ${field}. Use format #RRGGBB` },
          { status: 400 }
        )
      }
    }

    // Validate catalog mode settings if provided
    if (data.catalogModeSettings) {
      try {
        const catalogSettings = JSON.parse(data.catalogModeSettings)
        
        // Validate WhatsApp number format if provided
        if (catalogSettings.whatsappNumber && catalogSettings.whatsappNumber.trim()) {
          const cleanNumber = catalogSettings.whatsappNumber.replace(/\D/g, '')
          if (cleanNumber.length < 10) {
            return NextResponse.json(
              { error: 'WhatsApp number must be at least 10 digits' },
              { status: 400 }
            )
          }
        }

        // Validate Instagram handle if provided
        if (catalogSettings.instagramHandle && catalogSettings.instagramHandle.trim()) {
          const cleanHandle = catalogSettings.instagramHandle.replace('@', '')
          if (!/^[a-zA-Z0-9_.]+$/.test(cleanHandle)) {
            return NextResponse.json(
              { error: 'Instagram handle can only contain letters, numbers, dots, and underscores' },
              { status: 400 }
            )
          }
        }

      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid catalog mode settings format' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      storeName: data.storeName.trim(),
      tagline: data.tagline?.trim() || null,
      logo: data.logo?.trim() || null,
      favicon: data.favicon?.trim() || null,
      primaryColor: data.primaryColor || '#1f2937',
      secondaryColor: data.secondaryColor || '#ffffff',
      accentColor: data.accentColor || '#f59e0b',
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      instagram: data.instagram?.trim() || null,
      facebook: data.facebook?.trim() || null,
      pinterest: data.pinterest?.trim() || null,
      twitter: data.twitter?.trim() || null,
      aiProvider: data.aiProvider?.trim() || null,
      aiApiKey: data.aiApiKey?.trim() || null,
      aiModel: data.aiModel?.trim() || null,
      currency: data.currency || 'USD',
      timezone: data.timezone || 'America/New_York',
      returnsEnabled: data.returnsEnabled ?? true,
      returnPeriodDays: data.returnPeriodDays || 30,
      returnPolicyUrl: data.returnPolicyUrl?.trim() || null,
      hasRestockingFee: data.hasRestockingFee || false,
      restockingFeePercentage: data.restockingFeePercentage || 0,
      returnPolicyDescription: data.returnPolicyDescription?.trim() || null,
      noReturnsReason: data.noReturnsReason?.trim() || null,
      // ✅ CATALOG MODE FIELDS
      disableShoppingCart: data.disableShoppingCart ?? false,
      catalogModeSettings: data.catalogModeSettings || null
    }

    console.log('📝 Prepared update data:', updateData)

    // Update store settings using upsert to handle both create and update
    const updatedSettings = await db.storeSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...updateData
      },
      update: updateData
    })

    console.log('✅ Store settings updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      storeSettings: updatedSettings
    })

  } catch (error) {
    console.error('❌ Store settings update error:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A store setting with this configuration already exists' },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid reference in store settings' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update store settings. Please try again.' },
      { status: 500 }
    )
  }
}