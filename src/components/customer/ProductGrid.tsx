// ✅ components/customer/ProductGrid.tsx
// Enhanced product grid component with cart synchronization

'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import ProductCard from '@/components/customer/ProductCard'
import LoadingSpinner from '@/components/customer/LoadingSpinner'

interface ProductGridProps {
  products: any[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  className?: string
}

export default function ProductGrid({
  products,
  isLoading = false,
  error = null,
  emptyMessage = "No products found",
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
}: ProductGridProps) {
  const { items: cartItems } = useCart()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Track when cart items are removed to refresh product visibility
  const [previousCartItemIds, setPreviousCartItemIds] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    const currentCartItemIds = new Set(cartItems.map(item => item.id))
    
    // Check if any items were removed from cart
    const removedItems = Array.from(previousCartItemIds).filter(id => !currentCartItemIds.has(id))
    
    if (removedItems.length > 0) {
      console.log(`Cart items removed: ${removedItems.join(', ')}`)
      console.log('Refreshing product grid to show removed items...')
      
      setIsRefreshing(true)
      
      // Refresh the page to get updated product listings
      router.refresh()
      
      // Reset refreshing state after a delay
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
    
    setPreviousCartItemIds(currentCartItemIds)
  }, [cartItems, router, previousCartItemIds])

  // Show loading state
  if (isLoading || isRefreshing) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner 
          size="lg" 
          text={isRefreshing ? "Updating product list..." : "Loading products..."} 
        />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">{error}</p>
        <button 
          onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Show empty state
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  // Render product grid
  return (
    <div className={className}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}