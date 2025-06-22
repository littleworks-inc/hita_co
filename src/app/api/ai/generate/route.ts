import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiService, AIGenerationRequest } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, context, bulk = false, productIds = [] } = body

    // Validate request
    if (!type) {
      return NextResponse.json(
        { error: 'Generation type is required' },
        { status: 400 }
      )
    }

    // Handle bulk generation
    if (bulk && productIds.length > 0) {
      if (productIds.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 products allowed for bulk generation' },
          { status: 400 }
        )
      }

      const results = await aiService.bulkGenerateProductContent(productIds, type)
      return NextResponse.json({
        success: true,
        bulk: true,
        results
      })
    }

    // Handle single generation
    if (!context) {
      return NextResponse.json(
        { error: 'Context is required for content generation' },
        { status: 400 }
      )
    }

    const generationRequest: AIGenerationRequest = {
      type,
      context: {
        productName: context.productName,
        category: context.category,
        price: context.price,
        features: context.features || [],
        targetAudience: context.targetAudience || 'customers interested in Indian ethnic wear',
        tone: context.tone || 'elegant',
        maxLength: context.maxLength || 150,
        includeKeywords: context.includeKeywords || [],
        customPrompt: context.customPrompt
      }
    }

    const response = await aiService.generateContent(generationRequest)

    return NextResponse.json(response)

  } catch (error) {
    console.error('AI Generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}