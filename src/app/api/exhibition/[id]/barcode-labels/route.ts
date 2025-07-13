// src/app/api/exhibition/[id]/barcode-labels/route.ts
// =====================================
// 🚀 Thermal Label Printing API
// Generate and manage barcode labels for exhibition products
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

interface LabelRequest {
  productIds: string[]
  labelSize: string
  copies: number
  includeProductName: boolean
  includePrice: boolean
  includeSku: boolean
  includeCategory: boolean
  customText?: string
  printDensity: string
}

interface LabelData {
  id: string
  name: string
  sku: string
  barcode: string
  price: number
  category: string
  exhibitionPrice?: number
  finalPrice: number
}

// Thermal Label Sizes (in mm)
const LABEL_SIZES = {
  '30x20': { width: 30, height: 20, name: '30×20mm (Small)' },
  '40x30': { width: 40, height: 30, name: '40×30mm (Medium)' },
  '50x30': { width: 50, height: 30, name: '50×30mm (Standard)' },
  '60x40': { width: 60, height: 40, name: '60×40mm (Large)' },
  '70x50': { width: 70, height: 50, name: '70×50mm (Extra Large)' },
  '100x50': { width: 100, height: 50, name: '100×50mm (Wide)' }
}

// Print Density Options
const PRINT_DENSITIES = {
  '203': { dpi: 203, name: '203 DPI (Standard)' },
  '300': { dpi: 300, name: '300 DPI (High Quality)' },
  '600': { dpi: 600, name: '600 DPI (Ultra High)' }
}

// Generate ZPL code for thermal printers
function generateZPLCode(product: LabelData, settings: LabelRequest): string {
  const labelDimensions = LABEL_SIZES[settings.labelSize as keyof typeof LABEL_SIZES]
  const dpi = PRINT_DENSITIES[settings.printDensity as keyof typeof PRINT_DENSITIES].dpi

  if (!labelDimensions) {
    throw new Error(`Invalid label size: ${settings.labelSize}`)
  }

  // Convert mm to dots (1mm = dpi/25.4)
  const mmToDots = (mm: number) => Math.round((mm * dpi) / 25.4)

  const width = mmToDots(labelDimensions.width)
  const height = mmToDots(labelDimensions.height)

  let zpl = `^XA\n` // Start of label
  zpl += `^LH0,0\n` // Label home position
  zpl += `^LL${height}\n` // Label length

  let yPos = 20
  const centerX = Math.floor(width / 2)

  // Product name
  if (settings.includeProductName && product.name) {
    const maxNameLength = 25 // Truncate long names
    const displayName = product.name.length > maxNameLength 
      ? product.name.substring(0, maxNameLength) + '...' 
      : product.name
    zpl += `^FO${centerX - 100},${yPos}^A0N,25,25^FD${displayName}^FS\n`
    yPos += 40
  }

  // Barcode
  if (product.barcode) {
    zpl += `^FO${centerX - 100},${yPos}^BY2^BCN,40,Y,N,N^FD${product.barcode}^FS\n`
    yPos += 60
  }

  // SKU
  if (settings.includeSku && product.sku) {
    zpl += `^FO${centerX - 80},${yPos}^A0N,20,20^FDSKU: ${product.sku}^FS\n`
    yPos += 30
  }

  // Price (use exhibition price if available, otherwise regular price)
  if (settings.includePrice) {
    const displayPrice = product.finalPrice || product.price
    zpl += `^FO${centerX - 60},${yPos}^A0N,30,30^FD${displayPrice.toFixed(2)}^FS\n`
    yPos += 40
  }

  // Category
  if (settings.includeCategory && product.category) {
    zpl += `^FO${centerX - 50},${yPos}^A0N,18,18^FD${product.category}^FS\n`
    yPos += 25
  }

  // Custom text
  if (settings.customText && settings.customText.trim()) {
    zpl += `^FO${centerX - 80},${yPos}^A0N,18,18^FD${settings.customText}^FS\n`
  }

  zpl += `^XZ\n` // End of label

  return zpl
}

