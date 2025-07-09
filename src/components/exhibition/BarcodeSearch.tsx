// src/components/exhibition/BarcodeSearch.tsx
// =====================================
// 🚀 Exhibition Barcode Scanner & SKU Search Component
// Supports camera scanning, manual barcode entry, and SKU lookup
// =====================================

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

import { 
  ExhibitionProduct, 
  BarcodeSearchProps,
  ProductSize,
  calculateAvailableStock,
  calculateFinalPrice,
  formatPrice
} from '@/types/exhibition-pos'

export default function BarcodeSearch({
  exhibitionId,
  products,
  onProductFound,
  onError
}: BarcodeSearchProps) {
  // Debug: Log the first product to see its structure
  useEffect(() => {
    if (products.length > 0) {
      console.log('🔍 First product structure:', products[0])
      console.log('🔍 Has product relation?', !!products[0].product)
      console.log('🔍 Product keys:', Object.keys(products[0]))
    }
  }, [products])
  // State management
  const [searchInput, setSearchInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [searchResults, setSearchResults] = useState<ExhibitionProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [lastScanned, setLastScanned] = useState('')

  // Refs - Initialize properly
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Debug video ref state
  console.log('🔍 Component render - videoRef.current:', videoRef.current)

  // Check camera availability on mount
  useEffect(() => {
    checkCameraAvailability()
    return () => {
      stopScanning()
    }
  }, [])

  // Check if camera is available
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

  // Start camera scanning with better error handling
  const startScanning = async () => {
    try {
      if (!hasCamera) {
        onError('No camera available on this device')
        return
      }

      console.log('🎥 Starting camera...')
      console.log('🔍 Video ref check:', videoRef.current)
      
      // Wait a moment for React to render the video element
      if (!videoRef.current) {
        console.log('⏳ Video ref not ready, waiting...')
        setTimeout(() => {
          console.log('🔍 Video ref after timeout:', videoRef.current)
          if (videoRef.current) {
            startScanning() // Retry
          } else {
            onError('Video element not available after waiting')
          }
        }, 100)
        return
      }
      
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      }
      
      console.log('📱 Requesting camera access with constraints:', constraints)
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('✅ Camera stream obtained:', stream)
      console.log('📹 Video tracks:', stream.getVideoTracks())

      if (videoRef.current) {
        console.log('🎬 Setting video source...')
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded')
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('▶️ Video playing successfully')
              setIsScanning(true)
              // Start barcode detection
              requestAnimationFrame(scanFrame)
            }).catch((playError) => {
              console.error('❌ Error playing video:', playError)
              onError('Failed to start video preview')
            })
          }
        }
        
        // Handle video errors
        videoRef.current.onerror = (errorEvent) => {
          console.error('❌ Video error:', errorEvent)
          onError('Video preview error')
        }
        
      } else {
        console.error('❌ Video ref is still null after stream creation')
        onError('Video element not available')
      }
    } catch (error) {
      console.error('❌ Error starting camera:', error)
      
      // Type-safe error handling
      const err = error as Error
      
      // More specific error messages
      if (err.name === 'NotAllowedError') {
        onError('Camera permission denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        onError('No camera found on this device.')
      } else if (err.name === 'NotReadableError') {
        onError('Camera is already in use by another application.')
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

  // Enhanced barcode detection with preview
  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // In a real implementation, you'd use a library like QuaggaJS or ZXing here
      // For now, we'll simulate barcode detection
      // This is where you'd integrate with a proper barcode scanning library
      
      // Example integration point for QuaggaJS:
      // Quagga.decodeSingle({
      //   decoder: {
      //     readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
      //   },
      //   src: canvas.toDataURL()
      // }, (result) => {
      //   if (result && result.codeResult) {
      //     simulateBarcodeDetection(result.codeResult.code)
      //   }
      // })
    }

    if (isScanning) {
      requestAnimationFrame(scanFrame)
    }
  }

  // Search products by barcode or SKU (enhanced for size variants)
  const searchProducts = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results = products.filter(product => {
      // Ensure product.product exists (it should based on how data is loaded)
      if (!product.product) {
        console.warn('Product missing product relation:', product)
        return false
      }

      // 1. Check main product barcode
      const matchesMainBarcode = product.product.barcode && 
        product.product.barcode.toLowerCase().includes(query.toLowerCase())
      
      // 2. Check main product SKU
      const matchesMainSku = product.product.sku.toLowerCase().includes(query.toLowerCase())
      
      // 3. Check main product name
      const matchesName = product.product.name.toLowerCase().includes(query.toLowerCase())
      
      // 4. NEW: Check if query is a size variant SKU (e.g., HC-BLUE-100941-XXL)
      // Extract base SKU by removing size suffix
      const queryParts = query.split('-')
      let baseSkuFromQuery = query
      
      // If query looks like a size variant (ends with size like -XXL, -XL, -L, -M, -S)
      if (queryParts.length > 2) {
        const lastPart = queryParts[queryParts.length - 1].toUpperCase()
        const commonSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 
                           'SMALL', 'MEDIUM', 'LARGE', 'XLARGE', 'XXLARGE']
        
        if (commonSizes.includes(lastPart) || /^\d+$/.test(lastPart)) {
          // Remove the size part to get base SKU
          baseSkuFromQuery = queryParts.slice(0, -1).join('-')
        }
      }
      
      // 5. Check if base SKU matches
      const matchesBaseSku = product.product.sku.toLowerCase() === baseSkuFromQuery.toLowerCase()
      
      // 6. NEW: Check individual size variant barcodes/SKUs (with safety check)
      const matchesSizeVariant = product.product.productSizes?.some((size: ProductSize) => 
        size.sku?.toLowerCase().includes(query.toLowerCase()) ||
        size.barcode?.toLowerCase().includes(query.toLowerCase())
      ) || false
      
      return matchesMainBarcode || matchesMainSku || matchesName || matchesBaseSku || matchesSizeVariant
    })

    setSearchResults(results)
  }

  // Handle manual search input
  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    searchProducts(value)
  }

  // Handle product selection
  const handleProductSelect = (product: ExhibitionProduct) => {
    const availableStock = calculateAvailableStock(product)
    
    if (availableStock <= 0) {
      onError(`${product.product.name} is out of stock`)
      return
    }

    onProductFound(product)
    setSearchInput('')
    setSearchResults([])
    setLastScanned(product.product.sku)
  }

  // Handle barcode detection (simulate for now)
  const simulateBarcodeDetection = (barcode: string) => {
    if (barcode === lastScanned) return // Prevent duplicate scans

    const product = products.find(p => p.product.barcode === barcode)
    if (product) {
      handleProductSelect(product)
      stopScanning()
    } else {
      onError(`Product with barcode ${barcode} not found in this exhibition`)
    }
  }

  // Quick search by pressing Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length === 1) {
      handleProductSelect(searchResults[0])
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Product Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Scan barcode or search by SKU/name..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                autoFocus
              />
            </div>
            
            {/* Camera Button */}
            {hasCamera && (
              <Button
                onClick={() => {
                  console.log('📸 Camera button clicked')
                  console.log('🔍 Current scanning state:', isScanning)
                  console.log('🔍 Video ref before action:', videoRef.current)
                  
                  if (isScanning) {
                    stopScanning()
                  } else {
                    // Set scanning to true first to render the video element
                    setIsScanning(true)
                    // Then start camera after a brief delay
                    setTimeout(() => {
                      startScanning()
                    }, 50)
                  }
                }}
                variant={isScanning ? "destructive" : "outline"}
                size="icon"
                className="shrink-0"
              >
                {isScanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Camera Scanner with Enhanced Preview and Debug Info */}
          {isScanning && (
            <div className="relative">
              {/* Debug info for camera status */}
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <p><strong>Camera Status:</strong></p>
                <p>Scanner Active: {isScanning ? 'Yes' : 'No'}</p>
                <p>Video Element: {videoRef.current ? 'Ready' : 'Not Ready'}</p>
                <p>Stream: {streamRef.current ? 'Connected' : 'Not Connected'}</p>
              </div>
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg object-cover border-2 border-blue-500"
                style={{ 
                  minHeight: '256px',
                  backgroundColor: '#000'
                }}
                onCanPlay={() => {
                  console.log('📹 Video can play')
                }}
                onPlaying={() => {
                  console.log('▶️ Video is playing')
                }}
                onWaiting={() => {
                  console.log('⏳ Video waiting for data')
                }}
                onError={(e) => {
                  console.error('❌ Video element error:', e)
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Enhanced Scanner Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Scanning Frame */}
                <div className="relative">
                  {/* Main scanning area */}
                  <div className="w-64 h-40 border-2 border-blue-500 rounded-lg bg-transparent relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    
                    {/* Animated scanning line */}
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div className="h-1 bg-blue-500 animate-pulse absolute top-1/2 left-0 right-0 transform -translate-y-1/2"></div>
                    </div>
                    
                    {/* Center crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scan className="h-8 w-8 text-white animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Instructions overlay */}
                  <div className="mt-4 text-center">
                    <Badge variant="secondary" className="bg-black bg-opacity-70 text-white px-4 py-2">
                      Position barcode within the frame
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Camera controls */}
              <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                {/* Test video button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black bg-opacity-50 text-white border-white hover:bg-white hover:text-black"
                  onClick={() => {
                    if (videoRef.current) {
                      console.log('🧪 Video element state:')
                      console.log('- readyState:', videoRef.current.readyState)
                      console.log('- paused:', videoRef.current.paused)
                      console.log('- videoWidth:', videoRef.current.videoWidth)
                      console.log('- videoHeight:', videoRef.current.videoHeight)
                      console.log('- currentTime:', videoRef.current.currentTime)
                      console.log('- srcObject:', videoRef.current.srcObject)
                    }
                  }}
                >
                  🧪
                </Button>
                
                {/* Close scanner */}
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black bg-opacity-50 text-white border-white hover:bg-white hover:text-black"
                  onClick={stopScanning}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Camera info */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {videoRef.current?.readyState === 4 ? 'Camera Ready' : 'Camera Loading...'}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        videoRef.current?.readyState === 4 ? 'bg-green-500' : 'bg-red-500'
                      } animate-pulse`}></div>
                      {isScanning ? 'Scanning' : 'Stopped'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Barcode Input for Testing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Development: Test barcode scanning</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Enter barcode manually"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement
                      simulateBarcodeDetection(target.value)
                      target.value = ''
                    }
                  }}
                  className="text-sm"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    // Test with first product's barcode
                    const testProduct = products.find(p => p.product.barcode)
                    if (testProduct) {
                      simulateBarcodeDetection(testProduct.product.barcode!)
                    }
                  }}
                >
                  Test
                </Button>
              </div>
              
              {/* Camera capture for testing */}
              {isScanning && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Capture current camera frame
                      if (videoRef.current && canvasRef.current) {
                        const video = videoRef.current
                        const canvas = canvasRef.current
                        const context = canvas.getContext('2d')
                        
                        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
                          canvas.width = video.videoWidth
                          canvas.height = video.videoHeight
                          context.drawImage(video, 0, 0, canvas.width, canvas.height)
                          
                          // Create download link for captured frame
                          const link = document.createElement('a')
                          link.download = `camera-capture-${Date.now()}.png`
                          link.href = canvas.toDataURL()
                          link.click()
                          
                          console.log('📸 Camera frame captured')
                        }
                      }
                    }}
                  >
                    📸 Capture Frame
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Simulate successful barcode detection for testing
                      const testBarcodes = ['123456789', '987654321', 'TEST001']
                      const randomBarcode = testBarcodes[Math.floor(Math.random() * testBarcodes.length)]
                      simulateBarcodeDetection(randomBarcode)
                    }}
                  >
                    🎯 Simulate Scan
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {searchResults.map((product) => {
                const availableStock = calculateAvailableStock(product)
                const finalPrice = calculateFinalPrice(product)
                
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {product.product.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          SKU: {product.product.sku}
                        </p>
                        {product.product.barcode && (
                          <p className="text-xs text-gray-500">
                            Barcode: {product.product.barcode}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right ml-3">
                        <p className="font-bold text-sm">
                          {formatPrice(finalPrice)}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          {availableStock > 0 ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">{availableStock} left</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 text-red-500" />
                              <span className="text-red-600">Out of stock</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {product.product.category.name}
                      </Badge>
                      
                      {product.isClearance && (
                        <Badge variant="destructive" className="text-xs">
                          Clearance
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchInput && searchResults.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No products found matching "{searchInput}". Try searching by SKU, barcode, or product name.
          </AlertDescription>
        </Alert>
      )}

      {/* Last Scanned */}
      {lastScanned && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Last scanned: {lastScanned}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}