import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where: whereClause,
        include: {
          products: {
            select: { id: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.supplier.count({ where: whereClause })
    ])

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Suppliers GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    // Check if supplier name already exists
    const existingSupplier = await db.supplier.findUnique({
      where: { name: data.name.trim() }
    })

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this name already exists' },
        { status: 400 }
      )
    }

    // Create supplier
    const supplier = await db.supplier.create({
      data: {
        name: data.name.trim(),
        contactPerson: data.contactPerson?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || null,
        pincode: data.pincode?.trim() || null,
        businessType: data.businessType?.trim() || null,
        gstNumber: data.gstNumber?.trim() || null,
        panNumber: data.panNumber?.trim() || null,
        bankName: data.bankName?.trim() || null,
        accountNumber: data.accountNumber?.trim() || null,
        ifscCode: data.ifscCode?.trim() || null,
        notes: data.notes?.trim() || null,
        rating: data.rating || null,
        isActive: data.isActive ?? true
      },
      include: {
        products: {
          select: { id: true }
        }
      }
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Supplier creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}