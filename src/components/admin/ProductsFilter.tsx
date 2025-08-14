// src/components/admin/ProductsFilter.tsx
// ✅ FIXED: Client component with proper event handler structure

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X, FileText, Eye, Archive, Star, Package } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ProductsFilterProps {
  categories: Array<{
    id: string
    name: string
    _count: { products: number }
  }>
  totalProducts: number
  className?: string
}

export default function ProductsFilter({ 
  categories, 
  totalProducts, 
  className 
}: ProductsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Current filter states
  const currentSearch = searchParams.get('search') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentStatus = searchParams.get('status') || ''
  const currentStock = searchParams.get('stock') || ''
  
  // Local state for search input
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Status filter options with counts (these would come from API in real implementation)
  const statusFilters = [
    { 
      value: '', 
      label: 'All Products', 
      icon: Package, 
      count: totalProducts,
      description: 'Show all products regardless of status'
    },
    { 
      value: 'draft', 
      label: 'Drafts', 
      icon: FileText, 
      count: 0, // TODO: Get from API
      description: 'Products being created or edited'
    },
    { 
      value: 'published', 
      label: 'Published', 
      icon: Eye, 
      count: 0, // TODO: Get from API
      description: 'Live products visible to customers'
    },
    { 
      value: 'archived', 
      label: 'Archived', 
      icon: Archive, 
      count: 0, // TODO: Get from API
      description: 'Hidden products preserved in system'
    },
    { 
      value: 'featured', 
      label: 'Featured', 
      icon: Star, 
      count: 0, // TODO: Get from API
      description: 'Published products marked as featured'
    }
  ]

  const stockFilters = [
    { value: '', label: 'All Stock Levels' },
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' }
  ]

  // ✅ FIXED: Update URL with new filters
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    router.push(`/admin/products?${params.toString()}`)
  }

  // ✅ FIXED: Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchInput })
  }

  // ✅ FIXED: Clear all filters
  const clearFilters = () => {
    setSearchInput('')
    router.push('/admin/products')
  }

  // ✅ FIXED: Handle status filter click
  const handleStatusFilter = (statusValue: string) => {
    updateFilters({ status: statusValue })
  }

  // Check if any filters are active
  const hasActiveFilters = currentSearch || currentCategory || currentStatus || currentStock

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6 mb-6', className)}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU, description, or tags..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Status Filters - Primary Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Product Status</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {statusFilters.map((filter) => {
            const Icon = filter.icon
            const isActive = currentStatus === filter.value
            
            return (
              <button
                key={filter.value}
                onClick={() => handleStatusFilter(filter.value)}
                type="button"
                className={cn(
                  'flex items-center justify-between p-3 text-left rounded-lg border transition-all',
                  isActive
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                )}
                title={filter.description}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{filter.label}</span>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {filter.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={currentCategory}
            onChange={(e) => updateFilters({ category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category._count.products})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Level
          </label>
          <select
            value={currentStock}
            onChange={(e) => updateFilters({ stock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {stockFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters & Clear Button */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {currentSearch && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Search: "{currentSearch}"
              </span>
            )}
            {currentStatus && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Status: {statusFilters.find(f => f.value === currentStatus)?.label}
              </span>
            )}
            {currentCategory && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Category: {categories.find(c => c.id === currentCategory)?.name}
              </span>
            )}
            {currentStock && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Stock: {stockFilters.find(f => f.value === currentStock)?.label}
              </span>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            type="button"
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}