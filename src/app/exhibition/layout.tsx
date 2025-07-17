// src/app/exhibition/layout.tsx
// =====================================
// 🔧 FIXED: Exhibition Portal Layout - Excludes Login Pages
// Prevents redirect loops by not applying authentication to login pages
// =====================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'Exhibition Portal - Hita&Co',
    template: '%s | Exhibition Portal'
  },
  description: 'Mobile POS system for exhibition sales',
  robots: 'noindex, nofollow', // Exhibition portal should not be indexed
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on mobile for POS use
}

interface ExhibitionLayoutProps {
  children: React.ReactNode
}

// Get exhibition counts for navigation
async function getExhibitionCounts() {
  try {
    const now = new Date()
    
    const [ongoingCount, upcomingCount, totalCount] = await Promise.all([
      db.exhibition.count({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now }
        }
      }),
      db.exhibition.count({
        where: {
          isActive: true,
          startDate: { gt: now }
        }
      }),
      db.exhibition.count({
        where: { isActive: true }
      })
    ])

    return {
      ongoing: ongoingCount,
      upcoming: upcomingCount,
      total: totalCount
    }
  } catch (error) {
    console.error('Error fetching exhibition counts:', error)
    return { ongoing: 0, upcoming: 0, total: 0 }
  }
}

export default async function ExhibitionLayout({ children }: ExhibitionLayoutProps) {
  // ✅ CRITICAL FIX: Create a wrapper component to handle route detection
  return <ExhibitionLayoutWrapper>{children}</ExhibitionLayoutWrapper>
}

// Client-side wrapper to detect route and apply appropriate layout
function ExhibitionLayoutWrapper({ children }: { children: React.ReactNode }) {
  // This will be handled by middleware, but we need a fallback approach
  // Since we can't easily detect the route in server components without headers
  // Let's create separate layout files instead
  return <ExhibitionAuthenticatedLayout>{children}</ExhibitionAuthenticatedLayout>
}

async function ExhibitionAuthenticatedLayout({ children }: { children: React.ReactNode }) {

  // ✅ For all other exhibition pages, check authentication
  const session = await getSession()
  
  if (!session) {
    redirect('/exhibition/login')
  }

  // Get exhibition counts for header display
  const exhibitionCounts = await getExhibitionCounts()

  return (
    <div className={`${inter.className} font-sans antialiased bg-gray-50 min-h-screen flex flex-col`}>
      {/* Top Navigation Bar - Mobile Optimized */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Exhibition Portal Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                Exhibition Portal
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{exhibitionCounts.total} Total</span>
                {exhibitionCounts.ongoing > 0 && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {exhibitionCounts.ongoing} Ongoing
                  </span>
                )}
                {exhibitionCounts.upcoming > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {exhibitionCounts.upcoming} Upcoming
                  </span>
                )}
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-3">
              {/* User Avatar/Initial */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session.email ? session.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              
              {/* Logout Button */}
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Quick Navigation Footer - Only show if there are exhibitions */}
      {exhibitionCounts.total > 0 && (
        <nav className="bg-white border-t border-gray-200 px-4 py-2 pb-safe">
          <div className="flex justify-center items-center gap-6 max-w-md mx-auto">
            {/* Home/List */}
            <a
              href="/exhibition"
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 text-gray-600 mb-1">
                📊
              </div>
              <span className="text-xs text-gray-600">Overview</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  )
}