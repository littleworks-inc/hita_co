// =====================================
// src/app/api/admin/exhibitions/[id]/products/route.ts - COMPLETE
// Enhanced to support size-based product additions
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get request data
    const data = await request.json()
    const { productId, quantityTaken, sizes } = data

    console.log('Received data:', { productId, quantityTaken, sizes })

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Validate product exists and is active
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        productSizes: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Cannot add inactive product to exhibition' },
        { status: 400 }
      )
    }

    // Check if product is already in this exhibition
    const existingExhibitionProduct = await db.exhibitionProduct.findFirst({
      where: {
        exhibitionId: exhibitionId,
        productId: productId
      }
    })

    if (existingExhibitionProduct) {
      return NextResponse.json(
        { error: 'Product is already added to this exhibition' },
        { status: 400 }
      )
    }

    // ✅ ENHANCED: Handle both sized and non-sized products
    if (product.requiresSizes) {
      // ✅ SIZE-BASED PRODUCT ADDITION
      if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
        return NextResponse.json(
          { error: 'Size selections are required for this product' },
          { status: 400 }
        )
      }

      console.log('Processing sized product with sizes:', sizes)

      // Validate each size selection
      for (const sizeSelection of sizes) {
        const { productSizeId, quantityTaken: sizeQuantity } = sizeSelection

        if (!productSizeId || !sizeQuantity || sizeQuantity <= 0) {
          return NextResponse.json(
            { error: 'Invalid size selection data' },
            { status: 400 }
          )
        }

        // Validate the product size exists and has enough stock
        const productSize = await db.productSize.findFirst({
          where: {
            id: productSizeId,
            productId: productId,
            isActive: true
          }
        })

        if (!productSize) {
          return NextResponse.json(
            { error: `Invalid size selection for product` },
            { status: 400 }
          )
        }

        if (sizeQuantity > productSize.stockQuantity) {
          return NextResponse.json(
            { error: `Cannot take ${sizeQuantity} of size ${productSize.size}. Only ${productSize.stockQuantity} available.` },
            { status: 400 }
          )
        }
      }

      // Calculate total quantity from all sizes
      const totalQuantity = sizes.reduce((sum: number, size: any) => sum + size.quantityTaken, 0)

      // Create exhibition product with sizes in transaction
      const result = await db.$transaction(async (tx) => {
        // Create main exhibition product entry
        const exhibitionProduct = await tx.exhibitionProduct.create({
          data: {
            exhibitionId: exhibitionId,
            productId: productId,
            quantityTaken: totalQuantity,
            quantitySold: 0,
            originalPrice: product.sellingPriceUSD,
            exhibitionPrice: product.sellingPriceUSD,
            discountPercentage: 0,
            isClearance: false,
            priceHistory: [
              {
                timestamp: new Date().toISOString(),
                action: 'product_added',
                originalPrice: product.sellingPriceUSD,
                exhibitionPrice: product.sellingPriceUSD,
                quantityTaken: totalQuantity,
                notes: `Product added to exhibition: ${exhibition.title}`,
                sizes: sizes.map((s: any) => ({
                  sizeId: s.productSizeId,
                  quantity: s.quantityTaken
                }))
              }
            ]
          }
        })

        // Create exhibition product sizes entries
        const exhibitionSizesData = sizes.map((sizeSelection: any) => ({
          exhibitionProductId: exhibitionProduct.id,
          productSizeId: sizeSelection.productSizeId,
          quantityTaken: sizeSelection.quantityTaken,
          quantitySold: 0
        }))

        await tx.exhibitionProductSize.createMany({
          data: exhibitionSizesData
        })

        // Update stock quantities for each size
        for (const sizeSelection of sizes) {
          await tx.productSize.update({
            where: { id: sizeSelection.productSizeId },
            data: {
              stockQuantity: {
                decrement: sizeSelection.quantityTaken
              }
            }
          })
        }

        // Update main product stock (sum of all active sizes)
        const updatedSizes = await tx.productSize.findMany({
          where: { 
            productId: productId, 
            isActive: true 
          }
        })
        
        const newTotalStock = updatedSizes.reduce((sum, size) => sum + size.stockQuantity, 0)
        
        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: newTotalStock }
        })

        return exhibitionProduct
      })

      console.log('✅ Sized product added successfully:', result.id)

      return NextResponse.json({
        success: true,
        exhibitionProduct: result,
        message: `${product.name} (${totalQuantity} units across ${sizes.length} sizes) added to exhibition successfully`
      })

    } else {
      // ✅ NON-SIZED PRODUCT ADDITION (Original logic)
      if (!quantityTaken || quantityTaken <= 0) {
        return NextResponse.json(
          { error: 'Quantity taken must be greater than 0' },
          { status: 400 }
        )
      }

      // Validate quantity against stock
      if (quantityTaken > product.stockQuantity) {
        return NextResponse.json(
          { 
            error: `Cannot take ${quantityTaken} items. Only ${product.stockQuantity} available in stock.` 
          },
          { status: 400 }
        )
      }

      // Create exhibition product entry
      const exhibitionProduct = await db.exhibitionProduct.create({
        data: {
          exhibitionId: exhibitionId,
          productId: productId,
          quantityTaken: quantityTaken,
          quantitySold: 0,
          originalPrice: product.sellingPriceUSD,
          exhibitionPrice: product.sellingPriceUSD,
          discountPercentage: 0,
          isClearance: false,
          priceHistory: [
            {
              timestamp: new Date().toISOString(),
              action: 'product_added',
              originalPrice: product.sellingPriceUSD,
              exhibitionPrice: product.sellingPriceUSD,
              quantityTaken: quantityTaken,
              notes: `Product added to exhibition: ${exhibition.title}`
            }
          ]
        },
        include: {
          product: {
            include: {
              category: true,
              country: true
            }
          }
        }
      })

      // Update product stock
      await db.product.update({
        where: { id: productId },
        data: {
          stockQuantity: {
            decrement: quantityTaken
          }
        }
      })

      console.log('✅ Regular product added successfully:', exhibitionProduct.id)

      return NextResponse.json({
        success: true,
        exhibitionProduct,
        message: `${product.name} added to exhibition successfully`
      })
    }

  } catch (error) {
    console.error('Exhibition product creation error:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Product is already added to this exhibition' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ✅ GET - Fetch exhibition products
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

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Get exhibition products with related data
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: { exhibitionId },
      include: {
        product: {
          include: {
            category: true,
            country: true,
            productSizes: true
          }
        },
        exhibitionSizes: {
          include: {
            productSize: true
          },
          orderBy: {
            productSize: {
              sortOrder: 'asc'
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get available products (not in this exhibition)
    const existingProductIds = exhibitionProducts.map(ep => ep.productId)
    
    const availableProducts = await db.product.findMany({
      where: {
        id: { notIn: existingProductIds },
        isActive: true
      },
      include: {
        category: true,
        country: true,
        productSizes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate summary
    const summary = {
      totalProducts: exhibitionProducts.length,
      totalQuantityTaken: exhibitionProducts.reduce((sum, ep) => sum + ep.quantityTaken, 0),
      totalQuantitySold: exhibitionProducts.reduce((sum, ep) => sum + ep.quantitySold, 0),
      totalValue: exhibitionProducts.reduce((sum, ep) => sum + (ep.originalPrice * ep.quantityTaken), 0),
      totalRevenue: exhibitionProducts.reduce((sum, ep) => sum + ((ep.exhibitionPrice || ep.originalPrice) * ep.quantitySold), 0),
      clearanceProducts: exhibitionProducts.filter(ep => ep.isClearance).length,
      customPricedProducts: exhibitionProducts.filter(ep => ep.exhibitionPrice && ep.exhibitionPrice !== ep.originalPrice).length,
      outOfStockProducts: exhibitionProducts.filter(ep => ep.quantityTaken <= ep.quantitySold).length
    }

    // Add sell-through rate
    const sellThroughRate = summary.totalQuantityTaken > 0 
      ? (summary.totalQuantitySold / summary.totalQuantityTaken) * 100 
      : 0

    return NextResponse.json({
      success: true,
      exhibition,
      products: exhibitionProducts,
      availableProducts,
      summary: {
        ...summary,
        sellThroughRate: Math.round(sellThroughRate * 100) / 100
      }
    })

  } catch (error) {
    console.error('Error fetching exhibition products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}