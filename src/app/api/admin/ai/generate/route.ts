// /src/app/api/admin/ai/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Handle different request formats
    let type, context, options = {}
    
    if (body.contentType) {
      // Format from ProductForm custom buttons
      type = body.contentType === 'custom' ? 'product_description' : body.contentType
      context = body.productContext || body.context
      options = body.options || {}
    } else {
      // Format from AIGenerateButton
      type = body.type
      context = body.context
      options = body.options || {}
    }

    console.log('AI Generate Request:', { type, context, options }) // Debug log

    // Get AI settings from store settings
    const storeSettings = await db.storeSetting.findFirst({
      where: { id: 'default' },
      select: {
        aiProvider: true,
        aiApiKey: true,
        aiModel: true
      }
    })

    if (!storeSettings?.aiProvider || !storeSettings?.aiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI provider not configured. Please configure AI settings first.'
      }, { status: 400 })
    }

    // Generate content based on type
    let generatedContent = ''
    
    try {
      console.log('Generating content for type:', type) // Debug log
      
      if (type === 'short_description' || type === 'shortDescription') {
        generatedContent = await generateShortDescription(storeSettings, context, options)
      } else if (type === 'product_description' || type === 'description') {
        generatedContent = await generateProductDescription(storeSettings, context, options)
      } else if (type === 'seo_content') {
        generatedContent = await generateSEOContent(storeSettings, context, options)
      } else {
        console.error('Unsupported content type:', type)
        return NextResponse.json({
          success: false,
          error: `Unsupported content type: ${type}`
        }, { status: 400 })
      }

      console.log('Generated content:', generatedContent) // Debug log
      
      if (!generatedContent) {
        throw new Error('No content was generated')
      }

      return NextResponse.json({
        success: true,
        content: generatedContent,
        provider: storeSettings.aiProvider,
        model: storeSettings.aiModel
      })

    } catch (error) {
      console.error('AI generation error:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Generate short description with image analysis
async function generateShortDescription(settings: any, context: any, options: any = {}) {
  const { name, category, images } = context
  
  // If images are available, include image analysis
  if (images && images.length > 0) {
    return await generateDescriptionWithImages(settings, context, 'short')
  }
  
  const prompt = `You are a product copywriter. Write a brief product description for "${name}" (${category}).

Requirements:
- Exactly 30-40 words
- Engaging and sales-focused
- No reasoning or explanation
- Direct product description only

Product Description:`

  return await callAIProvider(settings, prompt, 60)
}

// Generate product description with image analysis
async function generateProductDescription(settings: any, context: any, options: any = {}) {
  const { name, category, price, materials, colors, tags, images } = context
  const { tone = 'elegant' } = options

  // If images are available, include image analysis
  if (images && images.length > 0) {
    return await generateDescriptionWithImages(settings, context, 'long')
  }

  const prompt = `You are a product copywriter. Write a detailed product description for "${name}" (${category}).

Product Details:
- Name: ${name}
- Category: ${category || 'Ethnic wear'}
- Price: ${price ? `${price}` : 'Contact for pricing'}
- Materials: ${materials?.join(', ') || 'Premium materials'}
- Colors: ${colors?.join(', ') || 'Various colors'}
- Features: ${tags?.join(', ') || 'Handcrafted quality'}

Requirements:
- Write in ${tone} tone
- 100-150 words
- Highlight craftsmanship and cultural significance
- No reasoning or explanation
- Direct product description only

Product Description:`

  return await callAIProvider(settings, prompt, 200)
}

// Generate description with image analysis
async function generateDescriptionWithImages(settings: any, context: any, type: 'short' | 'long') {
  const { name, category, images, price, materials, colors, tags } = context
  
  if (settings.aiProvider === 'openai') {
    // OpenAI supports vision
    return await generateWithOpenAIVision(settings, context, type)
  } else {
    // For other providers, first describe the image, then generate description
    const imageDescription = await analyzeProductImages(images)
    
    const enhancedContext = {
      ...context,
      imageAnalysis: imageDescription
    }
    
    if (type === 'short') {
      return await generateShortDescriptionWithAnalysis(settings, enhancedContext)
    } else {
      return await generateLongDescriptionWithAnalysis(settings, enhancedContext)
    }
  }
}

// Analyze product images (placeholder for image analysis service)
async function analyzeProductImages(images: string[]): Promise<string> {
  // TODO: Implement actual image analysis
  // For now, return placeholder text
  return "This appears to be a traditional ethnic garment with intricate details, rich colors, and cultural patterns."
}

// Generate description with image analysis for non-vision models
async function generateShortDescriptionWithAnalysis(settings: any, context: any) {
  const { name, category, imageAnalysis } = context
  
  const prompt = `You are a product copywriter. Based on this image analysis, write a brief product description:

Product: ${name} (${category})
Image Analysis: ${imageAnalysis}

Requirements:
- Exactly 30-40 words
- Based on the visual details
- Engaging and sales-focused
- No reasoning or explanation

Product Description:`

  return await callAIProvider(settings, prompt, 60)
}

// Generate with OpenAI Vision API
async function generateWithOpenAIVision(settings: any, context: any, type: 'short' | 'long') {
  const { name, category, images } = context
  const maxWords = type === 'short' ? '30-40' : '100-150'
  
  const prompt = type === 'short' 
    ? `Write a brief ${maxWords} word product description for this ${category} called "${name}". Focus on what you see in the image - colors, patterns, style, materials visible.`
    : `Write a detailed ${maxWords} word product description for this ${category} called "${name}". Describe the visual elements, craftsmanship, cultural significance, and styling based on what you see.`

  // Use OpenAI Vision API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.aiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...images.slice(0, 3).map((imageUrl: string) => ({
              type: 'image_url',
              image_url: { url: imageUrl }
            }))
          ]
        }
      ],
      max_tokens: type === 'short' ? 80 : 200
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI Vision API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || ''
}

