// src/components/exhibition/ModernBarcodeScanner.tsx
// 🚀 MODERN Barcode Scanner using @zxing/library (no vulnerabilities)

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react'

// ✅ Modern ZXing integration (no security vulnerabilities)
import { BrowserMultiFormatReader, Result } from '@zxing/library'

interface ModernBarcodeScannerProps {
  exhibitionId: string
  products: any[]
  onProductFound: (product: any) => void
  onError: (error: string) => void
}

export default function ModernBarcodeScanner({
  exhibitionId,
  products,
  onProductFound,
  onError
}: ModernBarcodeScannerProps) {
  
  // State management
  const [searchInput, setSearchInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastScanned, setLastScanned] = useState('')
  const [scannerInitialized, setScannerInitialized] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  // Initialize ZXing reader
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader()
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

  // ✅ MODERN ZXING IMPLEMENTATION (No vulnerabilities)
  const startScanning = useCallback(async () => {
    if (!hasCamera || !videoRef.current || !readerRef.current) {
      onError('No camera available or scanner not initialized')
      return
    }

    try {
      setIsScanning(true)
      setLoading(true)

      // Start ZXing scanning
      await readerRef.current.decodeFromVideoDevice(
        null, // ✅ FIXED: Use null instead of undefined for deviceId
        videoRef.current,
        (result: Result | null, error: any) => {
          if (result) {
            const code = result.getText()
            console.log('Barcode detected:', code)
            
            // Search for product
            searchProducts(code)
            setLastScanned(code)
            
            // Stop scanning after successful detection
            stopScanning()
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('ZXing decode error:', error)
          }
        }
      )

      setScannerInitialized(true)
      setLoading(false)

    } catch (error) {
      console.error('Scanner start error:', error)
      setLoading(false)
      setIsScanning(false)
      onError('Failed to start camera scanner')
    }
  }, [hasCamera, onError])

  const stopScanning = useCallback(() => {
    if (readerRef.current && scannerInitialized) {
      try {
        readerRef.current.reset()
        setScannerInitialized(false)
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
    setIsScanning(false)
  }, [scannerInitialized])

  // Enhanced product search with size variant support
  const searchProducts = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)

    const results = products.filter(product => {
      if (!product.product) return false

      // 1. Check main product barcode
      const matchesMainBarcode = product.product.barcode && 
        product.product.barcode.toLowerCase().includes(query.toLowerCase())
      
      // 2. Check main product SKU
      const matchesMainSku = product.product.sku.toLowerCase().includes(query.toLowerCase())
      
      // 3. Check product name
      const matchesName = product.product.name.toLowerCase().includes(query.toLowerCase())
      
      // 4. Check size variant barcodes
      const matchesSizeBarcode = product.product.productSizes?.some((size: any) => 
        size.barcode && size.barcode.toLowerCase().includes(query.toLowerCase())
      )

      return matchesMainBarcode || matchesMainSku || matchesName || matchesSizeBarcode
    })

    setSearchResults(results.slice(0, 10)) // Limit to 10 results
    setLoading(false)

    // Auto-select if only one result
    if (results.length === 1) {
      handleProductSelect(results[0])
    }
  }

  const handleProductSelect = (productExhibition: any) => {
    onProductFound(productExhibition)
    setSearchResults([])
    setSearchInput('')
  }

  const handleManualSearch = () => {
    if (searchInput.trim()) {
      searchProducts(searchInput.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch()
    }
  }

  const clearResults = () => {
    setSearchResults([])
    setSearchInput('')
    setLastScanned('')
  }

  return (
    <div className="space-y-4">
      
      {/* Modern Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Modern Barcode Scanner
            <Badge variant="default" className="bg-green-500">
              <Zap className="h-3 w-3 mr-1" />
              ZXing
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Manual Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode or product name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleManualSearch}
              disabled={loading}
              variant="outline"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Camera Scanner */}
          {hasCamera && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={isScanning ? stopScanning : startScanning}
                  disabled={loading}
                  variant={isScanning ? "destructive" : "default"}
                  className="flex-1"
                >
                  {loading ? (
                    <>Loading...</>
                  ) : isScanning ? (
                    <>
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop Scanning
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
                
                {searchResults.length > 0 && (
                  <Button onClick={clearResults} variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Camera Video */}
              {isScanning && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full max-w-md mx-auto rounded-lg border"
                    autoPlay
                    playsInline
                    style={{ maxHeight: '300px' }}
                  />
                  <div className="absolute inset-0 border-2 border-red-500 border-dashed rounded-lg pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* No Camera Alert */}
          {!hasCamera && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No camera detected. Use manual barcode entry above.
              </AlertDescription>
            </Alert>
          )}

          {/* Last Scanned */}
          {lastScanned && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Last scanned: <strong>{lastScanned}</strong>
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((productExhibition, index) => {
                const product = productExhibition.product
                return (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleProductSelect(productExhibition)}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      SKU: {product.sku} | Price: ${productExhibition.price}
                    </div>
                    {product.barcode && (
                      <div className="text-xs text-gray-500">
                        Barcode: {product.barcode}
                      </div>
                    )}
                    <div className="text-xs text-blue-600">
                      Stock: {productExhibition.quantity} available
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}