// src/app/admin/layout.tsx - Fixed to not conflict with main layout
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'Admin Panel - Hita&Co',
    template: '%s | Admin - Hita&Co'
  },
  description: 'Admin panel for Hita&Co eCommerce platform',
  robots: 'noindex, nofollow'
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    // ✅ FIXED - Don't create html/body tags, just wrap with ThemeProvider
    <ThemeProvider>
      <div className={`${inter.className} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}