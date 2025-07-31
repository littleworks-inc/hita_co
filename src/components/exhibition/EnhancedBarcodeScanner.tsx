// src/components/exhibition/EnhancedBarcodeScanner.tsx
// 🔧 ENHANCED: Barcode scanner with proper size variant identification

'use client'

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
  Package2
} from 'lucide-react'

import { lookupBarcode, BarcodeResult } from '@/lib/barcode-lookup'

interface EnhancedBarcodeScannerProps {
  exhibitionId?: string
  onProductFound: (result: BarcodeResult) => void
  onError: (error: string) => void
}

export default function EnhancedBarcodeScanner({
  exhibitionId,
  onProductFound,
  onError
}: EnhancedBarcodeScannerProps) {
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
          facingMode: 'environment', // Use back camera if available
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

  // Simulate barcode scanning (in production, integrate with QuaggaJS or similar)
  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    // In production, implement actual barcode detection here
    // For now, this is a placeholder for the scanning loop
    
    if (isScanning) {
      requestAnimationFrame(scanFrame)
    }
  }

  // Handle manual barcode input or scanned barcode
  const handleBarcodeInput = async (barcode: string) => {
    if (!barcode.trim()) {
      setScanResult(null)
      return
    }

    // Prevent duplicate processing
    if (barcode === lastScanned) return

    setLoading(true)
    setLastScanned(barcode)

    try {
      console.log('🔍 Looking up barcode:', barcode)
      const result = await lookupBarcode(barcode)
      
      setScanResult(result)
      
      if (result.found) {
        onProductFound(result)
        
        // Clear input on successful scan
        if (isScanning) {
          setSearchInput('')
          stopScanning()
        }
      } else {
        onError(result.message)
      }
      
    } catch (error) {
      console.error('Barcode lookup error:', error)
      onError('Error looking up barcode')
    } finally {
      setLoading(false)
    }
  }

  // Handle manual search
  const handleManualSearch = () => {
    handleBarcodeInput(searchInput)
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch()
    }
  }

  return (
    <div className="space-y-4">
      
      {/* Main Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Enhanced Barcode Scanner
            <Badge variant="secondary">CODE128</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Manual Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter or scan barcode (supports size variants)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                autoFocus
              />
            </div>
            
            <Button onClick={handleManualSearch} disabled={loading || !searchInput.trim()}>
              {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
                {loading ? 'Starting Camera...' : isScanning ? 'Stop Camera' : 'Start Camera'}
              </Button>
            </div>
          )}

          {/* Camera Preview */}
          {isScanning && (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-48 object-cover"
                autoPlay
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-red-500 border-dashed w-48 h-24 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Scan className="h-8 w-8 text-red-500" />
                </div>
              </div>
              
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/50 text-white px-2 py-1 rounded text-sm text-center">
                  Point camera at barcode to scan
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Result Display */}
      {scanResult && (
        <Card className={`border-l-4 ${
          scanResult.found 
            ? scanResult.type === 'size_variant' 
              ? 'border-l-green-500 bg-green-50' 
              : 'border-l-blue-500 bg-blue-50'
            : 'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {scanResult.found ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              
              <div className="flex-1">
                <div className="font-medium mb-1">
                  {scanResult.found ? '✅ Product Found!' : '❌ Not Found'}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {scanResult.message}
                </div>

                {scanResult.found && scanResult.product && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4" />
                      <span className="font-medium">{scanResult.product.name}</span>
                      <Badge variant="outline">{scanResult.product.category.name}</Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      SKU: {scanResult.product.sku} • 
                      Price: ${scanResult.product.sellingPriceUSD.toFixed(2)}
                    </div>

                    {scanResult.type === 'size_variant' && scanResult.sizeVariant && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <div className="font-medium text-green-700">Size Variant Details:</div>
                        <div className="text-sm">
                          Size: <Badge variant="secondary">{scanResult.sizeVariant.size}</Badge> • 
                          Stock: {scanResult.sizeVariant.stockQuantity} units
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Size Barcode: {scanResult.sizeVariant.barcode}
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

      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Scan any barcode to instantly identify products. 
          Size variant barcodes (like HC-BLUE-100941-XXL) will show the exact size and stock. 
          Main product barcodes will show the product and available sizes.
        </AlertDescription>
      </Alert>
    </div>
  )
}