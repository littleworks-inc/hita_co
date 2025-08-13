// src/app/not-found.tsx
// ✅ CRITICAL FIX: Create missing error page to resolve build error

import Link from 'next/link'
import { Button } from '@/components/ui'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/admin/login">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Admin Dashboard
            </Button>
          </Link>
          
          <Link href="/exhibition">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Exhibition Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}