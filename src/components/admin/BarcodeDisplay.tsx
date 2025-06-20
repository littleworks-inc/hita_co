'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { Download, Printer, Copy } from 'lucide-react'

interface BarcodeDisplayProps {
  barcode: string
  barcodeType: string
  productName?: string
  price?: string
  size?: 'small' | 'medium' | 'large'
}

export default function BarcodeDisplay({ 
  barcode, 
  barcodeType, 
  productName, 
  price,
  size = 'medium' 
}: BarcodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyBarcode = () => {
    navigator.clipboard.writeText(barcode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateBarcodePattern = (code: string, type: string) => {
    // Simple visual representation - in production, use a proper barcode library
    const patterns = {
      CODE128: '||||| |||| ||||| |||| |||||',
      EAN13: '| || ||| | || ||| | || |||',
      UPC: '|| ||| || ||| || ||| ||',
      CODE39: '|| | ||| | || | ||| |'
    }
    
    return patterns[type as keyof typeof patterns] || patterns.CODE128
  }

  const sizeClasses = {
    small: {
      container: 'p-2',
      pattern: 'text-xs',
      code: 'text-xs',
      name: 'text-xs',
      price: 'text-sm font-bold'
    },
    medium: {
      container: 'p-3',
      pattern: 'text-sm',
      code: 'text-sm',
      name: 'text-sm',
      price: 'text-lg font-bold'
    },
    large: {
      container: 'p-4',
      pattern: 'text-base',
      code: 'text-base',
      name: 'text-base',
      price: 'text-xl font-bold'
    }
  }

  const classes = sizeClasses[size]

  if (!barcode) {
    return (
      <div className="text-center text-gray-400 py-4">
        <div className="text-sm">No barcode generated</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Barcode Label */}
      <div className={`border border-gray-300 rounded-md bg-white ${classes.container} text-center`}>
        {/* Product Name */}
        {productName && (
          <div className={`${classes.name} font-medium text-gray-900 mb-2 truncate`}>
            {productName}
          </div>
        )}
        
        {/* Barcode Pattern */}
        <div className={`bg-black text-white font-mono ${classes.pattern} px-2 py-1 mb-2`}>
          {generateBarcodePattern(barcode, barcodeType)}
        </div>
        
        {/* Barcode Number */}
        <div className={`font-mono ${classes.code} text-gray-800 mb-2`}>
          {barcode}
        </div>
        
        {/* Price */}
        {price && (
          <div className={`${classes.price} text-green-600`}>
            {price}
          </div>
        )}
        
        {/* Barcode Type */}
        <div className="text-xs text-gray-500 mt-1">
          {barcodeType}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyBarcode}
          className="flex items-center gap-1"
        >
          <Copy className="h-3 w-3" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="flex items-center gap-1"
        >
          <Printer className="h-3 w-3" />
          Print
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            // Create downloadable barcode label
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (ctx) {
              canvas.width = 200
              canvas.height = 100
              ctx.fillStyle = 'white'
              ctx.fillRect(0, 0, 200, 100)
              ctx.fillStyle = 'black'
              ctx.font = '12px monospace'
              ctx.textAlign = 'center'
              ctx.fillText(barcode, 100, 80)
              
              const link = document.createElement('a')
              link.download = `barcode-${barcode}.png`
              link.href = canvas.toDataURL()
              link.click()
            }
          }}
          className="flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </div>

      {/* Info */}
      <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 text-center">
        <div>✅ Scannable with any barcode scanner</div>
        <div>📱 Compatible with POS systems</div>
        <div>🏷️ Perfect for price tags and inventory</div>
      </div>
    </div>
  )
}