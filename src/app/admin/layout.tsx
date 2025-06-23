// src/app/admin/layout.tsx - Admin-specific layout that bypasses CurrencyProvider for login
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

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
  robots: 'noindex, nofollow' // Prevent search engine indexing
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={`${inter.className} font-sans antialiased`}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}