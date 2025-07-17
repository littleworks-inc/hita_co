// src/app/exhibition/login/page.tsx
// =====================================
// 🔧 HYDRATION-SAFE: Exhibition Login - No SSR/Hydration Issues
// Uses dynamic import to prevent hydration mismatches
// =====================================

'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// ✅ CRITICAL: Dynamic import to prevent hydration issues
const ExhibitionLoginForm = dynamic(() => import('./LoginForm'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading login page...</p>
      </div>
    </div>
  )
})

export default function ExhibitionLoginPage() {
  const [mounted, setMounted] = useState(false)

  // ✅ Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return <ExhibitionLoginForm />
}