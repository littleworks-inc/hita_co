import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { aiService, isAIAvailable, getCurrentAIProvider } from '@/lib/ai'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check AI availability
    const isAvailable = await isAIAvailable()
    const currentProvider = await getCurrentAIProvider()
    const configCheck = await aiService.isAIConfigured()

    return NextResponse.json({
      isAvailable,
      currentProvider,
      configCheck,
      message: isAvailable 
        ? `AI is configured and ready with ${currentProvider}` 
        : 'AI is not configured'
    })
  } catch (error) {
    console.error('AI test error:', error)
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

    const { contentType, productContext, options } = await request.json()

    // Test content generation
    const result = await aiService.generateContent(
      {
        contentType: contentType || 'product_description',
        tone: 'elegant',
        length: 'short',
        ...options
      },
      productContext || {
        name: 'Test Product',
        category: 'ethnic wear',
        materials: ['cotton', 'silk'],
        colors: ['blue', 'gold']
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI generation test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}