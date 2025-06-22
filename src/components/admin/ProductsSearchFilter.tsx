'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui'
import { Search, X, Loader2, RotateCcw } from 'lucide-react'

interface ProductsSearchFilterProps {
  categories: Array<{
    id: string
    name: string
    _count: { products: number }
  }>
  totalProducts: number
}

export default function ProductsSearchFilter({ categories, totalProducts }: ProductsSearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get current values from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || '')

  // Debounced search state
  const [isSearching, setIsSearching] = useState(false)

  // Update URL with all current filters
  const updateURL = useCallback((params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        newSearchParams.set(key, value)
      } else {
        newSearchParams.delete(key)
      }
    })

    startTransition(() => {
      router.push(`/admin/products?${newSearchParams.toString()}`)
    })
  }, [router, searchParams])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only update URL if search query is different from URL
      const currentUrlSearch = searchParams.get('search') || ''
      if (searchQuery !== currentUrlSearch) {
        setIsSearching(true)
        updateURL({
          search: searchQuery,
          category: categoryFilter,
          status: statusFilter,
          stock: stockFilter
        })
      }
    }, 500) // 500ms debounce for better UX

    return () => clearTimeout(timeoutId)
  }, [searchQuery, updateURL, categoryFilter, statusFilter, stockFilter, searchParams])

  // Reset searching state when URL updates
  useEffect(() => {
    setIsSearching(false)
  }, [searchParams])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value === '') {
      // Clear search immediately if empty
      updateURL({
        search: '',
        category: categoryFilter,
        status: statusFilter,
        stock: stockFilter
      })
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    updateURL({
      search: searchQuery,
      category: value,
      status: statusFilter,
      stock: stockFilter
    })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateURL({
      search: searchQuery,
      category: categoryFilter,
      status: value,
      stock: stockFilter
    })
  }

  const handleStockChange = (value: string) => {
    setStockFilter(value)
    updateURL({
      search: searchQuery,
      category: categoryFilter,
      status: statusFilter,
      stock: value
    })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setStatusFilter('')
    setStockFilter('')
    startTransition(() => {
      router.push('/admin/products')
    })
  }

  const hasActiveFilters = searchQuery || categoryFilter || statusFilter || stockFilter
  const showSearching = isSearching || (isPending && searchQuery)

  return (
    <div className="space-y-4">
      {/* Single Row: Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        {/* Search Box - Takes more space on larger screens */}
        <div className="relative flex-1 lg:flex-[2] max-w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
            disabled={isPending}
          />
          
          {/* Clear search button */}
          {searchQuery && !showSearching && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Loading indicator */}
          {showSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {/* Filter Dropdowns - Compact on larger screens */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Category Filter */}
          <div className="min-w-0 sm:min-w-[160px]">
            <select 
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={isPending}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category._count.products})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-0 sm:min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={isPending}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="featured">Featured</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div className="min-w-0 sm:min-w-[140px]">
            <select
              value={stockFilter}
              onChange={(e) => handleStockChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={isPending}
            >
              <option value="">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {/* Clear Filters Button - Only show when filters are active */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap transition-colors"
              disabled={isPending}
              title="Clear all filters"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Summary - Only show when filters are active */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
              Search: "{searchQuery}"
              <button
                onClick={() => handleSearchChange('')}
                className="hover:bg-blue-200 rounded transition-colors"
                title="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {categoryFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md">
              Category: {categories.find(c => c.id === categoryFilter)?.name}
              <button
                onClick={() => handleCategoryChange('')}
                className="hover:bg-green-200 rounded transition-colors"
                title="Remove category filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <button
                onClick={() => handleStatusChange('')}
                className="hover:bg-purple-200 rounded transition-colors"
                title="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {stockFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md">
              Stock: {stockFilter.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              <button
                onClick={() => handleStockChange('')}
                className="hover:bg-orange-200 rounded transition-colors"
                title="Remove stock filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search Status Indicator */}
      {searchQuery && (
        <div className="text-sm text-gray-500">
          {showSearching ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching...
            </span>
          ) : (
            <span>
              Found results for "{searchQuery}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}