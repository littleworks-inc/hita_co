import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplier = await db.supplier.findUnique({
      where: { id: params.id },
      include: {
        products: {
          include: {
            category: true,
            country: true
          }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Supplier GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Check if supplier exists
    const existingSupplier = await db.supplier.findUnique({
      where: { id: params.id }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    // Check if name is being changed and already exists
    if (data.name.trim() !== existingSupplier.name) {
      const nameExists = await db.supplier.findUnique({
        where: { name: data.name.trim() }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Supplier with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update supplier
    const supplier = await db.supplier.update({
      where: { id: params.id },
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

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Supplier update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if supplier exists
    const existingSupplier = await db.supplier.findUnique({
      where: { id: params.id },
      include: {
        products: {
          select: { id: true }
        }
      }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if supplier has products
    if (existingSupplier.products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing products. Please reassign or delete products first.' },
        { status: 400 }
      )
    }

    // Delete supplier
    await db.supplier.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Supplier deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}