// /src/app/api/admin/ai/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Force dynamic rendering - this route uses cookies or request.url
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, apiKey, model } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Provider and API key are required' 
      }, { status: 400 })
    }

    let testResult: { success: boolean; error?: string }

    try {
      switch (provider) {
        case 'openai':
          testResult = await testOpenAI(apiKey, model)
          break
        case 'gemini':
          testResult = await testGemini(apiKey, model)
          break
        case 'claude':
          testResult = await testClaude(apiKey, model)
          break
        case 'mistral':
          testResult = await testMistral(apiKey, model)
          break
        case 'openrouter':
          testResult = await testOpenRouter(apiKey, model)
          break
        default:
          return NextResponse.json({ 
            success: false,
            error: 'Unsupported provider' 
          }, { status: 400 })
      }

      return NextResponse.json(testResult)

    } catch (error) {
      console.error(`Error testing ${provider}:`, error)
      return NextResponse.json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      })
    }

  } catch (error) {
    console.error('Error in test connection API:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Test OpenAI connection
async function testOpenAI(apiKey: string, model: string = 'gpt-4o-mini'): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Test connection. Reply with "OK"' }],
        max_tokens: 5,
        temperature: 0
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim()

    return { 
      success: true,
      error: undefined
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Test Google Gemini connection
async function testGemini(apiKey: string, model: string = 'gemini-1.5-flash'): Promise<{ success: boolean; error?: string }> {
  try {
    const modelName = model.startsWith('models/') ? model : `models/${model}`
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Test connection. Reply with "OK"' }]
        }],
        generationConfig: {
          maxOutputTokens: 5,
          temperature: 0
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Test Anthropic Claude connection
async function testClaude(apiKey: string, model: string = 'claude-3-haiku-20240307'): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Test connection. Reply with "OK"' }]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Test Mistral connection
async function testMistral(apiKey: string, model: string = 'mistral-small-latest'): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Test connection. Reply with "OK"' }],
        max_tokens: 5,
        temperature: 0
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Test OpenRouter connection
async function testOpenRouter(apiKey: string, model: string = 'meta-llama/llama-3.2-3b-instruct:free'): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Hita&Co eCommerce Platform'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Test connection. Reply with "OK"' }],
        max_tokens: 5,
        temperature: 0
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}