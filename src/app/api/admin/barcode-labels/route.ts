// src/app/api/admin/barcode-labels/route.ts
// 🔧 SIMPLIFIED: Only CODE128 barcode format - removed multiple format handling
// Handle barcode label printing for admin product management

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

interface AdminLabelRequest {
  productIds: string[]
  labelSize: string
  printDensity: string
  copies: number
  includeProductName: boolean
  includePrice: boolean
  includeSku: boolean
  includeCategory: boolean
  includeSizes: boolean
  customText?: string
}

interface ProductLabelData {
  id: string
  name: string
  sku: string
  barcode: string | null
  sellingPriceUSD: number
  stockQuantity: number
  category: { name: string }
  requiresSizes: boolean
  productSizes?: Array<{
    id: string
    size: string
    sku: string
    stockQuantity: number
  }>
}

// Label size configurations
const LABEL_SIZES = {
  '30x20': { width: 30, height: 20, name: '30×20mm (Small)' },
  '40x30': { width: 40, height: 30, name: '40×30mm (Medium)' },
  '50x30': { width: 50, height: 30, name: '50×30mm (Standard)' },
  '60x40': { width: 60, height: 40, name: '60×40mm (Large)' },
  '70x50': { width: 70, height: 50, name: '70×50mm (Extra Large)' },
  '100x50': { width: 100, height: 50, name: '100×50mm (Wide)' }
}

const PRINT_DENSITIES = {
  '203': { dpi: 203, name: '203 DPI (Standard)' },
  '300': { dpi: 300, name: '300 DPI (High Quality)' },
  '600': { dpi: 600, name: '600 DPI (Ultra High)' }
}

// Generate ZPL code for thermal printers (CODE128 only)
function generateZPLCode(product: ProductLabelData, settings: AdminLabelRequest): string {
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
    const maxNameLength = settings.labelSize === '30x20' ? 15 : 
                         settings.labelSize === '40x30' ? 20 : 25
    const displayName = product.name.length > maxNameLength 
      ? product.name.substring(0, maxNameLength) + '...' 
      : product.name
    zpl += `^FO${centerX - 80},${yPos}^A0N,20,20^FD${displayName}^FS\n`
    yPos += 30
  }

  // CODE128 Barcode - always use CODE128 format
  const barcodeData = product.barcode || product.sku
  const barcodeWidth = settings.labelSize === '30x20' ? width - 20 : width - 40
  const barcodeHeight = Math.min(60, height - yPos - 40)
  
  zpl += `^FO${centerX - Math.floor(barcodeWidth/2)},${yPos}^BCN,${barcodeHeight},Y,N,N^FD${barcodeData}^FS\n`
  yPos += barcodeHeight + 10

  // Price
  if (settings.includePrice) {
    zpl += `^FO${centerX - 40},${yPos}^A0N,18,18^FD$${product.sellingPriceUSD.toFixed(2)}^FS\n`
    yPos += 25
  }

  // SKU
  if (settings.includeSku) {
    zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FDSKU: ${product.sku}^FS\n`
    yPos += 20
  }

  // Category
  if (settings.includeCategory) {
    zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FD${product.category.name}^FS\n`
    yPos += 20
  }

  // Sizes (if product has sizes)
  if (settings.includeSizes && product.requiresSizes && product.productSizes?.length) {
    const sizeText = product.productSizes.map(s => s.size).join(', ')
    const truncatedSizes = sizeText.length > 20 ? 
      sizeText.substring(0, 20) + '...' : sizeText
    zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FDSizes: ${truncatedSizes}^FS\n`
    yPos += 25
  }

  // Stock quantity
  zpl += `^FO${centerX - 40},${yPos}^A0N,16,16^FDStock: ${product.stockQuantity}^FS\n`
  yPos += 25

  // Custom text
  if (settings.customText && settings.customText.trim()) {
    zpl += `^FO${centerX - 80},${yPos}^A0N,18,18^FD${settings.customText}^FS\n`
  }

  // Barcode format indicator
  zpl += `^FO10,${height - 20}^A0N,12,12^FDCODE128^FS\n`

  zpl += `^XZ\n` // End of label
  return zpl
}

// GET - Fetch products for barcode printing
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const inStockOnly = searchParams.get('inStockOnly') === 'true'
    const hasBarcode = searchParams.get('hasBarcode') === 'true'

    // Build where clause for filtering
    const where: any = {
      isActive: true
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Category filter
    if (category) {
      where.category = { name: category }
    }

    // Stock filter
    if (inStockOnly) {
      where.stockQuantity = { gt: 0 }
    }

    // Barcode filter
    if (hasBarcode) {
      where.barcode = { not: null }
    }

    // Fetch products
    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { name: true }
        },
        productSizes: {
          select: {
            id: true,
            size: true,
            sku: true,
            stockQuantity: true
          },
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get categories for filter dropdown
    const categories = await db.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    })

    const stats = {
      totalProducts: products.length,
      inStockProducts: products.filter(p => p.stockQuantity > 0).length,
      productsWithBarcodes: products.filter(p => p.barcode).length,
      categoriesCount: categories.length,
      barcodeFormat: 'CODE128' // Always CODE128
    }

    return NextResponse.json({
      products,
      categories: categories.map(c => c.name),
      stats
    })

  } catch (error) {
    console.error('Error fetching products for barcode printing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Generate CODE128 barcode labels
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const labelRequest: AdminLabelRequest = await request.json()

    // Validate request
    if (!labelRequest.productIds || labelRequest.productIds.length === 0) {
      return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 })
    }

    if (labelRequest.productIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 products per request' }, { status: 400 })
    }

    // Validate label size
    if (!LABEL_SIZES[labelRequest.labelSize as keyof typeof LABEL_SIZES]) {
      return NextResponse.json({ error: 'Invalid label size' }, { status: 400 })
    }

    // Validate print density
    if (!PRINT_DENSITIES[labelRequest.printDensity as keyof typeof PRINT_DENSITIES]) {
      return NextResponse.json({ error: 'Invalid print density' }, { status: 400 })
    }

    // Fetch products
    const products = await db.product.findMany({
      where: {
        id: { in: labelRequest.productIds },
        isActive: true
      },
      include: {
        category: {
          select: { name: true }
        },
        productSizes: {
          select: {
            id: true,
            size: true,
            sku: true,
            stockQuantity: true
          },
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (products.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 404 })
    }

    // Generate ZPL code for all products
    let zplContent = ''
    let totalLabels = 0

    for (const product of products) {
      for (let copy = 0; copy < labelRequest.copies; copy++) {
        try {
          zplContent += generateZPLCode(product, labelRequest) + '\n'
          totalLabels++
        } catch (error) {
          console.error(`Error generating ZPL for product ${product.id}:`, error)
        }
      }
    }

    if (zplContent === '') {
      return NextResponse.json({ error: 'Failed to generate any labels' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      zplContent,
      totalLabels,
      format: 'CODE128',
      labelSize: labelRequest.labelSize,
      printDensity: labelRequest.printDensity,
      productsProcessed: products.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating barcode labels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}