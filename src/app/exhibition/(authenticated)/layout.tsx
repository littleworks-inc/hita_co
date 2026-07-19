// src/app/exhibition/(authenticated)/layout.tsx
// ✅ FIXED: Exhibition layout with proper theme and logout handling

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ExhibitionLogoutButton from './ExhibitionLogoutButton'
import ThemeToggle from '@/components/ThemeToggle'

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
  robots: 'noindex, nofollow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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

export default async function ExhibitionAuthenticatedLayout({ children }: ExhibitionLayoutProps) {
  // ✅ This layout only applies to authenticated exhibition routes
  const session = await getSession()
  
  if (!session) {
    redirect('/exhibition/login')
  }

  // Get exhibition counts for header display
  const exhibitionCounts = await getExhibitionCounts()

  return (
    // ✅ ADDED: ThemeProvider wrapper for full theme support
    <ThemeProvider>
      <div className={`${inter.className} font-sans antialiased bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col transition-colors duration-300`}>
        {/* Top Navigation Bar - Mobile Optimized with Dark Mode */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 transition-colors duration-300">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Exhibition Portal Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate transition-colors duration-300">
                  Exhibition Portal
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  <span>{exhibitionCounts.total} Total</span>
                  {exhibitionCounts.ongoing > 0 && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium transition-colors duration-300">
                      {exhibitionCounts.ongoing} Ongoing
                    </span>
                  )}
                  {exhibitionCounts.upcoming > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium transition-colors duration-300">
                      {exhibitionCounts.upcoming} Upcoming
                    </span>
                  )}
                </div>
              </div>

              {/* User Info & Actions */}
              <div className="flex items-center gap-3">
                {/* ✅ ADDED: Theme Toggle Button */}
                <ThemeToggle 
                  size="sm" 
                  showTooltip={true}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                />
                
                {/* User Avatar/Initial */}
                <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center transition-colors duration-300">
                  <span className="text-white text-sm font-medium">
                    {session.email ? session.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                
                {/* ✅ FIXED: Logout Button with proper client-side handling */}
                <ExhibitionLogoutButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area with Dark Mode Support */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>

        {/* Quick Navigation Footer with Dark Mode */}
        {exhibitionCounts.total > 0 && (
          <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 pb-safe transition-colors duration-300">
            <div className="flex justify-center items-center gap-6 max-w-md mx-auto">
              {/* Home/List */}
              <a
                href="/exhibition"
                className="flex flex-col items-center px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors duration-300"
              >
                <div className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">
                  📊
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">Overview</span>
              </a>
            </div>
          </nav>
        )}
      </div>
    </ThemeProvider>
  )
}