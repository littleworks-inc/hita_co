// src/app/exhibition/layout.tsx
// =====================================
// 🔥 UPDATED: Exhibition Portal Layout - Enhanced Navigation Support
// Now supports both exhibition list and individual exhibition views
// =====================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { redirect } from 'next/navigation'
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
  // Check if user is authenticated
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
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px]"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs text-gray-600 mt-1">Exhibitions</span>
            </a>

            {/* Admin Panel */}
            <a
              href="/admin/exhibitions"
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px]"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-gray-600 mt-1">Admin</span>
            </a>

            {/* Help/Support */}
            <a
              href="/exhibition/help"
              className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px]"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-600 mt-1">Help</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  )
}