// src/app/exhibition/(authenticated)/ExhibitionLogoutButton.tsx
// ✅ NEW: Client-side logout button with proper redirect handling

'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export default function ExhibitionLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Clear any client-side state if needed
        // Redirect to exhibition login
        window.location.href = '/exhibition/login'
      } else {
        console.error('Logout failed')
        // Fallback: still redirect to login
        window.location.href = '/exhibition/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: still redirect to login
      window.location.href = '/exhibition/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-md transition-colors duration-300 disabled:opacity-50"
    >
      {isLoggingOut ? (
        <>
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Logging out...
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          Logout
        </>
      )}
    </button>
  )
}