// ✅ components/customer/ProductListWithSync.tsx
// Enhanced ProductCard wrapper that syncs with cart changes

'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useProductListRefresh } from '@/hooks/useProductListRefresh'
import ProductCard from '@/components/customer/ProductCard'

interface ProductListWithSyncProps {
  initialProducts: any[]
  children?: React.ReactNode
}

/**
 * Wrapper component that automatically refreshes product listings
 * when cart contents change to ensure real-time sync
 */
export default function ProductListWithSync({ 
  initialProducts, 
  children 
}: ProductListWithSyncProps) {
  const { items: cartItems } = useCart()
  const { refreshProductList } = useProductListRefresh()
  const [lastCartChange, setLastCartChange] = useState(0)

  // Track cart changes to trigger updates
  useEffect(() => {
    const currentTime = Date.now()
    
    // Only trigger refresh if cart actually changed and not on initial load
    if (lastCartChange > 0 && currentTime - lastCartChange > 100) {
      console.log('Cart changed, refreshing product list...')
      refreshProductList()
    }
    
    setLastCartChange(currentTime)
  }, [cartItems.length, refreshProductList, lastCartChange])

  // Render the children or default product grid
  if (children) {
    return <>{children}</>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {initialProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}