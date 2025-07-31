// src/components/exhibition/BarcodeSearch.tsx
// 🔧 UPDATED: Now uses the enhanced barcode lookup system
"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Scan,
  Search,
  Camera,
  CameraOff,
  Package,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw,
  Target,
  Package2,
  Zap
} from 'lucide-react'

import { lookupBarcode, BarcodeResult } from '@/lib/barcode-lookup-working'

interface BarcodeSearchProps {
  exhibitionId?: string
  products?: any[] // Keep for compatibility, but we'll use direct lookup now
  onProductFound: (result: BarcodeResult) => void
  onError: (error: string) => void
}

export default function BarcodeSearch({
  exhibitionId,
  products = [],
  onProductFound,
  onError
}: BarcodeSearchProps) {
  // State management
  const [searchInput, setSearchInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastScanned, setLastScanned] = useState('')
  const [scanResult, setScanResult] = useState<BarcodeResult | null>(null)

  // Refs for camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check camera availability on mount
  useEffect(() => {
    checkCameraAvailability()
    return () => {
      stopScanning()
    }
  }, [])

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setHasCamera(videoDevices.length > 0)
    } catch (error) {
      console.error('Error checking camera:', error)
      setHasCamera(false)
    }
  }

  // Start camera scanning
  const startScanning = async () => {
    try {
      setLoading(true)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsScanning(true)
        
        // Start scanning loop
        setTimeout(scanFrame, 100)
      }
      
      setLoading(false)
    } catch (err: any) {
      setLoading(false)
      setIsScanning(false)
      
      if (err.name === 'NotAllowedError') {
        onError('Camera permission denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        onError('No camera found on this device.')
      } else {
        onError(`Camera error: ${err.message || 'Unknown camera error'}`)
      }
    }
  }

  // Stop camera scanning
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Barcode scanning loop (placeholder for real implementation)
  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // TODO: Integrate with QuaggaJS or similar library here
      // For now, this is just the scanning loop framework
      // When barcode is detected, call: handleBarcodeDetected(detectedCode)
    }

    if (isScanning) {
      requestAnimationFrame(scanFrame)
    }
  }

  // Handle detected barcode from camera or manual input
  const handleBarcodeDetected = async (barcode: string) => {
    if (!barcode.trim() || barcode === lastScanned) return

    setLoading(true)
    setLastScanned(barcode)

    try {
      console.log('🔍 Enhanced barcode lookup for:', barcode)
      const result = await lookupBarcode(barcode)
      
      setScanResult(result)
      
      if (result.found) {
        // Success - notify parent component
        onProductFound(result)
        
        // Clear input and stop scanning on success
        setSearchInput('')
        if (isScanning) {
          stopScanning()
        }
      } else {
        // Not found
        onError(result.message)
      }
      
    } catch (error) {
      console.error('Barcode lookup error:', error)
      onError('Error looking up barcode')
      setScanResult({
        found: false,
        type: 'not_found',
        message: 'Database lookup failed'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle manual search
  const handleManualSearch = () => {
    if (searchInput.trim()) {
      handleBarcodeDetected(searchInput.trim())
    }
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch()
    }
  }

  // Clear results
  const clearResults = () => {
    setScanResult(null)
    setSearchInput('')
    setLastScanned('')
  }

  return (
    <div className="space-y-4">
      
      {/* Enhanced Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Enhanced Barcode Scanner
            <Badge variant="secondary" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              Size-Aware
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Manual Input with Enhanced Styling */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                placeholder="Scan or enter barcode (main products or size variants)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 font-mono"
                autoFocus
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearResults}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleManualSearch} 
              disabled={loading || !searchInput.trim()}
              className="px-4"
            >
              {loading ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Camera Scanner */}
          {hasCamera && (
            <div className="flex gap-2">
              <Button
                onClick={isScanning ? stopScanning : startScanning}
                variant={isScanning ? "destructive" : "outline"}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : isScanning ? (
                  <CameraOff className="h-4 w-4 mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Starting Camera...' : isScanning ? 'Stop Camera' : 'Start Camera Scanner'}
              </Button>
            </div>
          )}

          {/* Camera Preview with Enhanced UI */}
          {isScanning && (
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-48 object-cover"
                autoPlay
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Enhanced scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="border-2 border-red-500 border-dashed w-48 h-24 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <Scan className="h-6 w-6 text-red-500" />
                  </div>
                  
                  {/* Scanning animation */}
                  <div className="absolute inset-0 border-2 border-red-400 rounded-lg opacity-50 animate-pulse"></div>
                </div>
              </div>
              
              {/* Status bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="text-white text-sm text-center font-medium">
                  📱 Point camera at any barcode
                </div>
                <div className="text-white/70 text-xs text-center mt-1">
                  Supports main products (HC-BLUE-100941) and size variants (HC-BLUE-100941-XXL)
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Results Display */}
      {scanResult && (
        <Card className={`border-l-4 transition-all duration-200 ${
          scanResult.found 
            ? scanResult.type === 'size_variant' 
              ? 'border-l-emerald-500 bg-emerald-50 border-emerald-200' 
              : 'border-l-blue-500 bg-blue-50 border-blue-200'
            : 'border-l-red-500 bg-red-50 border-red-200'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              {scanResult.found ? (
                <div className={`rounded-full p-1 ${
                  scanResult.type === 'size_variant' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
              ) : (
                <div className="rounded-full p-1 bg-red-100 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
              
              <div className="flex-1">
                {/* Result Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">
                    {scanResult.found ? '✅ Found!' : '❌ Not Found'}
                  </span>
                  {scanResult.found && (
                    <Badge variant={scanResult.type === 'size_variant' ? 'default' : 'secondary'}>
                      {scanResult.type === 'size_variant' ? 'Exact Size Match' : 'Main Product'}
                    </Badge>
                  )}
                </div>
                
                {/* Message */}
                <div className="text-sm text-gray-700 mb-3">
                  {scanResult.message}
                </div>

                {/* Product Details */}
                {scanResult.found && scanResult.product && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{scanResult.product.name}</span>
                      <Badge variant="outline">{scanResult.product.category.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">SKU:</span>
                        <span className="ml-2 font-mono">{scanResult.product.sku}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          ${scanResult.product.sellingPriceUSD.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Size Variant Details */}
                    {scanResult.type === 'size_variant' && scanResult.sizeVariant && (
                      <div className="mt-3 p-3 bg-white rounded-md border border-emerald-200">
                        <div className="font-medium text-emerald-800 mb-2">
                          🎯 Exact Size Match
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Size:</span>
                            <Badge variant="secondary" className="ml-2">
                              {scanResult.sizeVariant.size}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-600">Stock:</span>
                            <span className={`ml-2 font-semibold ${
                              scanResult.sizeVariant.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {scanResult.sizeVariant.stockQuantity} units
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-2 p-2 bg-gray-50 rounded">
                          Barcode: {scanResult.sizeVariant.barcode}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Enhanced Barcode System:</strong> This scanner can identify both main products 
          and exact size variants. Scan <code>HC-BLUE-100941</code> to find the product, or 
          <code>HC-BLUE-100941-XXL</code> to find the specific XXL size with exact stock information.
        </AlertDescription>
      </Alert>
    </div>
  )
}