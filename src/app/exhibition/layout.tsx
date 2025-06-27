// src/app/exhibition/layout.tsx
// =====================================
// Exhibition Portal Layout - Mobile-First Foundation
// Provides layout and authentication context for exhibition staff
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom on mobile for POS use
  }
}

interface ExhibitionLayoutProps {
  children: React.ReactNode
}

// Get current exhibition for the authenticated user
async function getCurrentExhibition() {
  // For now, get the most recent active exhibition
  // Later, this could be based on user assignment or selection
  const exhibition = await db.exhibition.findFirst({
    where: {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() }
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
              country: true
            }
          }
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  })

  return exhibition
}

export default async function ExhibitionLayout({ children }: ExhibitionLayoutProps) {
  // Check if user is authenticated
  const session = await getSession()
  
  if (!session) {
    redirect('/exhibition/login')
  }

  // For now, allow any authenticated user access to exhibition portal
  // Later, you can add role-based restrictions like:
  // if (session.role !== 'exhibition_staff' && session.role !== 'admin') {
  //   redirect('/exhibition/login')
  // }

  // Get current exhibition
  const currentExhibition = await getCurrentExhibition()

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-sans antialiased bg-gray-50 touch-pan-y`}>
        {/* Mobile-optimized exhibition portal */}
        <div className="min-h-screen flex flex-col">
          {/* Top Navigation Bar - Mobile Optimized */}
          <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                {/* Exhibition Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">
                    Exhibition Portal
                  </h1>
                  {currentExhibition ? (
                    <p className="text-sm text-gray-600 truncate">
                      {currentExhibition.title} • {currentExhibition.location}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">
                      No active exhibition found
                    </p>
                  )}
                </div>

                {/* User Info & Actions */}
                <div className="flex items-center gap-3">
                  {/* User Avatar/Initial */}
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  
                  {/* Logout Button */}
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
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
            {currentExhibition ? (
              <div className="max-w-7xl mx-auto px-4 py-6">
                {children}
              </div>
            ) : (
              /* No Active Exhibition State */
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    No Active Exhibition
                  </h2>
                  <p className="text-gray-600 mb-6">
                    There are no active exhibitions currently running. Please contact your administrator or check back later.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Refresh
                    </button>
                    <form action="/api/auth/logout" method="POST" className="w-full">
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                      >
                        Switch User
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Bottom Navigation - Mobile POS Style */}
          {currentExhibition && (
            <nav className="bg-white border-t border-gray-200 px-4 py-2 safe-area-inset-bottom">
              <div className="flex justify-around items-center">
                {/* POS Button */}
                <a
                  href={`/exhibition/${currentExhibition.id}/pos`}
                  className="flex flex-col items-center px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1"
                >
                  <svg className="w-6 h-6 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15.5M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">POS</span>
                </a>

                {/* Products Button */}
                <a
                  href={`/exhibition/${currentExhibition.id}/products`}
                  className="flex flex-col items-center px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1"
                >
                  <svg className="w-6 h-6 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Products</span>
                </a>

                {/* Sales Button */}
                <a
                  href={`/exhibition/${currentExhibition.id}/sales`}
                  className="flex flex-col items-center px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1"
                >
                  <svg className="w-6 h-6 text-purple-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Sales</span>
                </a>

                {/* Analytics Button */}
                <a
                  href={`/exhibition/${currentExhibition.id}/analytics`}
                  className="flex flex-col items-center px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1"
                >
                  <svg className="w-6 h-6 text-orange-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Analytics</span>
                </a>
              </div>
            </nav>
          )}
        </div>

        {/* Mobile-specific styles */}
        <style jsx global>{`
          /* Prevent zoom on inputs for better mobile UX */
          input[type="text"],
          input[type="number"],
          input[type="email"],
          input[type="password"],
          select,
          textarea {
            font-size: 16px;
          }

          /* Smooth touch scrolling */
          * {
            -webkit-overflow-scrolling: touch;
          }

          /* Safe area support for notched devices */
          .safe-area-inset-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }

          /* Touch-friendly button sizing */
          button,
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }

          /* Prevent text selection on POS interface */
          .no-select {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        `}</style>
      </body>
    </html>
  )
}