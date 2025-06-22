'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { Search, Filter, Plus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  _count?: {
    products: number
  }
}

interface ProductsSearchFilterProps {
  categories: Category[]
  totalProducts?: number
}

export default function ProductsSearchFilter({ categories, totalProducts = 0 }: ProductsSearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  // Local state for inputs
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || '')
  
  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Update local state when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
    setCategoryFilter(searchParams.get('category') || '')
    setStatusFilter(searchParams.get('status') || '')
    setStockFilter(searchParams.get('stock') || '')
  }, [searchParams])

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    startTransition(() => {
      router.push(`/admin/products?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      updateFilters({ search: value })
    }, 300) // 300ms debounce
    
    setSearchTimeout(timeout)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    updateFilters({ category: value })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateFilters({ status: value })
  }

  const handleStockChange = (value: string) => {
    setStockFilter(value)
    updateFilters({ stock: value })
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

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
            disabled={isPending}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isPending && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {/* Add Product Button */}
        <Link href="/admin/products/new">
          <Button className="flex items-center gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Category Filter */}
        <div className="flex-1 sm:flex-none">
          <select 
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category._count?.products !== undefined && ` (${category._count.products})`}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1 sm:flex-none">
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
          </select>
        </div>

        {/* Stock Filter */}
        <div className="flex-1 sm:flex-none">
          <select 
            value={stockFilter}
            onChange={(e) => handleStockChange(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          >
            <option value="">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2 whitespace-nowrap"
            disabled={isPending}
          >
            <X className="h-3 w-3" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Search: "{searchQuery}"
              <button
                onClick={() => handleSearchChange('')}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {categoryFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Category: {categories.find(c => c.id === categoryFilter)?.name}
              <button
                onClick={() => handleCategoryChange('')}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Status: {statusFilter}
              <button
                onClick={() => handleStatusChange('')}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {stockFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Stock: {stockFilter.replace('-', ' ')}
              <button
                onClick={() => handleStockChange('')}
                className="hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Summary */}
      {totalProducts !== undefined && (
        <div className="text-sm text-gray-500">
          {hasActiveFilters ? (
            <>Showing filtered results • </>
          ) : (
            <>Showing all {totalProducts} product{totalProducts !== 1 ? 's' : ''}</>
          )}
          {isPending && (
            <span className="text-blue-600">
              • Updating results...
            </span>
          )}
        </div>
      )}
    </div>
  )
}