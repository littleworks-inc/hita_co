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

    const { type, context, options = {} } = await request.json()

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

    // Generate content based on type and context
    let generatedContent
    
    try {
      switch (type) {
        case 'product_description':
          generatedContent = await generateProductDescription(
            storeSettings, 
            context, 
            options
          )
          break
        case 'seo_content':
          generatedContent = await generateSEOContent(
            storeSettings, 
            context, 
            options
          )
          break
        case 'short_description':
          generatedContent = await generateShortDescription(
            storeSettings, 
            context, 
            options
          )
          break
        default:
          return NextResponse.json({
            success: false,
            error: 'Unsupported content type'
          }, { status: 400 })
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

// Generate product description
async function generateProductDescription(settings: any, context: any, options: any = {}) {
  const prompt = buildProductDescriptionPrompt(context, options)
  return await callAIProvider(settings, prompt, options)
}

// Generate SEO content
async function generateSEOContent(settings: any, context: any, options: any = {}) {
  const prompt = buildSEOPrompt(context, options)
  return await callAIProvider(settings, prompt, options)
}

// Generate short description
async function generateShortDescription(settings: any, context: any, options: any = {}) {
  const prompt = buildShortDescriptionPrompt(context, options)
  return await callAIProvider(settings, prompt, options)
}

// Build product description prompt
function buildProductDescriptionPrompt(context: any, options: any) {
  const { name, category, price, materials, colors, tags } = context
  const { tone = 'elegant', maxLength = 150 } = options

  return `Create a compelling product description for "${name}", an Indian ethnic wear item.

Product Details:
- Name: ${name}
- Category: ${category || 'Ethnic wear'}
- Price: ${price ? `$${price}` : 'Contact for pricing'}
- Materials: ${materials?.join(', ') || 'Premium materials'}
- Colors: ${colors?.join(', ') || 'Various colors'}
- Features: ${tags?.join(', ') || 'Handcrafted quality'}

Instructions:
- Write in ${tone} tone
- Maximum ${maxLength} words
- Highlight craftsmanship and cultural significance
- Appeal to customers interested in authentic Indian fashion
- Include care instructions if relevant
- Make it SEO-friendly

Return only the description text, no extra formatting.`
}

// Build SEO prompt
function buildSEOPrompt(context: any, options: any) {
  const { name, category, price } = context
  
  return `Create SEO-optimized title and meta description for "${name}".

Product: ${name}
Category: ${category || 'Indian ethnic wear'}
Price: ${price ? `$${price}` : 'Contact for pricing'}

Requirements:
- SEO Title: Maximum 60 characters, include main keyword
- Meta Description: Maximum 160 characters, compelling and descriptive
- Focus on Indian ethnic wear, traditional fashion, authentic clothing

Format your response as JSON:
{
  "title": "SEO title here",
  "description": "Meta description here"
}`
}

// Build short description prompt
function buildShortDescriptionPrompt(context: any, options: any) {
  const { name, category } = context
  
  return `Create a brief, catchy description for "${name}".

Product: ${name}
Category: ${category || 'Ethnic wear'}

Requirements:
- Maximum 50 words
- Highlight the most important feature
- Use engaging, concise language
- Perfect for product listings

Return only the short description text.`
}

// Call AI provider
async function callAIProvider(settings: any, prompt: string, options: any = {}) {
  const { aiProvider, aiApiKey, aiModel } = settings
  const maxTokens = options.maxTokens || 200

  switch (aiProvider) {
    case 'openai':
      return await callOpenAI(aiApiKey, aiModel || 'gpt-4o-mini', prompt, maxTokens)
    case 'gemini':
      return await callGemini(aiApiKey, aiModel || 'gemini-1.5-flash', prompt, maxTokens)
    case 'claude':
      return await callClaude(aiApiKey, aiModel || 'claude-3-haiku-20240307', prompt, maxTokens)
    case 'mistral':
      return await callMistral(aiApiKey, aiModel || 'mistral-small-latest', prompt, maxTokens)
    case 'openrouter':
      return await callOpenRouter(aiApiKey, aiModel || 'meta-llama/llama-3.2-3b-instruct:free', prompt, maxTokens)
    default:
      throw new Error(`Unsupported AI provider: ${aiProvider}`)
  }
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

// Gemini implementation
async function callGemini(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const modelName = model.startsWith('models/') ? model : `models/${model}`
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

// Claude implementation
async function callClaude(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text?.trim() || ''
}

// Mistral implementation
async function callMistral(apiKey: string, model: string, prompt: string, maxTokens: number) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
    throw new Error(error.error?.message || `Mistral API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || ''
}

// OpenRouter implementation
async function callOpenRouter(apiKey: string, model: string, prompt: string, maxTokens: number) {
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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || ''
}