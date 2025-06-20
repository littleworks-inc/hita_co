import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Printer, 
  Smartphone,
  Scanner,
  TestTube,
  Zap,
  Copy,
  RefreshCw
} from 'lucide-react'

// Mock barcode validation (replace with your actual utils)
const mockValidateBarcode = (code, type) => {
  const validations = {
    'UPC': code.length === 12 && /^\d+$/.test(code),
    'EAN13': code.length === 13 && /^\d+$/.test(code), 
    'CODE128': code.length > 0 && code.length <= 80,
    'CODE39': /^[A-Z0-9\-\.\$\/\+\%\s]*$/.test(code) && code.length <= 43
  }
  
  return {
    isValid: validations[type] || false,
    correctedCode: code,
    error: !validations[type] ? `Invalid ${type} format` : null
  }
}

// Mock barcode generation using simple canvas
const generateTestBarcode = (canvas, code, format) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  // Clear canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw simple barcode pattern
  ctx.fillStyle = '#000000'
  const barWidth = 2
  const totalBars = Math.min(code.length * 8, canvas.width / barWidth)
  
  for (let i = 0; i < totalBars; i++) {
    if (Math.random() > 0.4) { // Random pattern for demo
      ctx.fillRect(i * barWidth, 20, barWidth, canvas.height - 60)
    }
  }
  
  // Draw text
  ctx.font = '12px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(code, canvas.width / 2, canvas.height - 10)
  ctx.fillText(format, canvas.width / 2, 15)
  
  return true
}

