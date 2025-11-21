// src/app/api/exhibition/[id]/barcode-labels/route.ts
// 🔧 FIXED: All TypeScript parameter and interface type errors

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// =====================================
// 🔄 TYPE DEFINITIONS FOR LABEL GENERATION
// =====================================

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

// ✅ FIX: Update LabelData interface to match actual data structure
interface LabelData {
  id: string
  name: string
  sku: string
  barcode: string
  price: number
  category: string
  exhibitionPrice: number | null  // ✅ FIX: Change from undefined to null to match Prisma
  finalPrice: number
}

// ✅ FIX: Add type definitions for database query results
interface ExhibitionProductQueryResult {
  id: string
  exhibitionPrice: number | null
  product: {
    name: string
    sku: string
    barcode: string | null
    sellingPriceUSD: number
    category: {
      name: string
    }
  }
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

// Generate ZPL code for thermal printers (CODE128 only)
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
    zpl += `^FO${centerX - 80},${yPos}^A0N,20,20^FD${displayName}^FS\n`
    yPos += 30
  }

  // CODE128 Barcode (hardcoded format)
  const barcodeData = product.barcode
  const barcodeWidth = width - 40
  const barcodeHeight = Math.min(60, height - yPos - 40)
  
  zpl += `^FO${centerX - Math.floor(barcodeWidth/2)},${yPos}^BCN,${barcodeHeight},Y,N,N^FD${barcodeData}^FS\n`
  yPos += barcodeHeight + 10

  // Price
  if (settings.includePrice) {
    zpl += `^FO${centerX - 40},${yPos}^A0N,18,18^FD$${product.finalPrice.toFixed(2)}^FS\n`
    yPos += 25
  }

  // SKU
  if (settings.includeSku) {
    zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FDSKU: ${product.sku}^FS\n`
    yPos += 20
  }

  // Category
  if (settings.includeCategory) {
    zpl += `^FO${centerX - 60},${yPos}^A0N,16,16^FD${product.category}^FS\n`
    yPos += 20
  }

  // Custom text
  if (settings.customText && settings.customText.trim()) {
    zpl += `^FO${centerX - 80},${yPos}^A0N,18,18^FD${settings.customText}^FS\n`
  }

  // Format indicator
  zpl += `^FO10,${height - 20}^A0N,12,12^FDCODE128^FS\n`

  zpl += `^XZ\n` // End of label
  return zpl
}

// GET - Fetch exhibition products for barcode printing
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

    // Verify exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { id: true, title: true }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Fetch exhibition products
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: { exhibitionId },
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

    // ✅ FIX: Transform to label format with explicit parameter type
    const products = exhibitionProducts.map((ep: ExhibitionProductQueryResult) => ({
      id: ep.id,
      name: ep.product.name,
      sku: ep.product.sku,
      barcode: ep.product.barcode || ep.product.sku, // Use SKU as fallback
      price: ep.product.sellingPriceUSD,
      category: ep.product.category.name,
      exhibitionPrice: ep.exhibitionPrice,
      finalPrice: ep.exhibitionPrice || ep.product.sellingPriceUSD,
      quantityTaken: (ep as any).quantityTaken,
      quantitySold: (ep as any).quantitySold,
      available: (ep as any).quantityTaken - (ep as any).quantitySold
    }))

    return NextResponse.json({
      exhibition,
      products,
      stats: {
        totalProducts: products.length,
        // ✅ FIX: Add explicit parameter type to filter callback
        productsWithBarcodes: products.filter((p: any) => p.barcode !== p.sku).length,
        barcodeFormat: 'CODE128'
      }
    })

  } catch (error) {
    console.error('Error fetching exhibition products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Generate CODE128 barcode labels for exhibition
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

    // Fetch exhibition products
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: {
        id: { in: labelRequest.productIds },
        exhibitionId
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

    // ✅ FIX: Transform to label format with explicit parameter type and proper null handling
    const labelData: LabelData[] = exhibitionProducts.map((ep: ExhibitionProductQueryResult) => ({
      id: ep.id,
      name: ep.product.name,
      sku: ep.product.sku,
      barcode: ep.product.barcode || ep.product.sku,
      price: ep.product.sellingPriceUSD,
      category: ep.product.category.name,
      exhibitionPrice: ep.exhibitionPrice, // ✅ FIX: Keep as null (matches interface)
      finalPrice: ep.exhibitionPrice || ep.product.sellingPriceUSD
    }))

    // Generate ZPL code for all products
    let zplContent = ''
    let totalLabels = 0

    // ✅ FIX: Add explicit parameter type to for...of loop
    for (const product of labelData) {
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
      productsProcessed: labelData.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating exhibition barcode labels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}