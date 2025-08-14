// ✅ MINIMAL FIX: Create a wrapper component to manage state
// Save this as: src/components/customer/ProductDetailWrapper.tsx

'use client'

import { useState } from 'react'

interface ProductSize {
  id: string
  size: string
  sku: string
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
  sortOrder: number
}

interface ProductDetailWrapperProps {
  children: (selectedSize: ProductSize | null, setSelectedSize: (size: ProductSize | null) => void) => React.ReactNode
}

export default function ProductDetailWrapper({ children }: ProductDetailWrapperProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  
  return (
    <>
      {children(selectedSize, setSelectedSize)}
    </>
  )
}