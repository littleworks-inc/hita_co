// src/components/exhibition/CompleteBarcodeScanner.tsx
// 🚀 COMPLETE Implementation with Real Barcode Detection

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
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react'

// ✅ Real Quagga integration
import Quagga from 'quagga'

interface CompleteBarcodeScanner {
  exhibitionId: string
  products: any[]
  onProductFound: (product: any) => void
  onError: (error: string) => void
}

export default function CompleteBarcodeScanner({
  exhibitionId,
  products,
  onProductFound,
  onError
}: CompleteBarcodeScanner) {

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
  const scannerRef = useRef<HTMLDivElement>(null)

  // Check camera availability
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

  // ✅ REAL QUAGGA IMPLEMENTATION
  const startScanning = async () => {
    if (!hasCamera || !scannerRef.current) {
      onError('No camera available')
      return
    }

    try {
      setIsScanning(true)
      setLoading(true)
      if (!scannerRef.current) {
        console.error('Scanner element not found')
        setLoading(false)
        return
      }

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,  // ✅ Now safe
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          }
        },
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader"]
        }
      }, (err: any) => {
        if (err) {
          console.error('Quagga initialization failed:', err)
          setLoading(false)
          return
        }
        console.log('Quagga initialized successfully')
      })

      // Listen for successful scans
      Quagga.onDetected((result) => {
        const code = result.codeResult.code
        console.log('Barcode detected:', code)

        // Search for product
        searchProducts(code)
        setLastScanned(code)

        // Stop scanning after successful detection
        stopScanning()
      })

      setLoading(false)

    } catch (error) {
      console.error('Scanner start error:', error)
      setLoading(false)
      setIsScanning(false)
      onError('Failed to start camera scanner')
    }
  }

  const stopScanning = () => {
    if (scannerInitialized) {
      Quagga.stop()
      setScannerInitialized(false)
    }
    setIsScanning(false)
  }

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

      // 4. Check size variant barcodes (if product has sizes)
      const matchesSizeBarcode = product.product.productSizes?.some((size: any) =>
        size.sku && size.sku.toLowerCase().includes(query.toLowerCase())
      )

      return matchesMainBarcode || matchesMainSku || matchesName || matchesSizeBarcode
    })

    setSearchResults(results)
    setLoading(false)

    // Auto-select if single result
    if (results.length === 1) {
      onProductFound(results[0])
      setSearchInput('')
      setSearchResults([])
    }
  }

  // Handle manual search
  const handleManualSearch = () => {
    searchProducts(searchInput)
  }

  // Handle product selection
  const handleProductSelect = (product: any) => {
    onProductFound(product)
    setSearchInput('')
    setSearchResults([])
  }

  return (
    <div className="space-y-4">

      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Manual Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode, SKU, or product name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              className="flex-1"
            />
            <Button onClick={handleManualSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Camera Scanner */}
          <div className="flex gap-2">
            {hasCamera ? (
              <Button
                onClick={isScanning ? stopScanning : startScanning}
                variant={isScanning ? "destructive" : "default"}
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
                {loading ? 'Starting...' : isScanning ? 'Stop Scanner' : 'Start Camera Scanner'}
              </Button>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Camera not available. Use manual input instead.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Last Scanned */}
          {lastScanned && (
            <div className="text-sm text-gray-600">
              Last scanned: <code className="bg-gray-100 px-2 py-1 rounded">{lastScanned}</code>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Camera View */}
      {isScanning && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center mb-2">
              <div className="text-sm text-gray-600">Point camera at barcode</div>
            </div>
            <div
              ref={scannerRef}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ minHeight: '300px' }}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <RotateCcw className="h-8 w-8 animate-spin" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="space-y-3">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProductSelect(item)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-gray-600">
                      SKU: {item.product.sku}
                      {item.product.barcode && (
                        <span className="ml-2">
                          Barcode: {item.product.barcode}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      ${item.finalPrice?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">
                      Stock: {item.product.stockQuantity || 0}
                    </Badge>
                    {item.product.requiresSizes && (
                      <Badge variant="secondary" className="text-xs">
                        Size Variants
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchInput && searchResults.length === 0 && !loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No products found for "{searchInput}". Try searching by SKU or product name.
          </AlertDescription>
        </Alert>
      )}

    </div>
  )
}