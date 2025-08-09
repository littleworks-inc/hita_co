// src/app/api/thermal-print/route.ts
// 🔧 Backend API for direct thermal printer communication

import { NextRequest, NextResponse } from 'next/server'
import net from 'net'

interface ThermalPrintRequest {
  zplCode: string
  printerIP: string
  port?: number
  timeout?: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error occurred'
}

export async function POST(request: NextRequest) {
  try {
    const { zplCode, printerIP, port = 9100, timeout = 5000 }: ThermalPrintRequest = await request.json()

    // Validate input
    if (!zplCode || !printerIP) {
      return NextResponse.json(
        { error: 'Missing required fields: zplCode and printerIP' },
        { status: 400 }
      )
    }

    // Validate IP address format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(printerIP)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      )
    }

    // Send ZPL to thermal printer
    const result = await sendZPLToPrinter(zplCode, printerIP, port, timeout)

    return NextResponse.json({
      success: true,
      message: 'Label sent to printer successfully',
      printerIP,
      port,
      timestamp: new Date().toISOString(),
      ...result
    })

  } catch (error) {
    console.error('Thermal print API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send to thermal printer',
        details: getErrorMessage(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Send ZPL code directly to thermal printer via raw TCP socket
async function sendZPLToPrinter(
  zplCode: string, 
  printerIP: string, 
  port: number, 
  timeout: number
): Promise<{ bytesSent: number; responseTime: number }> {
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    // Create TCP socket connection
    const socket = new net.Socket()
    
    // Set timeout
    socket.setTimeout(timeout)
    
    socket.connect(port, printerIP, () => {
      console.log(`Connected to thermal printer at ${printerIP}:${port}`)
      
      // Send ZPL code as raw bytes
      const zplBuffer = Buffer.from(zplCode, 'utf8')
      socket.write(zplBuffer)
    })
    
    socket.on('data', (data) => {
      console.log('Printer response:', data.toString())
      // Some printers send status responses
      socket.destroy()
      
      const responseTime = Date.now() - startTime
      resolve({
        bytesSent: Buffer.from(zplCode, 'utf8').length,
        responseTime
      })
    })
    
    socket.on('close', () => {
      console.log('Printer connection closed')
      const responseTime = Date.now() - startTime
      resolve({
        bytesSent: Buffer.from(zplCode, 'utf8').length,
        responseTime
      })
    })
    
    socket.on('error', (error) => {
      console.error('Printer socket error:', error)
      socket.destroy()
      reject(new Error(`Printer connection failed: ${error.message}`))
    })
    
    socket.on('timeout', () => {
      console.error('Printer connection timeout')
      socket.destroy()
      reject(new Error(`Printer connection timeout after ${timeout}ms`))
    })
    
    // Send end of transmission after a short delay
    setTimeout(() => {
      socket.end()
    }, 100)
  })
}

// Optional: GET endpoint to test printer connectivity
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const printerIP = searchParams.get('ip')
  const port = parseInt(searchParams.get('port') || '9100')

  if (!printerIP) {
    return NextResponse.json(
      { error: 'Missing printer IP parameter' },
      { status: 400 }
    )
  }

  try {
    // Send a simple status query to test connectivity
    const testZPL = '^XA^HH^XZ' // Simple status query
    await sendZPLToPrinter(testZPL, printerIP, port, 3000)
    
    return NextResponse.json({
      success: true,
      message: 'Printer is reachable',
      printerIP,
      port,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Printer not reachable',
        details: getErrorMessage(error),
        printerIP,
        port,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}