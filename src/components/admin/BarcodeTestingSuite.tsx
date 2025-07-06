// src/components/admin/BarcodeTestingSuite.tsx
// Complete Barcode Testing Suite with all TypeScript fixes

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
  QrCode, // ✅ FIXED: Using QrCode instead of Scanner
  TestTube,
  Zap,
  Copy,
  RefreshCw
} from 'lucide-react'

// ✅ FIXED: TypeScript interfaces
interface TestCase {
  code: string
  format: string
  expected: 'valid' | 'invalid'
}

interface TestResult extends TestCase {
  result: 'PASS' | 'FAIL'
  passed: boolean
  actualResult: boolean
  error?: string | null
}

interface ValidationResult {
  isValid: boolean
  correctedCode: string
  error: string | null
}

// ✅ FIXED: Mock barcode validation with proper types
const mockValidateBarcode = (code: string, type: string): ValidationResult => {
  const validations = {
    'UPC': code.length === 12 && /^\d+$/.test(code),
    'EAN13': code.length === 13 && /^\d+$/.test(code), 
    'CODE128': code.length > 0 && code.length <= 80,
    'CODE39': /^[A-Z0-9\-\.\$\/\+\%\s]*$/.test(code) && code.length <= 43
  }
  
  return {
    isValid: validations[type as keyof typeof validations] || false,
    correctedCode: code,
    error: !validations[type as keyof typeof validations] ? `Invalid ${type} format` : null
  }
}

// ✅ FIXED: Mock barcode generation with proper types
const generateTestBarcode = (canvas: HTMLCanvasElement, code: string, format: string): boolean => {
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
  // ✅ FIXED: State with proper TypeScript types
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [customBarcode, setCustomBarcode] = useState<string>('')
  const [customFormat, setCustomFormat] = useState<string>('CODE128')
  const [isTestingBatch, setIsTestingBatch] = useState<boolean>(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ✅ FIXED: Sample test cases with proper typing
  const testCases: TestCase[] = [
    { code: '123456789012', format: 'UPC', expected: 'valid' },
    { code: '1234567890123', format: 'EAN13', expected: 'valid' },
    { code: 'HC-EARR-123456', format: 'CODE128', expected: 'valid' },
    { code: 'ABC123', format: 'CODE39', expected: 'valid' },
    { code: '12345', format: 'UPC', expected: 'invalid' },
    { code: 'abc@#$', format: 'CODE39', expected: 'invalid' },
  ]

  // ✅ FIXED: Function with proper type annotations
  const runSingleTest = (testCase: TestCase): TestResult => {
    const result = mockValidateBarcode(testCase.code, testCase.format)
    const passed = (result.isValid && testCase.expected === 'valid') || 
                   (!result.isValid && testCase.expected === 'invalid')
    
    return {
      ...testCase,
      result: passed ? 'PASS' : 'FAIL',
      passed,
      actualResult: result.isValid,
      error: result.error
    }
  }

  // ✅ FIXED: Async function with proper return type
  const runBatchTests = async (): Promise<void> => {
    setIsTestingBatch(true)
    const results: TestResult[] = []
    
    for (const testCase of testCases) {
      const result = runSingleTest(testCase)
      results.push(result)
      // Add small delay for demo effect
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setTestResults(results)
    setIsTestingBatch(false)
  }

  // ✅ FIXED: Function with proper return type
  const runCustomTest = (): void => {
    if (!customBarcode.trim()) return
    
    const customTestCase: TestCase = {
      code: customBarcode,
      format: customFormat,
      expected: 'valid'
    }
    
    const result = runSingleTest(customTestCase)
    
    // Generate visual barcode if canvas is available
    if (canvasRef.current) {
      generateTestBarcode(canvasRef.current, customBarcode, customFormat)
    }
    
    // Add to results
    setTestResults(prev => [...prev, result])
  }

  // ✅ FIXED: Function with proper return type
  const downloadTestReport = (): void => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.passed).length,
        failed: testResults.filter(r => !r.passed).length,
        successRate: testResults.length > 0 ? 
          ((testResults.filter(r => r.passed).length / testResults.length) * 100).toFixed(1) + '%' : '0%'
      },
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

  // ✅ FIXED: Function with proper return type
  const clearResults = (): void => {
    setTestResults([])
  }

  // ✅ FIXED: Variable with proper type annotation
  const successRate: number = testResults.length > 0 
    ? ((testResults.filter(r => r.passed).length / testResults.length) * 100)
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
                
                <Badge variant={testResults.length > 0 ? 
                  (successRate >= 80 ? 'default' : 'destructive') : 'secondary'
                }>
                  {testResults.length > 0 ? `${successRate.toFixed(1)}% Pass Rate` : 'No Tests Run'}
                </Badge>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Test Results</h4>
                    <Button variant="ghost" size="sm" onClick={clearResults}>
                      Clear Results
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-mono text-sm">{result.code}</span>
                          <Badge variant="outline" className="text-xs">{result.format}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.passed ? 'default' : 'destructive'}>
                            {result.result}
                          </Badge>
                          {result.error && (
                            <span className="text-xs text-red-500">{result.error}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Test */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="customBarcode">Barcode</Label>
                  <Input
                    id="customBarcode"
                    value={customBarcode}
                    onChange={(e) => setCustomBarcode(e.target.value)}
                    placeholder="Enter barcode to test"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customFormat">Format</Label>
                  <select
                    id="customFormat"
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CODE128">CODE128</option>
                    <option value="UPC">UPC</option>
                    <option value="EAN13">EAN13</option>
                    <option value="CODE39">CODE39</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={runCustomTest} className="w-full">
                    Test Barcode
                  </Button>
                </div>
              </div>
              
              {/* Generated Barcode Preview */}
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={100}
                  className="border border-gray-300 rounded"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scanner Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-3">
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
                  <QrCode className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-medium">Mobile Apps</div>
                  <div className="text-sm text-gray-600">Test with smartphone scanner apps</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <Printer className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="font-medium">Print Test</div>
                  <div className="text-sm text-gray-600">Print and scan with handheld scanners</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="font-medium">POS Systems</div>
                  <div className="text-sm text-gray-600">Test with retail POS scanners</div>
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
                      format === 'CODE128' ? 'Internal tracking' : 'Industrial applications'
                    }</div>
                    <div><strong>Capacity:</strong> {
                      format === 'UPC' ? '12 numeric characters' :
                      format === 'EAN13' ? '13 numeric characters' :
                      format === 'CODE128' ? 'Up to 80 characters' : 'Up to 43 characters'
                    }</div>
                  </div>
                  <Badge variant="outline" className="w-full justify-center">
                    {format === 'CODE128' ? 'Recommended for internal use' :
                     format === 'UPC' ? 'Best for US retail' :
                     format === 'EAN13' ? 'Global standard' : 'Legacy format'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.length > 0 ? `${successRate.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Tests Run</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResults.filter(r => r.passed).length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
              </div>
              
              {testResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Run some tests to see performance metrics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}