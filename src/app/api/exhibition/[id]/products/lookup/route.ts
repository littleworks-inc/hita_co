// src/app/api/exhibition/[id]/products/lookup/route.ts
// =====================================
// 🚀 Exhibition Product Lookup API
// Quick lookup by barcode, SKU, or product name for POS scanning
// =====================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'auto' // 'barcode', 'sku', 'name', 'auto'

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { id: true, title: true, isActive: true }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Build search conditions based on type with proper Prisma typing
    let searchConditions: any[] = []

    switch (type) {
      case 'barcode':
        searchConditions.push(
          // Main product barcode
          {
            product: {
              barcode: {
                equals: query,
                mode: 'insensitive' as const
              }
            }
          },
          // Size variant barcodes
          {
            product: {
              productSizes: {
                some: {
                  barcode: {
                    equals: query,
                    mode: 'insensitive' as const
                  }
                }
              }
            }
          }
        )
        break

      case 'sku':
        // Extract base SKU from size variant SKU
        const queryParts = query.split('-')
        let baseSkuFromQuery = query
        
        // If query looks like a size variant (ends with size like -XXL, -XL, -L, -M, -S)
        if (queryParts.length > 2) {
          const lastPart = queryParts[queryParts.length - 1].toUpperCase()
          const commonSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 
                             'SMALL', 'MEDIUM', 'LARGE', 'XLARGE', 'XXLARGE']
          
          if (commonSizes.includes(lastPart) || /^\d+$/.test(lastPart)) {
            // Remove the size part to get base SKU
            baseSkuFromQuery = queryParts.slice(0, -1).join('-')
          }
        }
        
        searchConditions.push(
          // Main product SKU (exact match)
          {
            product: {
              sku: {
                equals: query,
                mode: 'insensitive' as const
              }
            }
          },
          // Base SKU match (for size variants)
          {
            product: {
              sku: {
                equals: baseSkuFromQuery,
                mode: 'insensitive' as const
              }
            }
          },
          // Size variant SKUs
          {
            product: {
              productSizes: {
                some: {
                  sku: {
                    equals: query,
                    mode: 'insensitive' as const
                  }
                }
              }
            }
          }
        )
        break

      case 'name':
        searchConditions.push({
          product: {
            name: {
              contains: query,
              mode: 'insensitive' as const
            }
          }
        })
        break

      case 'auto':
      default:
        // Extract base SKU for size variant handling
        const autoQueryParts = query.split('-')
        let autoBaseSkuFromQuery = query
        
        if (autoQueryParts.length > 2) {
          const lastPart = autoQueryParts[autoQueryParts.length - 1].toUpperCase()
          const commonSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 
                             'SMALL', 'MEDIUM', 'LARGE', 'XLARGE', 'XXLARGE']
          
          if (commonSizes.includes(lastPart) || /^\d+$/.test(lastPart)) {
            autoBaseSkuFromQuery = autoQueryParts.slice(0, -1).join('-')
          }
        }
        
        // Search across barcode, SKU, and name (including size variants)
        searchConditions = [
          // Main product barcode
          {
            product: {
              barcode: {
                equals: query,
                mode: 'insensitive' as const
              }
            }
          },
          // Main product SKU
          {
            product: {
              sku: {
                contains: query,
                mode: 'insensitive' as const
              }
            }
          },
          // Base SKU (for size variants)
          {
            product: {
              sku: {
                equals: autoBaseSkuFromQuery,
                mode: 'insensitive' as const
              }
            }
          },
          // Product name
          {
            product: {
              name: {
                contains: query,
                mode: 'insensitive' as const
              }
            }
          },
          // Size variant barcodes
          {
            product: {
              productSizes: {
                some: {
                  barcode: {
                    equals: query,
                    mode: 'insensitive' as const
                  }
                }
              }
            }
          },
          // Size variant SKUs
          {
            product: {
              productSizes: {
                some: {
                  sku: {
                    equals: query,
                    mode: 'insensitive' as const
                  }
                }
              }
            }
          }
        ]
    }

    // Find exhibition products matching the search
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: {
        exhibitionId,
        OR: searchConditions
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            },
            country: {
              select: {
                id: true,
                name: true,
                currencySymbol: true
              }
            },
            productSizes: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      },
      orderBy: [
        // Prioritize exact barcode matches
        {
          product: {
            barcode: query
          }
        },
        // Then exact SKU matches
        {
          product: {
            sku: query
          }
        },
        // Then by name
        {
          product: {
            name: 'asc'
          }
        }
      ]
    })

    // Format response with stock and pricing information
    const results = sortedResults.map(ep => {
      const availableStock = ep.quantityTaken - ep.quantitySold
      const product = ep.product

      // Calculate pricing
      const originalPrice = ep.originalPrice || product.sellingPriceUSD
      const exhibitionPrice = ep.exhibitionPrice || originalPrice
      const discountedPrice = ep.discountPercentage > 0
        ? exhibitionPrice * (1 - ep.discountPercentage / 100)
        : exhibitionPrice
      const finalPrice = discountedPrice

      // Calculate savings
      const totalSavings = originalPrice - finalPrice
      const savingsPercentage = originalPrice > 0 ? (totalSavings / originalPrice) * 100 : 0

      return {
        // Exhibition product info
        id: ep.id,
        exhibitionProductId: ep.id,
        productId: ep.productId,
        quantityTaken: ep.quantityTaken,
        quantitySold: ep.quantitySold,
        availableStock,
        isClearance: ep.isClearance,
        
        // Pricing breakdown
        pricing: {
          originalPrice,
          exhibitionPrice,
          finalPrice,
          discount: ep.discountPercentage || 0,
          totalSavings,
          savingsPercentage: Math.round(savingsPercentage * 100) / 100,
          hasExhibitionPrice: ep.exhibitionPrice !== null,
          hasDiscount: (ep.discountPercentage || 0) > 0
        },

        // Product details
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          barcodeType: product.barcodeType,
          description: product.description,
          shortDescription: product.shortDescription,
          images: product.images,
          tags: product.tags,
          sellingPriceUSD: product.sellingPriceUSD,
          discountPercentage: product.discountPercentage,
          
          // Category and country
          category: product.category,
          country: product.country,
          
          // Size information
          requiresSizes: product.requiresSizes,
          productSizes: product.productSizes,
          
          // Stock info
          stockQuantity: product.stockQuantity,
          lowStockAlert: product.lowStockAlert,
          isActive: product.isActive
        },

        // Match information for debugging
        matchType: (() => {
          if (product.barcode === query) return 'barcode'
          if (product.sku.toLowerCase() === query.toLowerCase()) return 'sku_exact'
          if (product.sku.toLowerCase().includes(query.toLowerCase())) return 'sku_partial'
          if (product.name.toLowerCase().includes(query.toLowerCase())) return 'name'
          return 'unknown'
        })()
      }
    })

    // Performance stats
    const totalResults = results.length
    const inStockResults = results.filter(r => r.availableStock > 0).length
    const exactMatches = results.filter(r => r.matchType === 'barcode' || r.matchType === 'sku_exact').length

    return NextResponse.json({
      success: true,
      query,
      type,
      exhibition: {
        id: exhibition.id,
        title: exhibition.title
      },
      results,
      stats: {
        totalResults,
        inStockResults,
        exactMatches,
        hasExactMatch: exactMatches > 0
      }
    })

  } catch (error) {
    console.error('Product lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Batch lookup for multiple barcodes/SKUs
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
    const { queries } = await request.json()

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: 'Queries array is required' }, { status: 400 })
    }

    if (queries.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 queries allowed per request' }, { status: 400 })
    }

    // Validate exhibition exists
    const exhibition = await db.exhibition.findUnique({
      where: { id: exhibitionId },
      select: { id: true, title: true, isActive: true }
    })

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 })
    }

    // Build search conditions for all queries with proper Prisma structure
    const searchConditions = []
    
    for (const query of queries) {
      // Add individual conditions for each query
      searchConditions.push(
        // Main product barcode match
        {
          product: {
            barcode: {
              equals: query,
              mode: 'insensitive' as const
            }
          }
        },
        // Main product SKU match
        {
          product: {
            sku: {
              equals: query,
              mode: 'insensitive' as const
            }
          }
        }
      )
    }

    // Find all matching exhibition products with proper typing
    const exhibitionProducts = await db.exhibitionProduct.findMany({
      where: {
        exhibitionId,
        OR: searchConditions
      },
      include: {
        product: {
          include: {
            category: true,
            country: true,
            productSizes: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    })
    
    console.log('🔍 Batch lookup found:', exhibitionProducts.length, 'products')
    console.log('🔍 First product has product relation?', !!exhibitionProducts[0]?.product)

    // Map results back to original queries with proper type safety
    const results = queries.map(query => {
      const matchingProduct = exhibitionProducts.find(ep => {
        // Type-safe product access
        const product = (ep as any).product
        if (!product) return false
        
        return (
          (product.barcode === query) || 
          (product.sku?.toLowerCase() === query.toLowerCase())
        )
      })

      if (!matchingProduct) {
        return {
          query,
          found: false,
          product: null
        }
      }

      // Type-safe access to product data
      const productData = (matchingProduct as any).product
      
      if (!productData) {
        console.warn('⚠️ Product relation missing for exhibition product:', matchingProduct.id)
        return {
          query,
          found: false,
          product: null
        }
      }

      const availableStock = matchingProduct.quantityTaken - matchingProduct.quantitySold
      const originalPrice = matchingProduct.originalPrice || productData.sellingPriceUSD
      const exhibitionPrice = matchingProduct.exhibitionPrice || originalPrice
      const finalPrice = (matchingProduct.discountPercentage || 0) > 0
        ? exhibitionPrice * (1 - (matchingProduct.discountPercentage || 0) / 100)
        : exhibitionPrice

      return {
        query,
        found: true,
        product: {
          id: matchingProduct.id,
          exhibitionProductId: matchingProduct.id,
          productId: matchingProduct.productId,
          availableStock,
          pricing: {
            originalPrice,
            exhibitionPrice,
            finalPrice,
            discount: matchingProduct.discountPercentage || 0
          },
          product: {
            name: productData.name || 'Unknown Product',
            sku: productData.sku || 'Unknown SKU',
            barcode: productData.barcode || null,
            category: productData.category?.name || 'Uncategorized',
            images: productData.images || []
          }
        }
      }
    })

    const foundCount = results.filter(r => r.found).length

    return NextResponse.json({
      success: true,
      exhibition: {
        id: exhibition.id,
        title: exhibition.title
      },
      results,
      stats: {
        totalQueries: queries.length,
        foundCount,
        notFoundCount: queries.length - foundCount
      }
    })

  } catch (error) {
    console.error('Batch lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}