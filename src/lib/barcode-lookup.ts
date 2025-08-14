// src/lib/barcode-lookup.ts
// 🔧 COMPLETE: Barcode identification and lookup service

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export interface BarcodeResult {
  found: boolean
  type: 'main_product' | 'size_variant' | 'not_found'
  product?: {
    id: string
    sku: string
    name: string
    barcode: string
    requiresSizes: boolean
    sellingPriceUSD: number
    stockQuantity: number
    category: { name: string }
  }
  sizeVariant?: {
    id: string
    size: string
    sku: string
    barcode: string
    stockQuantity: number
  }
  message: string
}

/**
 * 🎯 MASTER FUNCTION: Look up any barcode and identify the exact item
 */
export async function lookupBarcode(scannedBarcode: string): Promise<BarcodeResult> {
  if (!scannedBarcode || scannedBarcode.trim() === '') {
    return {
      found: false,
      type: 'not_found',
      message: 'Barcode cannot be empty'
    }
  }

  const cleanBarcode = scannedBarcode.trim().toUpperCase()

  try {
    // STEP 1: Check if it's a size variant by SKU first (since we know SKUs work)
    const sizeVariantBySku = await prisma.productSize.findFirst({
      where: {
        sku: cleanBarcode,
        isActive: true
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    if (sizeVariantBySku) {
      return {
        found: true,
        type: 'size_variant',
        product: {
          id: sizeVariantBySku.product.id,
          sku: sizeVariantBySku.product.sku,
          name: sizeVariantBySku.product.name,
          barcode: sizeVariantBySku.product.barcode || '',
          requiresSizes: sizeVariantBySku.product.requiresSizes,
          sellingPriceUSD: sizeVariantBySku.product.sellingPriceUSD,
          stockQuantity: sizeVariantBySku.product.stockQuantity,
          category: sizeVariantBySku.product.category
        },
        sizeVariant: {
          id: sizeVariantBySku.id,
          size: sizeVariantBySku.size,
          sku: sizeVariantBySku.sku,
          barcode: sizeVariantBySku.sku, // Use SKU as barcode fallback
          stockQuantity: sizeVariantBySku.stockQuantity
        },
        message: `Found ${sizeVariantBySku.product.name} - Size ${sizeVariantBySku.size} (Stock: ${sizeVariantBySku.stockQuantity})`
      }
    }

    // STEP 2: Try size variant by barcode (if populated)
    try {
      const sizeVariant = await prisma.productSize.findFirst({
        where: {
          barcode: cleanBarcode,
          isActive: true
        },
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      })

      if (sizeVariant) {
        return {
          found: true,
          type: 'size_variant',
          product: {
            id: sizeVariant.product.id,
            sku: sizeVariant.product.sku,
            name: sizeVariant.product.name,
            barcode: sizeVariant.product.barcode || '',
            requiresSizes: sizeVariant.product.requiresSizes,
            sellingPriceUSD: sizeVariant.product.sellingPriceUSD,
            stockQuantity: sizeVariant.product.stockQuantity,
            category: sizeVariant.product.category
          },
          sizeVariant: {
            id: sizeVariant.id,
            size: sizeVariant.size,
            sku: sizeVariant.sku,
            barcode: sizeVariant.barcode || '',
            stockQuantity: sizeVariant.stockQuantity
          },
          message: `Found ${sizeVariant.product.name} - Size ${sizeVariant.size} (Stock: ${sizeVariant.stockQuantity})`
        }
      }
    } catch (barcodeError) {
      // Barcode field might not exist or have data, continue to other methods
      console.log('Size variant barcode lookup failed, trying other methods...')
    }

    // STEP 3: Check if it's a main product barcode
    const mainProduct = await prisma.product.findFirst({
      where: {
        barcode: cleanBarcode,
        isActive: true
      },
      include: {
        category: true,
        productSizes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (mainProduct) {
      // If product requires sizes but no specific size was scanned
      if (mainProduct.requiresSizes && mainProduct.productSizes.length > 0) {
        return {
          found: true,
          type: 'main_product',
          product: {
            id: mainProduct.id,
            sku: mainProduct.sku,
            name: mainProduct.name,
            barcode: mainProduct.barcode || '',
            requiresSizes: mainProduct.requiresSizes,
            sellingPriceUSD: mainProduct.sellingPriceUSD,
            stockQuantity: mainProduct.stockQuantity,
            category: mainProduct.category
          },
          message: `Found ${mainProduct.name} - Please select size (${mainProduct.productSizes.map(s => s.size).join(', ')})`
        }
      }

      // Single product without sizes
      return {
        found: true,
        type: 'main_product',
        product: {
          id: mainProduct.id,
          sku: mainProduct.sku,
          name: mainProduct.name,
          barcode: mainProduct.barcode || '',
          requiresSizes: mainProduct.requiresSizes,
          sellingPriceUSD: mainProduct.sellingPriceUSD,
          stockQuantity: mainProduct.stockQuantity,
          category: mainProduct.category
        },
        message: `Found ${mainProduct.name} (Stock: ${mainProduct.stockQuantity})`
      }
    }

    // STEP 3: Fallback - try SKU matching (in case barcode matches SKU)
    const productBySku = await prisma.product.findFirst({
      where: {
        sku: cleanBarcode,
        isActive: true
      },
      include: {
        category: true
      }
    })

    if (productBySku) {
      return {
        found: true,
        type: 'main_product',
        product: {
          id: productBySku.id,
          sku: productBySku.sku,
          name: productBySku.name,
          barcode: productBySku.barcode || '',
          requiresSizes: productBySku.requiresSizes,
          sellingPriceUSD: productBySku.sellingPriceUSD,
          stockQuantity: productBySku.stockQuantity,
          category: productBySku.category
        },
        message: `Found ${productBySku.name} by SKU match`
      }
    }

    // STEP 4: Fallback - try size variant SKU matching
    const sizeVariantBySku2 = await prisma.productSize.findFirst({
      where: {
        sku: cleanBarcode,
        isActive: true
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    if (sizeVariantBySku2) {
      return {
        found: true,
        type: 'size_variant',
        product: {
          id: sizeVariantBySku2.product.id,
          sku: sizeVariantBySku2.product.sku,
          name: sizeVariantBySku2.product.name,
          barcode: sizeVariantBySku2.product.barcode || '',
          requiresSizes: sizeVariantBySku2.product.requiresSizes,
          sellingPriceUSD: sizeVariantBySku2.product.sellingPriceUSD,
          stockQuantity: sizeVariantBySku2.product.stockQuantity,
          category: sizeVariantBySku2.product.category
        },
        sizeVariant: {
          id: sizeVariantBySku2.id,
          size: sizeVariantBySku2.size,
          sku: sizeVariantBySku2.sku,
          barcode: sizeVariantBySku2.sku, // Use SKU as barcode
          stockQuantity: sizeVariantBySku2.stockQuantity
        },
        message: `Found ${sizeVariantBySku2.product.name} - Size ${sizeVariantBySku2.size} by SKU match`
      }
    }

    // Not found anywhere
    return {
      found: false,
      type: 'not_found',
      message: `No product found with barcode: ${cleanBarcode}`
    }

  } catch (error) {
    console.error('Barcode lookup error:', error)
    return {
      found: false,
      type: 'not_found',
      message: `Database error during barcode lookup: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * 🔍 Quick barcode validation
 */
export function validateBarcode(barcode: string): { isValid: boolean; error?: string } {
  if (!barcode || barcode.trim() === '') {
    return { isValid: false, error: 'Barcode cannot be empty' }
  }

  if (barcode.length > 80) {
    return { isValid: false, error: 'Barcode too long (max 80 characters)' }
  }

  // Check for valid ASCII characters for CODE128
  const invalidChars = barcode.split('').filter(char => char.charCodeAt(0) > 127)
  if (invalidChars.length > 0) {
    return { isValid: false, error: `Invalid characters: ${invalidChars.join(', ')}` }
  }

  return { isValid: true }
}

/**
 * 🎯 Generate unique barcode for size variant
 */
export function generateSizeBarcode(productSku: string, size: string): string {
  // Use the size SKU format as the barcode
  // e.g., HC-BLUE-100941 + XXL = HC-BLUE-100941-XXL
  return `${productSku}-${size.toUpperCase()}`
}

/**
 * 📊 Get barcode statistics
 */
export async function getBarcodeStats() {
  try {
    const [
      totalProducts,
      productsWithBarcodes,
      totalSizes,
      sizesWithBarcodes
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { barcode: { not: null } } }),
      prisma.productSize.count(),
      prisma.productSize.count({ where: { barcode: { not: null } } })
    ])

    return {
      products: {
        total: totalProducts,
        withBarcodes: productsWithBarcodes,
        coverage: totalProducts > 0 ? (productsWithBarcodes / totalProducts * 100).toFixed(1) + '%' : '0%'
      },
      sizeVariants: {
        total: totalSizes,
        withBarcodes: sizesWithBarcodes,
        coverage: totalSizes > 0 ? (sizesWithBarcodes / totalSizes * 100).toFixed(1) + '%' : '0%'
      }
    }
  } catch (error) {
    console.error('Error getting barcode stats:', error)
    return null
  }
}