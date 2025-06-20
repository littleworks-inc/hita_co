import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { calculateCostBreakdown, calculateSellingPrice } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        country: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product GET error:', error)
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

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if SKU is being changed and already exists
    if (data.sku !== existingProduct.sku) {
      const skuExists = await db.product.findUnique({
        where: { sku: data.sku }
      })

      if (skuExists) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Get country for exchange rate if country is being updated
    let country = null
    if (data.countryId) {
      country = await db.country.findUnique({
        where: { id: data.countryId }
      })

      if (!country || !country.exchangeRate) {
        return NextResponse.json(
          { error: 'Invalid country or missing exchange rate' },
          { status: 400 }
        )
      }
    }

    // Recalculate costs if relevant fields changed
    let updatedData = { ...data }
    
    if (country && (
      data.originalPrice !== undefined ||
      data.quantity !== undefined ||
      data.gstPercentage !== undefined ||
      data.shippingCost !== undefined ||
      data.conversionCharges !== undefined ||
      data.additionalExpenses !== undefined ||
      data.profitMargin !== undefined ||
      data.discountPercentage !== undefined
    )) {
      const costCalc = calculateCostBreakdown(
        data.originalPrice ?? existingProduct.originalPrice,
        data.quantity ?? existingProduct.quantity,
        data.gstPercentage ?? existingProduct.gstPercentage,
        data.shippingCost ?? existingProduct.shippingCost,
        data.conversionCharges ?? existingProduct.conversionCharges,
        data.additionalExpenses ?? existingProduct.additionalExpenses,
        country.exchangeRate
      )

      const sellingPriceUSD = calculateSellingPrice(
        costCalc.costPriceUSD,
        data.profitMargin ?? existingProduct.profitMargin,
        data.discountPercentage ?? existingProduct.discountPercentage
      )

      updatedData = {
        ...updatedData,
        originalCurrency: country.currency,
        costPriceUSD: costCalc.costPriceUSD,
        piecePriceUSD: costCalc.piecePriceUSD,
        sellingPriceUSD: sellingPriceUSD
      }
    }

    // Update product
    const product = await db.product.update({
      where: { id: params.id },
      data: updatedData,
      include: {
        category: true,
        country: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product update error:', error)
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

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is used in any orders (optional safety check)
    const orderItems = await db.orderItem.findFirst({
      where: { productId: params.id }
    })

    if (orderItems) {
      return NextResponse.json(
        { error: 'Cannot delete product that has been ordered. Consider marking it inactive instead.' },
        { status: 400 }
      )
    }

    // Delete product
    await db.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}