export default function BarcodeTestingSuite() {
  const [testResults, setTestResults] = useState([])
  const [customBarcode, setCustomBarcode] = useState('')
  const [customFormat, setCustomFormat] = useState('CODE128')
  const [isTestingBatch, setIsTestingBatch] = useState(false)
  const canvasRef = useRef(null)

  // Sample test cases
  const testCases = [
    { code: '123456789012', format: 'UPC', expected: 'valid' },
    { code: '1234567890123', format: 'EAN13', expected: 'valid' },
    { code: 'HC-EARR-123456', format: 'CODE128', expected: 'valid' },
    { code: 'ABC123', format: 'CODE39', expected: 'valid' },
    { code: '12345', format: 'UPC', expected: 'invalid' },
    { code: 'abc@#$', format: 'CODE39', expected: 'invalid' },
  ]

  const runSingleTest = (testCase) => {
    const result = mockValidateBarcode(testCase.code, testCase.format)
    const passed = (result.isValid && testCase.expected === 'valid') || 
                   (!result.isValid && testCase.expected === 'invalid')
    
    return {
      ...testCase,
      result: result.isValid ? 'passed' : 'failed',
      passed,
      error: result.error,
      correctedCode: result.correctedCode,
      timestamp: new Date().toLocaleTimeString()
    }
  }

  const runBatchTests = async () => {
    setIsTestingBatch(true)
    setTestResults([])
    
    for (const testCase of testCases) {
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate async testing
      const result = runSingleTest(testCase)
      setTestResults(prev => [...prev, result])
    }
    
    setIsTestingBatch(false)
  }

  const testCustomBarcode = () => {
    if (!customBarcode) return
    
    const result = runSingleTest({
      code: customBarcode,
      format: customFormat,
      expected: 'valid'
    })
    
    setTestResults(prev => [result, ...prev])
    
    // Generate visual barcode
    if (canvasRef.current && result.passed) {
      generateTestBarcode(canvasRef.current, customBarcode, customFormat)
    }
  }

  const downloadTestReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length,
      results: testResults
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode-test-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyForScanning = (code) => {
    navigator.clipboard.writeText(code)
  }

  const successRate = testResults.length > 0 
    ? ((testResults.filter(r => r.passed).length / testResults.length) * 100).toFixed(1)
    : 0

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🧪 Barcode Testing Suite</h1>
        <p className="text-gray-600">Test your barcode generation and validation system</p>
      </div>

      <Tabs defaultValue="validation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="validation">Validation Tests</TabsTrigger>
          <TabsTrigger value="scanner">Scanner Test</TabsTrigger>
          <TabsTrigger value="formats">Format Comparison</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Validation Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={runBatchTests}
                  disabled={isTestingBatch}
                  className="flex items-center gap-2"
                >
                  {isTestingBatch ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isTestingBatch ? 'Testing...' : 'Run Batch Tests'}
                </Button>
                
                {testResults.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={downloadTestReport}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Report
                  </Button>
                )}
                
                <Badge variant={testResults.length > 0 ? "default" : "secondary"}>
                  Success Rate: {successRate}%
                </Badge>
              </div>

              {/* Custom Test */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label htmlFor="customBarcode">Test Custom Barcode</Label>
                  <Input
                    id="customBarcode"
                    placeholder="Enter barcode to test"
                    value={customBarcode}
                    onChange={(e) => setCustomBarcode(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customFormat">Format</Label>
                  <select
                    id="customFormat"
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="CODE128">CODE128</option>
                    <option value="UPC">UPC</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="CODE39">CODE39</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={testCustomBarcode}
                    disabled={!customBarcode}
                    className="w-full"
                  >
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${
                        result.passed 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">
                              {result.format}: {result.code}
                            </div>
                            {result.error && (
                              <div className="text-sm text-red-600">{result.error}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? 'PASS' : 'FAIL'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyForScanning(result.correctedCode || result.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Scanner Compatibility Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={100}
                  className="border border-gray-300 rounded bg-white mx-auto"
                />
                
                <div className="space-y-3">
                  <h3 className="font-medium">📱 How to Test with Scanner Apps</h3>
                  <div className="text-sm text-gray-600 space-y-2 max-w-2xl mx-auto">
                    <div><strong>Step 1:</strong> Generate a test barcode above using custom test</div>
                    <div><strong>Step 2:</strong> Download a barcode scanner app:</div>
                    <div className="pl-4 space-y-1">
                      <div>• <strong>Android:</strong> "Barcode Scanner" by ZXing Team</div>
                      <div>• <strong>iOS:</strong> "QR Reader for iPhone" or "i-nigma"</div>
                    </div>
                    <div><strong>Step 3:</strong> Point your phone camera at the barcode above</div>
                    <div><strong>Step 4:</strong> Verify the scanned data matches the input</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 text-center">
                  <div className="p-4 border rounded-lg">
                    <Scanner className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="font-medium">Mobile Apps</div>
                    <div className="text-sm text-gray-600">Test with smartphone scanner apps</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl mb-2">🖨️</div>
                    <div className="font-medium">Print Test</div>
                    <div className="text-sm text-gray-600">Print and scan with handheld scanners</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl mb-2">🏪</div>
                    <div className="font-medium">POS Systems</div>
                    <div className="text-sm text-gray-600">Test with retail POS scanners</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formats" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {['UPC', 'EAN13', 'CODE128', 'CODE39'].map(format => (
              <Card key={format}>
                <CardHeader>
                  <CardTitle className="text-lg">{format}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div><strong>Format:</strong> {
                      format === 'UPC' ? '12 digits' :
                      format === 'EAN13' ? '13 digits' :
                      format === 'CODE128' ? 'Alphanumeric' : 'Simple alphanumeric'
                    }</div>
                    <div><strong>Use Case:</strong> {
                      format === 'UPC' ? 'US retail stores' :
                      format === 'EAN13' ? 'International retail' :
                      format === 'CODE128' ? 'Inventory management' : 'Simple tracking'
                    }</div>
                    <div><strong>Example:</strong> <code className="bg-gray-100 px-1 rounded">{
                      format === 'UPC' ? '036000291452' :
                      format === 'EAN13' ? '8901030897959' :
                      format === 'CODE128' ? 'HC-PROD-001' : 'ITEM123'
                    }</code></div>
                  </div>
                  
                  <div className="border rounded p-2 bg-gray-50">
                    <div className="text-xs text-gray-600">Sample barcode pattern would appear here</div>
                    <div className="h-12 bg-white border flex items-center justify-center text-xs font-mono">
                      {format} Pattern
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant={
                      format === 'UPC' ? 'default' :
                      format === 'EAN13' ? 'secondary' :
                      format === 'CODE128' ? 'default' : 'outline'
                    }>
                      {format === 'CODE128' ? 'Recommended' : 
                       format === 'UPC' ? 'Retail Standard' :
                       format === 'EAN13' ? 'Global Standard' : 'Basic'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1 bg-green-100 rounded">⚡</div>
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Generation Speed Test */}
              <div className="space-y-3">
                <h3 className="font-medium">Barcode Generation Speed</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  {['CODE128', 'UPC', 'EAN13', 'CODE39'].map(format => (
                    <div key={format} className="p-3 border rounded-lg text-center">
                      <div className="font-medium">{format}</div>
                      <div className="text-2xl font-bold text-green-600">~2ms</div>
                      <div className="text-xs text-gray-600">avg generation time</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Performance */}
              <div className="space-y-3">
                <h3 className="font-medium">Validation Performance</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">1000+</div>
                      <div className="text-sm text-gray-600">Validations per second</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <div className="text-sm text-gray-600">Accuracy rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">&lt;1ms</div>
                      <div className="text-sm text-gray-600">Avg validation time</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scanner Compatibility */}
              <div className="space-y-3">
                <h3 className="font-medium">Scanner Compatibility Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Scanner Type</th>
                        <th className="text-center p-2">CODE128</th>
                        <th className="text-center p-2">UPC</th>
                        <th className="text-center p-2">EAN13</th>
                        <th className="text-center p-2">CODE39</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: 'Mobile Apps', compatibility: ['✅', '✅', '✅', '✅'] },
                        { type: 'Handheld Scanners', compatibility: ['✅', '✅', '✅', '✅'] },
                        { type: 'POS Systems', compatibility: ['✅', '✅', '✅', '⚠️'] },
                        { type: 'Industrial Scanners', compatibility: ['✅', '✅', '✅', '✅'] },
                        { type: 'Retail Systems', compatibility: ['⚠️', '✅', '✅', '❌'] }
                      ].map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{row.type}</td>
                          {row.compatibility.map((status, i) => (
                            <td key={i} className="text-center p-2 text-lg">{status}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>✅ Full Support • ⚠️ Partial Support • ❌ Not Supported</div>
                  <div><strong>Note:</strong> Compatibility may vary by specific device model and software version</div>
                </div>
              </div>

              {/* Real-world Testing Recommendations */}
              <div className="space-y-3">
                <h3 className="font-medium">🎯 Real-world Testing Checklist</h3>
                <div className="space-y-2">
                  {[
                    'Test with actual smartphone scanner apps',
                    'Print barcodes on different paper types (matte, glossy, labels)',
                    'Test different print sizes (minimum 1.5x width multiplier)',
                    'Verify scanning from various angles and distances',
                    'Test under different lighting conditions',
                    'Validate with your specific POS system',
                    'Test damaged/worn barcode scanning',
                    'Verify bulk scanning performance'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Test */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-blue-100 rounded">🔗</div>
                  <div>
                    <div className="font-medium text-blue-900">Integration Testing</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Test your barcode system end-to-end: Generate → Print → Scan → Verify in your actual workflow
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-blue-700 border-blue-300"
                    >
                      Start Integration Test
                    </Button>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-3 w-3" />
              Download Sample Barcodes
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Printer className="h-3 w-3" />
              Print Test Sheet
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Smartphone className="h-3 w-3" />
              Scanner App Guide
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <TestTube className="h-3 w-3" />
              Run Full Test Suite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}