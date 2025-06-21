import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiService, type AIGenerationOptions, type ProductContext } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      contentType, 
      productContext, 
      options = {},
      bulk = false,
      products = []
    } = body

    // Validate required fields
    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      )
    }

    // Handle bulk generation
    if (bulk && Array.isArray(products) && products.length > 0) {
      return await handleBulkGeneration(products, contentType, options)
    }

    // Single product generation
    if (!productContext) {
      return NextResponse.json(
        { error: 'Product context is required for single generation' },
        { status: 400 }
      )
    }

    const result = await aiService.generateContent(
      {
        contentType,
        tone: 'elegant',
        length: 'medium',
        ...options
      } as AIGenerationOptions,
      productContext as ProductContext
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Content generation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content: result.content,
      provider: result.provider,
      usage: result.usage
    })

  } catch (error) {
    console.error('AI generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle bulk content generation for multiple products
 */
async function handleBulkGeneration(
  products: any[],
  contentType: string,
  options: any
) {
  const results = []
  const errors = []

  // Process products in batches to avoid overwhelming the AI service
  const batchSize = 5
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (product) => {
      try {
        const productContext: ProductContext = {
          name: product.name,
          category: product.category?.name,
          materials: extractMaterials(product.description, product.tags),
          colors: extractColors(product.description, product.tags),
          description: product.description,
          price: product.sellingPriceUSD,
          currency: 'USD',
          origin: product.country?.name,
          targetAudience: 'customers who appreciate authentic Indian products'
        }

        const result = await aiService.generateContent(
          {
            contentType,
            tone: 'elegant',
            length: 'medium',
            ...options
          } as AIGenerationOptions,
          productContext
        )

        return {
          productId: product.id,
          productName: product.name,
          success: result.success,
          content: result.content,
          error: result.error
        }
      } catch (error) {
        return {
          productId: product.id,
          productName: product.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults.filter(r => r.success))
    errors.push(...batchResults.filter(r => !r.success))

    // Add delay between batches to respect rate limits
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return NextResponse.json({
    success: true,
    bulk: true,
    results,
    errors,
    summary: {
      total: products.length,
      successful: results.length,
      failed: errors.length
    }
  })
}

/**
 * Extract materials from product description and tags
 */
function extractMaterials(description: string = '', tags: string[] = []): string[] {
  const materials = new Set<string>()
  
  // Common materials in Indian ethnic wear
  const materialKeywords = [
    'silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'satin',
    'velvet', 'linen', 'khadi', 'handloom', 'organic cotton',
    'bamboo', 'jute', 'wool', 'cashmere', 'modal', 'rayon',
    'net', 'tulle', 'organza', 'taffeta', 'brocade', 'jacquard',
    'silver', 'gold', 'brass', 'copper', 'stone', 'pearl',
    'crystal', 'glass', 'wood', 'leather', 'metal', 'thread'
  ]

  const text = `${description} ${tags.join(' ')}`.toLowerCase()
  
  materialKeywords.forEach(material => {
    if (text.includes(material)) {
      materials.add(material)
    }
  })

  return Array.from(materials)
}

/**
 * Extract colors from product description and tags
 */
function extractColors(description: string = '', tags: string[] = []): string[] {
  const colors = new Set<string>()
  
  // Common colors
  const colorKeywords = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'black', 'white', 'grey', 'gray', 'brown', 'beige', 'cream',
    'gold', 'silver', 'rose gold', 'copper', 'bronze',
    'maroon', 'navy', 'teal', 'turquoise', 'coral', 'magenta',
    'violet', 'indigo', 'crimson', 'scarlet', 'azure', 'lime',
    'olive', 'tan', 'khaki', 'ivory', 'pearl', 'champagne',
    'royal blue', 'forest green', 'burgundy', 'mustard', 'mint'
  ]

  const text = `${description} ${tags.join(' ')}`.toLowerCase()
  
  colorKeywords.forEach(color => {
    if (text.includes(color)) {
      colors.add(color)
    }
  })

  return Array.from(colors)
}

// Specialized endpoints for different content types
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        const configCheck = await aiService.isAIConfigured()
        return NextResponse.json(configCheck)
      
      case 'templates':
        return NextResponse.json({
          contentTypes: [
            {
              id: 'product_description',
              name: 'Product Description',
              description: 'Generate compelling product descriptions',
              lengths: ['short', 'medium', 'long'],
              tones: ['elegant', 'professional', 'casual', 'playful']
            },
            {
              id: 'seo_meta',
              name: 'SEO Meta Description',
              description: 'Generate SEO-optimized meta descriptions',
              lengths: ['short'],
              tones: ['professional', 'informative']
            },
            {
              id: 'social_caption',
              name: 'Social Media Caption',
              description: 'Generate social media captions',
              platforms: ['instagram', 'facebook', 'twitter'],
              tones: ['playful', 'elegant', 'casual']
            },
            {
              id: 'category_description',
              name: 'Category Description',
              description: 'Generate category page descriptions',
              lengths: ['medium', 'long'],
              tones: ['informative', 'elegant']
            }
          ]
        })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('AI generation GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}