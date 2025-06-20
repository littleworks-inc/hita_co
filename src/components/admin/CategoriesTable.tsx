'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  parentId: string | null
  parent?: {
    id: string
    name: string
  } | null
  children: Array<{
    id: string
    name: string
  }>
  _count: {
    products: number
    children: number
  }
  createdAt: Date
  updatedAt: Date
}

interface CategoriesTableProps {
  categories: Category[]
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Organize categories by parent-child relationship
  const parentCategories = categories.filter(cat => !cat.parentId)
  const subcategoriesMap = categories
    .filter(cat => cat.parentId)
    .reduce((acc, cat) => {
      if (!acc[cat.parentId!]) {
        acc[cat.parentId!] = []
      }
      acc[cat.parentId!].push(cat)
      return acc
    }, {} as Record<string, Category[]>)

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(categoryId)

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete category. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const renderCategoryRow = (category: Category, isSubcategory = false) => (
    <tr key={category.id} className={`hover:bg-gray-50 ${isSubcategory ? 'bg-gray-25' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {isSubcategory && (
            <div className="flex items-center mr-2">
              <div className="w-4 h-px bg-gray-300 mr-2"></div>
              <ChevronRight className="h-3 w-3 text-gray-400" />
            </div>
          )}
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-8 h-8 ${isSubcategory ? 'bg-blue-100' : 'bg-purple-100'} rounded-lg flex items-center justify-center`}>
              {isSubcategory ? (
                <Package className={`h-4 w-4 ${isSubcategory ? 'text-blue-600' : 'text-purple-600'}`} />
              ) : (
                <Layers className={`h-4 w-4 ${isSubcategory ? 'text-blue-600' : 'text-purple-600'}`} />
              )}
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${isSubcategory ? 'text-gray-700' : 'text-gray-900'}`}>
                {category.name}
              </div>
              <div className="text-sm text-gray-500">
                {category.slug}
              </div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {category.description || '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {category._count.products} products
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        {!isSubcategory && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {category._count.children} subcategories
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/categories/${category.id}/edit`}>
            <Button variant="ghost" size="sm" title="Edit Category">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(category.id, category.name)}
            disabled={deletingId === category.id || category._count.products > 0 || category._count.children > 0}
            title={
              category._count.products > 0 
                ? "Cannot delete category with products"
                : category._count.children > 0
                ? "Cannot delete category with subcategories"  
                : "Delete Category"
            }
          >
            {deletingId === category.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Category Hierarchy ({categories.length} total)
          </CardTitle>
          
          <Link href="/admin/categories/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first product category.
            </p>
            <div className="mt-6">
              <Link href="/admin/categories/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcategories
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parentCategories.map((parentCategory) => (
                  <>
                    {renderCategoryRow(parentCategory)}
                    {subcategoriesMap[parentCategory.id]?.map((subcategory) =>
                      renderCategoryRow(subcategory, true)
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FolderTree className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Category Management Tips</h4>
              <ul className="mt-1 text-sm text-blue-700 space-y-1">
                <li>• Main categories organize your products into broad groups</li>
                <li>• Subcategories provide more specific classification within main categories</li>
                <li>• Categories with products or subcategories cannot be deleted</li>
                <li>• Use descriptive names and slugs for better SEO</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}