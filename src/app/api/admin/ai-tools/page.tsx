'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Label } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import { AIBulkGenerateButton } from '@/components/admin/AIGenerateButton'
import {
  Sparkles,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  Filter,
  Search
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  shortDescription: string
  category: {
    name: string
  }
  country: {
    name: string
  }
  sellingPriceUSD: number
  tags: string[]
  isActive: boolean
}

interface GenerationResult {
  productId: string
  productName: string
  success: boolean
  content?: string
  error?: string
}

export default function AIToolsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [contentType, setContentType] = useState<'product_description' | 'seo_meta'>('product_description')
  const [tone, setTone] = useState<'elegant' | 'professional' | 'casual' | 'playful'>('elegant')
  const [onlyEmptyDescriptions, setOnlyEmptyDescriptions] = useState(true)

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    withDescriptions: 0,
    withoutDescriptions: 0,
    categories: 0
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products?includeRelations=true')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (productData: Product[]) => {
    const categories = new Set(productData.map(p => p.category?.name).filter(Boolean))
    
    setStats({
      total: productData.length,
      withDescriptions: productData.filter(p => p.description?.trim()).length,
      withoutDescriptions: productData.filter(p => !p.description?.trim()).length,
      categories: categories.size
    })
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !filterCategory || product.category?.name === filterCategory
    
    const matchesEmptyFilter = !onlyEmptyDescriptions || !product.description?.trim()
    
    return matchesSearch && matchesCategory && matchesEmptyFilter
  })

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleBulkGeneration = (results: GenerationResult[]) => {
    setGenerationResults(results)
    
    // Update products with generated content
    results.forEach(result => {
      if (result.success && result.content) {
        updateProductContent(result.productId, result.content)
      }
    })
  }

  const updateProductContent = async (productId: string, content: string) => {
    try {
      const field = contentType === 'product_description' ? 'description' : 'seoDescription'
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: content })
      })

      if (response.ok) {
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, [field]: content }
            : p
        ))
      }
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  const exportResults = () => {
    const csv = [
      ['Product Name', 'Status', 'Generated Content', 'Error'],
      ...generationResults.map(result => [
        result.productName,
        result.success ? 'Success' : 'Failed',
        result.content || '',
        result.error || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-generation-results-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <main className="lg:pl-64">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    AI Content Generation Tools
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Bulk generate product descriptions and SEO content using AI
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">With Descriptions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.withDescriptions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Need Descriptions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.withoutDescriptions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generation Configuration */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="product_description">Product Descriptions</option>
                      <option value="seo_meta">SEO Meta Descriptions</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Content Tone</Label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="elegant">Elegant & Sophisticated</option>
                      <option value="professional">Professional & Informative</option>
                      <option value="casual">Casual & Friendly</option>
                      <option value="playful">Playful & Engaging</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Filter Options</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="onlyEmpty"
                        checked={onlyEmptyDescriptions}
                        onChange={(e) => setOnlyEmptyDescriptions(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="onlyEmpty" className="text-sm text-gray-700">
                        Only products without descriptions
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Product Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Products</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="search"
                        type="text"
                        placeholder="Search by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Filter by Category</Label>
                    <select
                      id="category"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Actions</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProducts([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {filteredProducts.length} of {products.length} products
                    {selectedProducts.length > 0 && (
                      <span className="ml-2 font-medium text-blue-600">
                        • {selectedProducts.length} selected
                      </span>
                    )}
                  </p>

                  {selectedProducts.length > 0 && (
                    <AIBulkGenerateButton
                      contentType={contentType}
                      products={products.filter(p => selectedProducts.includes(p.id))}
                      onSuccess={handleBulkGeneration}
                      onError={(error) => {
                        console.error('Bulk generation failed:', error)
                        // You could add a toast notification here
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product List */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 border rounded-lg transition-all ${
                          selectedProducts.includes(product.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="mt-1 rounded"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {product.category?.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ${product.sellingPriceUSD}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-1">
                              {product.description?.trim() ? (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {product.description}
                                </p>
                              ) : (
                                <p className="text-sm text-red-500 italic">
                                  No description available
                                </p>
                              )}
                            </div>

                            {product.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {product.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {product.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{product.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generation Results */}
            {generationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Generation Results
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exportResults}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {generationResults.filter(r => r.success).length}
                        </div>
                        <div className="text-sm text-gray-600">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {generationResults.filter(r => !r.success).length}
                        </div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {generationResults.length}
                        </div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generationResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          result.success 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {result.productName}
                            </h4>
                            
                            {result.success ? (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                                {result.content}
                              </p>
                            ) : (
                              <p className="mt-1 text-sm text-red-600">
                                Error: {result.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}