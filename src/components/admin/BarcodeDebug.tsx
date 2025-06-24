// =====================================
// Barcode Debug Component - Test & Fix Generation Issues
// src/components/admin/BarcodeDebug.tsx
// =====================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Bug, RefreshCw } from 'lucide-react'

// Import JsBarcode with error handling
let JsBarcode: any = null
try {
  JsBarcode = require('jsbarcode')
  console.log('✅ JsBarcode imported successfully')
} catch (error) {
  console.error('❌ JsBarcode import failed:', error)
}

export default function BarcodeDebug() {
  const [testBarcode, setTestBarcode] = useState('123456789012')
  const [testFormat, setTestFormat] = useState('CODE128')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearDebugInfo = () => {
    setDebugInfo([])
  }

  const testBarcodeGeneration = async () => {
    setIsGenerating(true)
    clearDebugInfo()
    
    addDebugInfo('🔍 Starting barcode generation test...')
    
    // Test 1: Check JsBarcode availability
    if (!JsBarcode) {
      addDebugInfo('❌ JsBarcode not available - checking dynamic import...')
      try {
        const JsBarcodeModule = await import('jsbarcode')
        JsBarcode = JsBarcodeModule.default || JsBarcodeModule
        addDebugInfo('✅ JsBarcode loaded via dynamic import')
      } catch (error) {
        addDebugInfo(`❌ Failed to load JsBarcode: ${error}`)
        setIsGenerating(false)
        return
      }
    } else {
      addDebugInfo('✅ JsBarcode is available')
    }

    // Test 2: Check canvas availability
    const canvas = canvasRef.current
    if (!canvas) {
      addDebugInfo('❌ Canvas ref is null')
      setIsGenerating(false)
      return
    }
    addDebugInfo('✅ Canvas element found')

    // Test 3: Check canvas context
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      addDebugInfo('❌ Could not get 2D context from canvas')
      setIsGenerating(false)
      return
    }
    addDebugInfo('✅ Canvas 2D context available')

    // Test 4: Set canvas dimensions
    try {
      canvas.width = 400
      canvas.height = 120
      addDebugInfo(`✅ Canvas dimensions set: ${canvas.width}x${canvas.height}`)
    } catch (error) {
      addDebugInfo(`❌ Failed to set canvas dimensions: ${error}`)
    }

    // Test 5: Clear canvas
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      addDebugInfo('✅ Canvas cleared and background set')
    } catch (error) {
      addDebugInfo(`❌ Failed to clear canvas: ${error}`)
    }

    // Test 6: Validate barcode input
    if (!testBarcode || testBarcode.trim() === '') {
      addDebugInfo('❌ Barcode input is empty')
      setIsGenerating(false)
      return
    }
    addDebugInfo(`✅ Barcode input valid: "${testBarcode}"`)

    // Test 7: Test simple JsBarcode call
    try {
      addDebugInfo(`🔄 Attempting to generate ${testFormat} barcode...`)
      
      JsBarcode(canvas, testBarcode, {
        format: testFormat,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 12,
        textMargin: 8,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
        valid: (valid: boolean) => {
          if (valid) {
            addDebugInfo('✅ JsBarcode validation passed')
          } else {
            addDebugInfo('❌ JsBarcode validation failed')
          }
        }
      })
      
      addDebugInfo('✅ JsBarcode generation completed without throwing')
      
      // Test if canvas actually has content
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const hasContent = imageData.data.some((pixel, index) => {
        // Check if any pixel is not white (RGB: 255,255,255)
        if (index % 4 === 3) return false // Skip alpha channel
        return pixel !== 255
      })
      
      if (hasContent) {
        addDebugInfo('✅ Canvas contains barcode data')
      } else {
        addDebugInfo('⚠️ Canvas appears empty (all white pixels)')
      }
      
    } catch (error) {
      addDebugInfo(`❌ JsBarcode generation failed: ${error}`)
      
      // Fallback: Draw error message on canvas
      ctx.fillStyle = '#ef4444'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Barcode Generation Failed', canvas.width / 2, canvas.height / 2)
      ctx.font = '10px Arial'
      ctx.fillText(String(error), canvas.width / 2, canvas.height / 2 + 20)
    }

    setIsGenerating(false)
  }

  // Test different formats
  const testFormats = ['CODE128', 'CODE39', 'UPC', 'EAN13']
  
  // Auto-test on mount
  useEffect(() => {
    setTimeout(testBarcodeGeneration, 500)
  }, [])

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Bug className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Barcode Generation Debug Tool</h3>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="testBarcode">Test Barcode</Label>
          <Input
            id="testBarcode"
            value={testBarcode}
            onChange={(e) => setTestBarcode(e.target.value)}
            placeholder="Enter barcode to test"
          />
        </div>
        <div>
          <Label htmlFor="testFormat">Format</Label>
          <select
            id="testFormat"
            value={testFormat}
            onChange={(e) => setTestFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {testFormats.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Button */}
      <Button 
        onClick={testBarcodeGeneration}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Bug className="h-4 w-4 mr-2" />
            Run Barcode Test
          </>
        )}
      </Button>

      {/* Canvas Display */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-2">Generated Barcode:</h4>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 max-w-full"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-white rounded-lg border">
        <div className="p-3 border-b flex items-center justify-between">
          <h4 className="font-medium">Debug Log</h4>
          <Button variant="outline" size="sm" onClick={clearDebugInfo}>
            Clear Log
          </Button>
        </div>
        <div className="p-3">
          {debugInfo.length === 0 ? (
            <p className="text-gray-500 text-sm">No debug information yet. Run a test to see details.</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-sm font-mono flex items-start gap-2">
                  {info.includes('✅') && <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />}
                  {info.includes('❌') && <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />}
                  {info.includes('⚠️') && <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />}
                  {info.includes('🔄') && <RefreshCw className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />}
                  <span className={`${
                    info.includes('✅') ? 'text-green-700' :
                    info.includes('❌') ? 'text-red-700' :
                    info.includes('⚠️') ? 'text-yellow-700' :
                    'text-gray-700'
                  }`}>
                    {info}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Fix Suggestions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Common Issues & Quick Fixes:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>JsBarcode not found:</strong> Run <code className="bg-blue-100 px-1 rounded">npm install jsbarcode</code></li>
          <li>• <strong>Canvas context null:</strong> Ensure component is mounted before calling</li>
          <li>• <strong>Empty canvas:</strong> Check barcode format and input validation</li>
          <li>• <strong>Invalid format:</strong> Try CODE128 first (most compatible)</li>
          <li>• <strong>Validation fails:</strong> Check barcode length and characters</li>
        </ul>
      </div>
    </div>
  )
}