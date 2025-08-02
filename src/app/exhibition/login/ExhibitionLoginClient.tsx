// src/app/exhibition/login/ExhibitionLoginClient.tsx
// ✅ NEW: Client component for theme support and interactivity

'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle'
import LoginForm from './LoginForm'
import Link from 'next/link'
import { ArrowLeft, Smartphone, Shield } from 'lucide-react'

export default function ExhibitionLoginClient() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
        {/* Header with Theme Toggle */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Back to Admin Link */}
              <Link 
                href="/admin/login"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Link>
              
              {/* Mobile: Just show title */}
              <div className="sm:hidden">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Exhibition Login</h1>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center gap-3">
                <ThemeToggle size="sm" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              {/* Logo/Icon */}
              <div className="mx-auto w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                Exhibition Portal
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Mobile POS system for exhibition sales and management
              </p>
            </div>

            {/* Login Form Container */}
            <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <LoginForm />
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-colors duration-300">
                <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 transition-colors duration-300" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Mobile First</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Optimized for tablets and phones</p>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-colors duration-300">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2 transition-colors duration-300" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Secure</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Protected access for staff only</p>
              </div>
            </div>

            {/* Help Link */}
            <div className="text-center">
              <Link 
                href="/exhibition/help"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
              >
                Need help? Contact support
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-4 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2025 Hita&Co Exhibition Portal. Secure mobile POS system.
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}