// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET: Fetch store settings (NEW METHOD)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get store settings (create default if doesn't exist)
    let storeSettings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    if (!storeSettings) {
      // Create default settings with LittleWorks Inc as default
      storeSettings = await db.storeSetting.create({
        data: {
          id: 'default',
          storeName: 'LittleWorks Inc', // Default company name as requested
          tagline: 'Building Digital Solutions',
          primaryColor: '#1f2937',
          secondaryColor: '#ffffff',
          accentColor: '#f59e0b',
          email: 'admin@littleworks.inc',
          currency: 'USD',
          timezone: 'America/New_York',
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
          storeName: 'LittleWorks Inc', // Fallback default
          primaryColor: '#1f2937'
        }
      },
      { status: 500 }
    )
  }
}

// PUT: Update store settings (EXISTING METHOD)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

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
          { error: `Invalid color format for ${field}. Please use hex format (e.g., #ffffff)` },
          { status: 400 }
        )
      }
    }

    // Validate URL formats for social media links
    const urlFields = ['instagram', 'facebook', 'pinterest', 'twitter']
    for (const field of urlFields) {
      if (data[field] && data[field].trim()) {
        try {
          new URL(data[field])
        } catch {
          return NextResponse.json(
            { error: `Invalid URL format for ${field}` },
            { status: 400 }
          )
        }
      }
    }

    // Get existing settings or create default
    let existingSettings = await db.storeSetting.findFirst({
      where: { id: 'default' }
    })

    const updateData = {
      storeName: data.storeName.trim(),
      tagline: data.tagline?.trim() || null,
      logo: data.logo?.trim() || null,
      favicon: data.favicon?.trim() || null,
      primaryColor: data.primaryColor || '#1f2937',
      secondaryColor: data.secondaryColor || '#ffffff',
      accentColor: data.accentColor || '#f59e0b',
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address || null,
      instagram: data.instagram?.trim() || null,
      facebook: data.facebook?.trim() || null,
      pinterest: data.pinterest?.trim() || null,
      twitter: data.twitter?.trim() || null,
      aiProvider: data.aiProvider?.trim() || null,
      aiApiKey: data.aiApiKey?.trim() || null,
      aiModel: data.aiModel?.trim() || null,
      currency: data.currency || 'USD',
      timezone: data.timezone || 'America/New_York'
    }

    let storeSettings
    if (existingSettings) {
      // Update existing settings
      storeSettings = await db.storeSetting.update({
        where: { id: 'default' },
        data: updateData
      })
    } else {
      // Create new settings with LittleWorks Inc default
      storeSettings = await db.storeSetting.create({
        data: {
          id: 'default',
          storeName: 'LittleWorks Inc', // Ensure default even on create
          ...updateData
        }
      })
    }

    return NextResponse.json({
      success: true,
      storeSettings
    })

  } catch (error) {
    console.error('Store settings UPDATE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}