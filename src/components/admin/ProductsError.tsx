'use client'

import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProductsErrorProps {
  error: any
}

export default function ProductsError({ error }: ProductsErrorProps) {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="text-center py-12 bg-white rounded-lg border border-red-200">
      <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading products</h3>
      <p className="text-gray-500 mb-4">
        There was an issue loading the products. Please try again.
      </p>
      <div className="space-x-3">
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Refresh Page
        </button>
        <a
          href="/admin/products"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Go Back
        </a>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500">
            Debug Info (Development Only)
          </summary>
          <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
            {error?.message || error?.toString() || 'Unknown error'}
          </pre>
        </details>
      )}
    </div>
  )
}