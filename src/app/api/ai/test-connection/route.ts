import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, apiKey, model } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API key are required' },
        { status: 400 }
      )
    }

    // Test the connection based on provider
    let testResult
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
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported provider: ${provider}` },
          { status: 400 }
        )
    }

    return NextResponse.json(testResult)

  } catch (error) {
    console.error('AI test connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}

async function testOpenAI(apiKey: string, model: string = 'gpt-4o-mini') {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }],
        max_tokens: 5
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content

    return {
      success: true,
      message: `OpenAI connection successful using ${model}. Response: ${reply}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OpenAI connection failed'
    }
  }
}

async function testGemini(apiKey: string, model: string = 'gemini-1.5-flash') {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Test connection - respond with "OK"' }]
          }],
          generationConfig: {
            maxOutputTokens: 5
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

    return {
      success: true,
      message: `Gemini connection successful using ${model}. Response: ${reply}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gemini connection failed'
    }
  }
}

async function testClaude(apiKey: string, model: string = 'claude-3-haiku-20240307') {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text

    return {
      success: true,
      message: `Claude connection successful using ${model}. Response: ${reply}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Claude connection failed'
    }
  }
}

async function testMistral(apiKey: string, model: string = 'mistral-small-latest') {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Test connection - respond with "OK"' }],
        max_tokens: 5
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content

    return {
      success: true,
      message: `Mistral connection successful using ${model}. Response: ${reply}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Mistral connection failed'
    }
  }
}