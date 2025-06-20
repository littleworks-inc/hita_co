import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateSKU, calculateCostBreakdown, calculateSellingPrice } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      whereClause.categoryId = category
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where: whereClause,
        include: {
          category: true,
          country: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.product.count({ where: whereClause })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Products GET error:', error)
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
    if (!data.name || !data.sku || !data.categoryId || !data.countryId || !data.supplierId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, category, country, and supplier are required' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingProduct = await db.product.findUnique({
      where: { sku: data.sku }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }

    // Get country for exchange rate
    const country = await db.country.findUnique({
      where: { id: data.countryId }
    })

    if (!country || !country.exchangeRate) {
      return NextResponse.json(
        { error: 'Invalid country or missing exchange rate' },
        { status: 400 }
      )
    }

    // Calculate costs
    const costCalc = calculateCostBreakdown(
      data.originalPrice,
      data.quantity,
      data.gstPercentage || 0,
      data.shippingCost || 0,
      data.conversionCharges || 0,
      data.additionalExpenses || 0,
      country.exchangeRate
    )

    const sellingPriceUSD = calculateSellingPrice(
      costCalc.costPriceUSD,
      data.profitMargin || 0,
      data.discountPercentage || 0
    )

    // Create product
    const product = await db.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        categoryId: data.categoryId,
        countryId: data.countryId,
        
        // Supplier information
        supplierId: data.supplierId,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        invoiceNumber: data.invoiceNumber || null,
        
        originalPrice: data.originalPrice,
        originalCurrency: country.currency,
        quantity: data.quantity,
        gstPercentage: data.gstPercentage || 0,
        shippingCost: data.shippingCost || 0,
        conversionCharges: data.conversionCharges || 0,
        additionalExpenses: data.additionalExpenses || 0,
        costPriceUSD: costCalc.costPriceUSD,
        piecePriceUSD: costCalc.piecePriceUSD,
        profitMargin: data.profitMargin || 0,
        discountPercentage: data.discountPercentage || 0,
        sellingPriceUSD: sellingPriceUSD,
        stockQuantity: data.stockQuantity || 0,
        lowStockAlert: data.lowStockAlert || 5,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        tags: data.tags || [],
        images: data.images || []
      },
      include: {
        category: true,
        country: true,
        supplier: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}