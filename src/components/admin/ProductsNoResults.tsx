'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProductsNoResultsProps {
  hasFilters: boolean
  searchQuery?: string
}

export default function ProductsNoResults({ hasFilters, searchQuery }: ProductsNoResultsProps) {
  const router = useRouter()

  const clearFilters = () => {
    router.push('/admin/products')
  }

  return (
    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
      <p className="text-gray-500 mb-4">
        {hasFilters
          ? "Try adjusting your search criteria or filters"
          : "No products have been added yet"
        }
      </p>
      <div className="space-x-3">
        {hasFilters ? (
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
        ) : null}
        <a
          href="/admin/products/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {hasFilters ? 'Add New Product' : 'Add First Product'}
        </a>
      </div>
    </div>
  )
}