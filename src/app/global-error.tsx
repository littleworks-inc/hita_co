// src/app/global-error.tsx
// ✅ CRITICAL FIX: Create global error page for build

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'
import { RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-600 mb-4">Error</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Something went wrong</h2>
              <p className="text-gray-600">
                An unexpected error occurred. Please try again.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/admin/login'}
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}