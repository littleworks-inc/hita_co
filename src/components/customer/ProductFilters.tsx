'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  DollarSign,
  Tag,
  Globe,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  _count: {
    products: number
  }
}

interface Country {
  id: string
  name: string
  code: string
  _count: {
    products: number
  }
}

interface ProductFiltersProps {
  categories: Category[]
  countries: Country[]
  searchParams: {
    search?: string
    category?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    country?: string
    page?: string
  }
}

export default function ProductFilters({ categories, countries, searchParams }: ProductFiltersProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState({
    sort: true,
    price: true,
    categories: true,
    countries: true
  })

  const [priceRange, setPriceRange] = useState({
    min: searchParams.minPrice || '',
    max: searchParams.maxPrice || ''
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const url = new URLSearchParams(searchParams as Record<string, string>)
    
    // Update or remove parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        url.set(key, value)
      } else {
        url.delete(key)
      }
    })

    // Reset to page 1 when filters change
    if (Object.keys(newParams).some(key => key !== 'page')) {
      url.delete('page')
    }

    router.push(`/products?${url.toString()}`)
  }

  const clearAllFilters = () => {
    router.push('/products')
  }

  const applyPriceFilter = () => {
    updateFilters({
      minPrice: priceRange.min || undefined,
      maxPrice: priceRange.max || undefined
    })
  }

  const hasActiveFilters = Object.values(searchParams).some(value => 
    value && value !== '' && value !== 'newest'
  )

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name A-Z' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Sort Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('sort')}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">Sort By</span>
          </div>
          {expandedSections.sort ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {expandedSections.sort && (
          <div className="mt-3 space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={(searchParams.sort || 'newest') === option.value}
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="mb-6 border-t border-gray-200 pt-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">Price Range</span>
          </div>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {expandedSections.price && (
          <div className="mt-3">
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="$1000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={applyPriceFilter}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Apply Price Filter
            </button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="mb-6 border-t border-gray-200 pt-6">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Categories</span>
            </div>
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {expandedSections.categories && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={!searchParams.category}
                  onChange={() => updateFilters({ category: undefined })}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">All Categories</span>
              </label>
              
              {categories.map((category) => (
                <label key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.slug}
                      checked={searchParams.category === category.slug}
                      onChange={(e) => updateFilters({ category: e.target.value })}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">({category._count.products})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Countries Section */}
      {countries.length > 1 && (
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => toggleSection('countries')}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Origin Country</span>
            </div>
            {expandedSections.countries ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {expandedSections.countries && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="country"
                  value=""
                  checked={!searchParams.country}
                  onChange={() => updateFilters({ country: undefined })}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">All Countries</span>
              </label>
              
              {countries.map((country) => (
                <label key={country.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="country"
                      value={country.code}
                      checked={searchParams.country === country.code}
                      onChange={(e) => updateFilters({ country: e.target.value })}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{country.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">({country._count.products})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Active Filters:</h4>
          <div className="space-y-2">
            {searchParams.category && (
              <div className="flex items-center justify-between bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                <span>Category: {categories.find(c => c.slug === searchParams.category)?.name}</span>
                <button onClick={() => updateFilters({ category: undefined })}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {searchParams.country && (
              <div className="flex items-center justify-between bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                <span>Country: {countries.find(c => c.code === searchParams.country)?.name}</span>
                <button onClick={() => updateFilters({ country: undefined })}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {(searchParams.minPrice || searchParams.maxPrice) && (
              <div className="flex items-center justify-between bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                <span>
                  Price: ${searchParams.minPrice || '0'} - ${searchParams.maxPrice || '∞'}
                </span>
                <button onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}