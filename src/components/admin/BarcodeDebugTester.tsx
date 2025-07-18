// src/components/admin/BarcodeDebugTester.tsx
// 🔧 DEBUG: Complete barcode generation testing component
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Bug, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Download,
  Copy
} from 'lucide-react'

interface BarcodeDebugTesterProps {
  initialBarcode?: string
}

const BarcodeDebugTester: React.FC<BarcodeDebugTesterProps> = ({ 
  initialBarcode = "HC-DRES-014002" 
}) => {
  const [testBarcode, setTestBarcode] = useState(initialBarcode)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [barcodeImage, setBarcodeImage] = useState<string>('')
  const [testResult, setTestResult] = useState<'success' | 'failed' | 'pending'>('pending')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  const clearLog = () => {
    setDebugLog([])
    setBarcodeImage('')
    setTestResult('pending')
  }

  // Test barcode generation step by step
  const runCompleteTest = async () => {
    setIsTesting(true)
    clearLog()
    
    addLog('🔄 Starting comprehensive barcode test...')

    try {
      // Step 1: Check barcode input
      if (!testBarcode || testBarcode.trim() === '') {
        addLog('❌ No barcode input provided')
        setTestResult('failed')
        return
      }
      addLog(`✅ Barcode input: "${testBarcode}"`)

      // Step 2: Check canvas availability
      const canvas = canvasRef.current
      if (!canvas) {
        addLog('❌ Canvas element not found')
        setTestResult('failed')
        return
      }
      addLog('✅ Canvas element found')

      // Step 3: Get canvas context
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        addLog('❌ Could not get 2D context')
        setTestResult('failed')
        return
      }
      addLog('✅ Canvas 2D context obtained')

      // Step 4: Test JsBarcode import
      let JsBarcode
      try {
        addLog('🔄 Importing JsBarcode...')
        const module = await import('jsbarcode')
        JsBarcode = module.default
        if (!JsBarcode) {
          throw new Error('JsBarcode.default is undefined')
        }
        addLog('✅ JsBarcode imported successfully')
      } catch (importError) {
        addLog(`❌ JsBarcode import failed: ${importError}`)
        setTestResult('failed')
        return
      }

      // Step 5: Set up canvas
      try {
        canvas.width = 400
        canvas.height = 120
        addLog(`✅ Canvas dimensions set: ${canvas.width}x${canvas.height}`)
      } catch (sizeError) {
        addLog(`❌ Failed to set canvas size: ${sizeError}`)
        setTestResult('failed')
        return
      }

      // Step 6: Clear canvas
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        addLog('✅ Canvas cleared and background set to white')
      } catch (clearError) {
        addLog(`❌ Failed to clear canvas: ${clearError}`)
        setTestResult('failed')
        return
      }

      // Step 7: Generate barcode with JsBarcode
      try {
        addLog('🔄 Generating barcode with JsBarcode...')
        
        JsBarcode(canvas, testBarcode, {
          format: "CODE128",
          width: 2,
          height: 70,
          displayValue: true,
          fontSize: 14,
          textMargin: 10,
          margin: 20,
          background: '#ffffff',
          lineColor: '#000000',
          fontOptions: 'bold',
          textAlign: 'center',
          textPosition: 'bottom',
          valid: function(valid) {
            if (valid) {
              addLog('✅ JsBarcode validation: VALID')
            } else {
              addLog('❌ JsBarcode validation: INVALID')
              throw new Error('Barcode validation failed')
            }
          }
        })
        
        addLog('✅ JsBarcode generation completed without errors')
      } catch (barcodeError) {
        addLog(`❌ JsBarcode generation failed: ${barcodeError}`)
        setTestResult('failed')
        return
      }

      // Step 8: Check if canvas has content
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let hasBlackPixels = false
        
        // Check for black pixels (not white)
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i]
          const g = imageData.data[i + 1] 
          const b = imageData.data[i + 2]
          
          // If any pixel is not white (255,255,255), we have content
          if (r < 255 || g < 255 || b < 255) {
            hasBlackPixels = true
            break
          }
        }
        
        if (hasBlackPixels) {
          addLog('✅ Canvas contains barcode pixels (visual barcode generated)')
        } else {
          addLog('⚠️ Canvas appears to be all white pixels (no visual barcode)')
          setTestResult('failed')
          return
        }
      } catch (pixelError) {
        addLog(`❌ Failed to check canvas pixels: ${pixelError}`)
        setTestResult('failed')
        return
      }

      // Step 9: Convert to data URL
      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0)
        if (dataUrl && dataUrl.length > 100) {
          setBarcodeImage(dataUrl)
          addLog(`✅ Barcode converted to data URL (${dataUrl.length} characters)`)
          
          // Copy to display canvas
          if (displayCanvasRef.current) {
            const displayCtx = displayCanvasRef.current.getContext('2d')
            if (displayCtx) {
              displayCanvasRef.current.width = canvas.width
              displayCanvasRef.current.height = canvas.height
              displayCtx.drawImage(canvas, 0, 0)
              addLog('✅ Barcode copied to display canvas')
            }
          }
        } else {
          throw new Error('Data URL is empty or too short')
        }
      } catch (urlError) {
        addLog(`❌ Failed to convert to data URL: ${urlError}`)
        setTestResult('failed')
        return
      }

      // Step 10: Success!
      addLog('🎉 ALL TESTS PASSED - Barcode generation successful!')
      setTestResult('success')

    } catch (overallError) {
      addLog(`❌ Overall test failed: ${overallError}`)
      setTestResult('failed')
    } finally {
      setIsTesting(false)
    }
  }

  // Generate simple test pattern (fallback)
  const generateTestPattern = () => {
    const canvas = displayCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 400
    canvas.height = 120

    // Clear background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw test barcode pattern
    ctx.fillStyle = '#000000'
    const barWidth = 3
    const startX = 50

    // Create pattern
    for (let i = 0; i < 30; i++) {
      if (i % 3 === 0 || i % 5 === 0) {
        ctx.fillRect(startX + (i * 8), 20, barWidth, 60)
      }
    }

    // Add text
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(testBarcode, canvas.width / 2, 100)

    addLog('✅ Test pattern generated as fallback')
  }

  // Download barcode image
  const downloadBarcode = () => {
    if (!barcodeImage) return

    const link = document.createElement('a')
    link.download = `barcode-${testBarcode}.png`
    link.href = barcodeImage
    link.click()
  }

  // Copy barcode to clipboard
  const copyBarcode = () => {
    navigator.clipboard.writeText(testBarcode)
    addLog('📋 Barcode copied to clipboard')
  }

  // Auto-run test on mount
  useEffect(() => {
    setTimeout(() => {
      runCompleteTest()
    }, 500)
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-blue-600" />
            Barcode Generation Debug & Test
            {testResult === 'success' && <Badge className="bg-green-100 text-green-800">✅ Working</Badge>}
            {testResult === 'failed' && <Badge className="bg-red-100 text-red-800">❌ Failed</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Test Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Test Barcode</label>
              <Input
                value={testBarcode}
                onChange={(e) => setTestBarcode(e.target.value)}
                placeholder="Enter barcode to test"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={runCompleteTest}
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Barcode Display */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Generated Barcode</h3>
              <div className="bg-white border rounded-lg p-4 text-center min-h-[140px] flex items-center justify-center">
                {barcodeImage ? (
                  <div>
                    <img 
                      src={barcodeImage} 
                      alt="Generated Barcode" 
                      className="mx-auto max-w-full h-auto border"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                    <div className="text-xs text-green-600 mt-2">✅ Visual barcode generated</div>
                  </div>
                ) : testResult === 'failed' ? (
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                    <div className="text-sm text-red-600">Barcode generation failed</div>
                    <Button 
                      onClick={generateTestPattern}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Generate Test Pattern
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-2 animate-spin" />
                    <div className="text-sm text-gray-500">Generating barcode...</div>
                  </div>
                )}
              </div>
              
              {/* Display Canvas */}
              <canvas 
                ref={displayCanvasRef}
                className="hidden"
              />
              
              {/* Actions */}
              {barcodeImage && (
                <div className="flex gap-2 mt-3">
                  <Button onClick={downloadBarcode} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={copyBarcode} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              )}
            </div>

            {/* Debug Log */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Debug Log</h3>
                <Button onClick={clearLog} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-3 h-64 overflow-y-auto text-xs font-mono">
                {debugLog.length === 0 ? (
                  <div className="text-gray-500">No debug information yet...</div>
                ) : (
                  debugLog.map((log, index) => (
                    <div 
                      key={index} 
                      className={`mb-1 ${
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('⚠️') ? 'text-yellow-400' :
                        log.includes('🔄') ? 'text-blue-400' :
                        log.includes('🎉') ? 'text-green-300' :
                        'text-gray-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Hidden Canvas for Generation */}
          <canvas 
            ref={canvasRef}
            className="hidden"
          />

        </CardContent>
      </Card>
    </div>
  )
}

export default BarcodeDebugTester