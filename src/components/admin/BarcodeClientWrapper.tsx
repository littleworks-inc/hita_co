// src/components/admin/BarcodeClientWrapper.tsx
// 🔧 SOLUTION: Client Component wrapper that handles barcode updates internally
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuickBarcodePrinter from './QuickBarcodePrinter'

interface BarcodeClientWrapperProps {
  product: {
    id: string
    name: string
    sku: string
    barcode?: string
    sellingPriceUSD: number
    stockQuantity: number
    category: { name: string }
    requiresSizes?: boolean
    productSizes?: Array<{
      size: string
      sku: string
      stockQuantity: number
    }>
  }
}

const BarcodeClientWrapper: React.FC<BarcodeClientWrapperProps> = ({ product }) => {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  // Handle barcode generation - moved to client side
  const handleBarcodeGenerated = async (newBarcode: string) => {
    if (isUpdating) return

    setIsUpdating(true)
    
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode: newBarcode }),
      })
      
      if (response.ok) {
        // Refresh the page to show updated barcode
        router.refresh()
      } else {
        console.error('Failed to update barcode')
        alert('Failed to update barcode. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update barcode:', error)
      alert('Failed to update barcode. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <QuickBarcodePrinter 
      product={product}
      onBarcodeGenerated={handleBarcodeGenerated}
    />
  )
}

export default BarcodeClientWrapper