// src/lib/barcode-lookup-working.ts
// 🔧 WORKING: Properly typed barcode lookup function

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
 * 🎯 WORKING: Look up any barcode and identify the exact item
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
    // STEP 1: Check if it's a size variant by SKU (this definitely works)
    const sizeVariant = await prisma.productSize.findFirst({
      where: {
        sku: cleanBarcode,
        isActive: true
      }
    })

    if (sizeVariant) {
      // Get the related product data separately
      const product = await prisma.product.findUnique({
        where: { id: sizeVariant.productId },
        include: { category: true }
      })

      if (product) {
        return {
          found: true,
          type: 'size_variant',
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
            barcode: product.barcode || '',
            requiresSizes: product.requiresSizes,
            sellingPriceUSD: product.sellingPriceUSD,
            stockQuantity: product.stockQuantity,
            category: product.category
          },
          sizeVariant: {
            id: sizeVariant.id,
            size: sizeVariant.size,
            sku: sizeVariant.sku,
            barcode: sizeVariant.sku, // Use SKU as barcode for now
            stockQuantity: sizeVariant.stockQuantity
          },
          message: `Found ${product.name} - Size ${sizeVariant.size} (Stock: ${sizeVariant.stockQuantity})`
        }
      }
    }

    // STEP 2: Check if it's a main product barcode
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

    // STEP 3: Fallback - try SKU matching for main products
    const productBySku = await prisma.product.findFirst({
      where: {
        sku: cleanBarcode,
        isActive: true
      },
      include: { category: true }
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

    // STEP 4: Try to check size variant by barcode field (if it exists and has data)
    try {
      // First check if any ProductSize records have barcode data
      const hasBarcodedSizes = await prisma.productSize.findFirst({
        where: {
          NOT: { barcode: null },
          isActive: true
        }
      })

      if (hasBarcodedSizes) {
        const sizeVariantByBarcode = await prisma.productSize.findFirst({
          where: {
            barcode: cleanBarcode,
            isActive: true
          }
        })

        if (sizeVariantByBarcode) {
          const product = await prisma.product.findUnique({
            where: { id: sizeVariantByBarcode.productId },
            include: { category: true }
          })

          if (product) {
            return {
              found: true,
              type: 'size_variant',
              product: {
                id: product.id,
                sku: product.sku,
                name: product.name,
                barcode: product.barcode || '',
                requiresSizes: product.requiresSizes,
                sellingPriceUSD: product.sellingPriceUSD,
                stockQuantity: product.stockQuantity,
                category: product.category
              },
              sizeVariant: {
                id: sizeVariantByBarcode.id,
                size: sizeVariantByBarcode.size,
                sku: sizeVariantByBarcode.sku,
                barcode: cleanBarcode, // Use the scanned barcode
                stockQuantity: sizeVariantByBarcode.stockQuantity
              },
              message: `Found ${product.name} - Size ${sizeVariantByBarcode.size} (Stock: ${sizeVariantByBarcode.stockQuantity})`
            }
          }
        }
      }
    } catch (barcodeError) {
      // Barcode field might not exist, continue to not found
      console.log('Size barcode lookup failed, likely no barcode data exists')
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