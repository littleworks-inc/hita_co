// src/app/exhibition/login/layout.tsx
// =====================================
// 🔧 SEPARATE LOGIN LAYOUT - Prevents Authentication Loops
// This layout overrides the main exhibition layout for login pages only
// =====================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Staff Login - Exhibition Portal',
  description: 'Login to access the exhibition portal',
  robots: 'noindex, nofollow',
}

interface ExhibitionLoginLayoutProps {
  children: React.ReactNode
}

export default function ExhibitionLoginLayout({ children }: ExhibitionLoginLayoutProps) {
  // ✅ SIMPLE: No authentication check, no session logic, just return the children
  return (
    <div className={`${inter.className} font-sans antialiased`}>
      {children}
    </div>
  )
}