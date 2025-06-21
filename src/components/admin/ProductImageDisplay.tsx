'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'

interface ProductImageDisplayProps {
  src: string
  alt: string
  className?: string
}

export default function ProductImageDisplay({ src, alt, className = '' }: ProductImageDisplayProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center rounded-lg`}>
        <Package className="h-8 w-8 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}