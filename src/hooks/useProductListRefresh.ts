// ✅ hooks/useProductListRefresh.ts
// Custom hook to handle product list refreshes when cart changes

import { useEffect, useCallback } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'

/**
 * Hook to refresh product listings when cart contents change
 * Use this in product listing components to ensure they stay in sync with cart
 */
export function useProductListRefresh() {
  const { items: cartItems } = useCart()
  const router = useRouter()

  // Create a stable reference to cart item IDs for comparison
  const cartItemIds = cartItems.map(item => item.id).sort().join(',')

  // Refresh the current page when cart changes (but not on initial load)
  const refreshProductList = useCallback(() => {
    // Use soft refresh to update server components without full page reload
    router.refresh()
  }, [router])

  // Track cart changes and trigger refresh
  useEffect(() => {
    // Skip refresh on initial load (when component first mounts)
    const timer = setTimeout(() => {
      // Only refresh if we have been on the page for a bit
      // This prevents unnecessary refreshes during initial page load
      if (typeof window !== 'undefined' && document.readyState === 'complete') {
        refreshProductList()
      }
    }, 500) // Small delay to avoid excessive refreshes

    return () => clearTimeout(timer)
  }, [cartItemIds, refreshProductList])

  return {
    refreshProductList,
    cartItemCount: cartItems.length
  }
}