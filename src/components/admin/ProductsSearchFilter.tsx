'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { Search, Filter, Plus } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface ProductsSearchFilterProps {
  categories: Category[]
}

export default function ProductsSearchFilter({ categories }: ProductsSearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')

  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    
    startTransition(() => {
      router.push(`/admin/products?${params.toString()}`)
    })
  }

  const handleCategoryFilter = (category: string) => {
    const params = new URLSearchParams(searchParams)
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    
    startTransition(() => {
      router.push(`/admin/products?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            // Debounced search
            setTimeout(() => handleSearch(e.target.value), 500)
          }}
          className="pl-10 w-full sm:w-64"
        />
      </div>
      
      {/* Category Filter */}
      <select 
        value={categoryFilter}
        onChange={(e) => {
          setCategoryFilter(e.target.value)
          handleCategoryFilter(e.target.value)
        }}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isPending}
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      
      {/* Add Product Button */}
      <Link href="/admin/products/new">
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </Link>
    </div>
  )
}