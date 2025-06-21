'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

interface CategorySortFilterProps {
  currentSort: string
  categorySlug: string
  searchParams: Record<string, string | undefined>
}

export default function CategorySortFilter({ 
  currentSort, 
  categorySlug, 
  searchParams 
}: CategorySortFilterProps) {
  const router = useRouter()

  const handleSortChange = (newSort: string) => {
    const url = new URLSearchParams()
    
    // Add all existing search params except 'page' (reset to page 1)
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'sort' && value) {
        url.set(key, value)
      }
    })

    // Add new sort value (unless it's the default 'newest')
    if (newSort !== 'newest') {
      url.set('sort', newSort)
    }

    // Navigate to new URL
    const queryString = url.toString()
    router.push(`/categories/${categorySlug}${queryString ? `?${queryString}` : ''}`)
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name A-Z' }
  ]

  return (
    <div className="relative">
      <label htmlFor="category-sort" className="sr-only">
        Sort products by
      </label>
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-gray-500" />
        <select
          id="category-sort"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}