// POST - Generate barcode labels for selected products
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    const labelRequest: LabelRequest = await request.json()

    // Validate request
    if (!labelRequest.productIds || labelRequest.productIds.length === 0) {
      return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 })
    }

    if (labelRequest.productIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 products per request' }, { status: 400 })
    }

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { id: true, title: true, isActive: true }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get exhibition products with full product details
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: {
        exhibitionId,
        id: { in: labelRequest.productIds }
      },
      include: {
        product: {
          include: {
            category: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (exhibitionProducts.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 404 })
    }

    // Transform to label data format
    const labelData: LabelData[] = exhibitionProducts.map(ep => {
      const product = ep.product
      
      // Calculate final price with exhibition discounts
      const originalPrice = ep.originalPrice || product.sellingPriceUSD
      const exhibitionPrice = ep.exhibitionPrice || originalPrice
      const discountPercentage = ep.discountPercentage || 0
      const finalPrice = discountPercentage > 0
        ? exhibitionPrice * (1 - discountPercentage / 100)
        : exhibitionPrice

      return {
        id: ep.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || `SKU${product.sku}`, // Fallback barcode
        price: originalPrice,
        category: product.category?.name || 'Uncategorized',
        exhibitionPrice,
        finalPrice
      }
    })

    // Generate ZPL codes for all products
    const zplCodes: { productId: string; productName: string; zplCode: string; copies: number }[] = []
    
    for (const product of labelData) {
      try {
        const zplCode = generateZPLCode(product, labelRequest)
        zplCodes.push({
          productId: product.id,
          productName: product.name,
          zplCode,
          copies: labelRequest.copies
        })
      } catch (error) {
        console.error(`Error generating ZPL for product ${product.id}:`, error)
        // Continue with other products instead of failing completely
      }
    }

    // Generate combined ZPL file content
    let combinedZPL = ''
    zplCodes.forEach(item => {
      for (let copy = 1; copy <= item.copies; copy++) {
        combinedZPL += item.zplCode + '\n\n'
      }
    })

    const totalLabels = zplCodes.reduce((sum, item) => sum + item.copies, 0)

    return NextResponse.json({
      success: true,
      exhibition: {
        id: exhibition.id,
        title: exhibition.title
      },
      labelSettings: {
        labelSize: labelRequest.labelSize,
        printDensity: labelRequest.printDensity,
        copies: labelRequest.copies
      },
      products: labelData,
      zplCodes,
      combinedZPL,
      stats: {
        totalProducts: labelData.length,
        totalLabels,
        generatedSuccessfully: zplCodes.length,
        failed: labelData.length - zplCodes.length
      }
    })

  } catch (error) {
    console.error('Barcode label generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate barcode labels' },
      { status: 500 }
    )
  }
}

// GET - Get exhibition products suitable for label printing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitionId = params.id
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const inStock = searchParams.get('inStock') === 'true'
    const hasBarcode = searchParams.get('hasBarcode') === 'true'

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { id: true, title: true, isActive: true }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Build filter conditions
    const whereConditions: any = {
      exhibitionId
    }

    if (inStock) {
      whereConditions.quantityTaken = { gt: 0 }
      whereConditions.quantitySold = { lt: { $ref: 'quantityTaken' } }
    }

    if (hasBarcode) {
      whereConditions.product = {
        barcode: { not: null }
      }
    }

    if (category) {
      whereConditions.product = {
        ...whereConditions.product,
        category: { name: category }
      }
    }

    // Get exhibition products
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: whereConditions,
      include: {
        product: {
          include: {
            category: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: [
        { product: { category: { name: 'asc' } } },
        { product: { name: 'asc' } }
      ]
    })

    // Transform for label printing interface
    const productsForLabels = exhibitionProducts.map(ep => {
      const product = ep.product
      const availableStock = ep.quantityTaken - ep.quantitySold
      
      // Calculate pricing
      const originalPrice = ep.originalPrice || product.sellingPriceUSD
      const exhibitionPrice = ep.exhibitionPrice || originalPrice
      const discountPercentage = ep.discountPercentage || 0
      const finalPrice = discountPercentage > 0
        ? exhibitionPrice * (1 - discountPercentage / 100)
        : exhibitionPrice

      return {
        id: ep.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || `SKU${product.sku}`,
        price: originalPrice,
        finalPrice,
        category: product.category?.name || 'Uncategorized',
        availableStock,
        hasDiscount: discountPercentage > 0,
        discountPercentage,
        canPrint: true // All products can have labels printed
      }
    })

    // Get available categories for filtering
    const categories = [...new Set(productsForLabels.map(p => p.category))].sort()

    return NextResponse.json({
      success: true,
      exhibition: {
        id: exhibition.id,
        title: exhibition.title
      },
      products: productsForLabels,
      categories,
      stats: {
        totalProducts: productsForLabels.length,
        inStockProducts: productsForLabels.filter(p => p.availableStock > 0).length,
        productsWithBarcodes: productsForLabels.filter(p => p.barcode && !p.barcode.startsWith('SKU')).length,
        categoriesCount: categories.length
      }
    })

  } catch (error) {
    console.error('Get products for labels error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products for label printing' },
      { status: 500 }
    )
  }