// src/app/admin/layout.tsx - Enhanced with theme support
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext' // ✅ NEW - Add theme support to admin

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ NEW - Theme detection script for admin */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme-mode');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                if (savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark) || (!savedTheme && systemPrefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (error) {
                console.warn('Admin theme detection error:', error);
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        {/* ✅ NEW - Wrap admin with ThemeProvider */}
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}