// Generate SEO content
async function generateSEOContent(settings: any, context: any, options: any = {}) {
  const { name, category } = context
  
  const prompt = `Create SEO-optimized title and meta description for "${name}".

Product: ${name}
Category: ${category || 'Indian ethnic wear'}

Requirements:
- SEO Title: Maximum 60 characters, include main keyword
- Meta Description: Maximum 160 characters, compelling and descriptive
- Focus on Indian ethnic wear, traditional fashion, authentic clothing

Format your response as JSON:
{
  "title": "SEO title here",
  "description": "Meta description here"
}

Your response:`

  const result = await callAIProvider(settings, prompt, 150)
  
  // Try to parse JSON, fallback to text if it fails
  try {
    return JSON.parse(result)
  } catch {
    return {
      title: `${name} - Authentic ${category || 'Indian Ethnic Wear'}`,
      description: result.substring(0, 160)
    }
  }
}

// Call AI provider
async function callAIProvider(settings: any, prompt: string, maxTokens: number = 200) {
  const { aiProvider, aiApiKey, aiModel } = settings

  let result = ''
  
  try {
    if (aiProvider === 'openrouter') {
      result = await callOpenRouter(aiApiKey, aiModel || 'meta-llama/llama-3.2-3b-instruct:free', prompt, maxTokens)
    } else if (aiProvider === 'openai') {
      result = await callOpenAI(aiApiKey, aiModel || 'gpt-4o-mini', prompt, maxTokens)
    } else {
      throw new Error(`Provider ${aiProvider} not implemented yet`)
    }

    // Clean up the response
    return result
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/^\s*<!DOCTYPE[\s\S]*?\>\s*/i, '') // Remove DOCTYPE
      .replace(/^\s*<.*?\>\s*/, '') // Remove HTML tags
      .trim()

  } catch (error) {
    console.error(`${aiProvider} API error:`, error)
    throw error
  }
}

// OpenRouter implementation
async function callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens: number) {
  console.log('OpenRouter request:', { model, maxTokens, apiKeyLength: apiKey.length })
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hita&Co eCommerce Platform'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })

  console.log('OpenRouter response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenRouter error response:', errorText)
    
    try {
      const error = JSON.parse(errorText)
      throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`)
    } catch {
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }
  }

  const data = await response.json()
  console.log('OpenRouter response data:', JSON.stringify(data, null, 2)) // Better logging
  
  // Try different ways to extract content
  const message = data.choices?.[0]?.message
  let content = ''
  
  if (message?.content && message.content.trim()) {
    content = message.content.trim()
  } else if (message?.reasoning && message.reasoning.trim()) {
    // DeepSeek R1 models put content in reasoning field
    console.log('Using reasoning field for DeepSeek model')
    content = message.reasoning.trim()
  } else if (message?.text) {
    content = message.text.trim()
  } else if (typeof message === 'string') {
    content = message.trim()
  } else {
    console.error('Could not extract content. Message structure:', JSON.stringify(message, null, 2))
  }
  
  console.log('Extracted content:', JSON.stringify(content))
  
  return content
}

// OpenAI implementation
async function callOpenAI(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || ''
}