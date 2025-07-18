// src/components/admin/BarcodeDiagnostic.tsx
// 🔧 DIAGNOSTIC: Find exactly where barcode generation is failing
"use client"

import React, { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const BarcodeDiagnostic: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [log, setLog] = useState<string[]>([])
  const [imageData, setImageData] = useState<string>('')

  const addLog = (message: string) => {
    console.log(message)
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearLog = () => {
    setLog([])
    setImageData('')
  }

  // Test 1: Basic canvas drawing
  const testBasicCanvasDrawing = () => {
    clearLog()
    addLog('🔄 Testing basic canvas drawing...')

    try {
      const canvas = canvasRef.current
      if (!canvas) {
        addLog('❌ Canvas element not found')
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        addLog('❌ Canvas context not available')
        return
      }

      // Set canvas size
      canvas.width = 300
      canvas.height = 100
      addLog(`✅ Canvas size set: ${canvas.width}x${canvas.height}`)

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      addLog('✅ Canvas cleared with white background')

      // Draw simple barcode pattern
      ctx.fillStyle = '#000000'
      
      // Draw vertical bars
      for (let i = 0; i < 20; i++) {
        if (i % 3 === 0 || i % 5 === 0) {
          ctx.fillRect(20 + i * 12, 20, 3, 50)
        }
      }
      addLog('✅ Black bars drawn on canvas')

      // Add text
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('HC-DRES-014002', canvas.width / 2, 85)
      addLog('✅ Text added to canvas')

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png')
      if (dataUrl && dataUrl.length > 100) {
        setImageData(dataUrl)
        addLog(`✅ Data URL generated: ${dataUrl.length} characters`)
        addLog(`✅ Data URL preview: ${dataUrl.substring(0, 50)}...`)
      } else {
        addLog('❌ Data URL generation failed or empty')
      }

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Test 2: JsBarcode import test
  const testJsBarcodeImport = async () => {
    clearLog()
    addLog('🔄 Testing JsBarcode import...')

    try {
      addLog('🔄 Attempting dynamic import...')
      const module = await import('jsbarcode')
      addLog(`✅ Module imported: ${typeof module}`)
      
      const JsBarcode = module.default
      addLog(`✅ JsBarcode: ${typeof JsBarcode}`)

      if (!JsBarcode) {
        addLog('❌ JsBarcode.default is undefined')
        return
      }

      const canvas = canvasRef.current
      if (!canvas) {
        addLog('❌ Canvas not found')
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        addLog('❌ Canvas context not available')
        return
      }

      canvas.width = 300
      canvas.height = 100

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      addLog('✅ Canvas prepared for JsBarcode')

      // Try JsBarcode
      addLog('🔄 Calling JsBarcode...')
      JsBarcode(canvas, 'HC-DRES-014002', {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 10
      })
      addLog('✅ JsBarcode call completed')

      // Wait and check
      setTimeout(() => {
        const dataUrl = canvas.toDataURL('image/png')
        if (dataUrl && dataUrl.length > 100) {
          setImageData(dataUrl)
          addLog(`✅ JsBarcode data URL: ${dataUrl.length} characters`)
        } else {
          addLog('❌ JsBarcode failed to generate image')
        }
      }, 500)

    } catch (error) {
      addLog(`❌ JsBarcode error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Test 3: Print simulation
  const testPrintSimulation = () => {
    if (!imageData) {
      addLog('❌ No image data available for print test')
      return
    }

    addLog('🔄 Testing print simulation...')

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Test Print</title>
          <style>
            body { margin: 0; padding: 20px; text-align: center; font-family: Arial; }
            .barcode { margin: 20px auto; }
            .barcode img { max-width: 100%; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <h3>Test Print</h3>
          <div class="barcode">
            <img src="${imageData}" alt="Test Barcode" />
          </div>
          <p>HC-DRES-014002</p>
          <p>$34.52</p>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=500,height=400')
    if (printWindow) {
      printWindow.document.write(printHTML)
      printWindow.document.close()
      addLog('✅ Print window opened successfully')
    } else {
      addLog('❌ Failed to open print window (popup blocked?)')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Barcode Diagnostic Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button onClick={testBasicCanvasDrawing} variant="outline">
            Test Canvas Drawing
          </Button>
          <Button onClick={testJsBarcodeImport} variant="outline">
            Test JsBarcode Import
          </Button>
          <Button onClick={testPrintSimulation} variant="outline" disabled={!imageData}>
            Test Print
          </Button>
        </div>

        {/* Canvas Display */}
        <div className="border rounded-lg p-4 bg-white text-center">
          <div className="text-sm font-medium mb-2">Generated Image:</div>
          {imageData ? (
            <div>
              <img 
                src={imageData} 
                alt="Test Output" 
                className="mx-auto border max-w-full h-auto"
                style={{ imageRendering: 'crisp-edges' }}
              />
              <div className="text-xs text-green-600 mt-2">
                ✅ Image generated ({imageData.length} chars)
              </div>
            </div>
          ) : (
            <div className="py-8 text-gray-500">
              No image generated yet
            </div>
          )}
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Log Display */}
        <div className="border rounded-lg">
          <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-medium">Diagnostic Log</span>
            <Button onClick={clearLog} variant="ghost" size="sm">Clear</Button>
          </div>
          <div className="p-3 bg-gray-900 text-green-400 font-mono text-sm max-h-60 overflow-y-auto">
            {log.length === 0 ? (
              <div className="text-gray-500">Run a test to see diagnostic information...</div>
            ) : (
              log.map((entry, index) => (
                <div key={index} className={
                  entry.includes('❌') ? 'text-red-400' :
                  entry.includes('✅') ? 'text-green-400' :
                  entry.includes('🔄') ? 'text-blue-400' :
                  'text-gray-300'
                }>
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <div className="font-medium mb-1">Instructions:</div>
          <div>1. Run "Test Canvas Drawing" - should create black bars</div>
          <div>2. Run "Test JsBarcode Import" - tests the library</div>
          <div>3. Run "Test Print" - opens print window with generated image</div>
          <div className="mt-2 text-orange-600">
            <strong>Check browser console for additional details!</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarcodeDiagnostic