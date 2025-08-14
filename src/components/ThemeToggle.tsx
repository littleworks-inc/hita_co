'use client'

import { useThemeSafe } from '@/contexts/ThemeContext' // ✅ Use safe version
import { Monitor, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ThemeToggle({ 
  className, 
  showTooltip = true,
  size = 'md' 
}: ThemeToggleProps) {
  // ✅ FIXED - Use safe theme hook to prevent errors
  const { mode, resolvedTheme, toggleTheme, isSystemMode, systemTheme, isClient } = useThemeSafe()

  // Don't render until client-side to prevent hydration issues
  if (!isClient) {
    return (
      <div className={cn(
        'bg-gray-200 dark:bg-gray-700 rounded-full',
        size === 'sm' && 'w-8 h-8',
        size === 'md' && 'w-10 h-10',
        size === 'lg' && 'w-12 h-12',
        className
      )} />
    )
  }

  // Get current icon and label
  const getThemeConfig = () => {
    switch (mode) {
      case 'system':
        return {
          icon: Monitor,
          label: `System (${systemTheme})`,
          description: 'Following system preference'
        }
      case 'light':
        return {
          icon: Sun,
          label: 'Light Mode',
          description: 'Always light theme'
        }
      case 'dark':
        return {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Always dark theme'
        }
    }
  }

  const { icon: Icon, label, description } = getThemeConfig()

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className={cn(
          'relative rounded-full transition-all duration-300 ease-in-out',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          'text-gray-700 dark:text-gray-300',
          'hover:text-purple-600 dark:hover:text-purple-400',
          sizeClasses[size],
          className
        )}
        aria-label={`Switch theme - Currently ${label}`}
        title={showTooltip ? `${label} - Click to change` : undefined}
      >
        {/* Icon with smooth transition */}
        <Icon 
          className={cn(
            'transition-all duration-300 ease-in-out',
            iconSizes[size]
          )} 
        />

        {/* System mode indicator */}
        {isSystemMode && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-gray-900" />
        )}

        {/* Smooth background transition */}
        <div className={cn(
          'absolute inset-0 rounded-full transition-all duration-300 ease-in-out opacity-0',
          'group-hover:opacity-10',
          resolvedTheme === 'dark' ? 'bg-purple-400' : 'bg-purple-600'
        )} />
      </button>

      {/* Enhanced Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 invisible group-hover:visible bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg py-2 px-3 whitespace-nowrap z-50 shadow-lg">
          <div className="font-medium">{label}</div>
          <div className="text-gray-300 dark:text-gray-600 text-xs mt-0.5">
            {description}
          </div>
          {isSystemMode && (
            <div className="text-blue-300 dark:text-blue-600 text-xs mt-0.5">
              System: {systemTheme}
            </div>
          )}
          
          {/* Tooltip arrow */}
          <div className="absolute bottom-full right-4 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45 transform -translate-y-1" />
        </div>
      )}
    </div>
  )
}

// Compact version for mobile
export function ThemeToggleCompact({ className }: { className?: string }) {
  return (
    <ThemeToggle 
      size="sm"
      showTooltip={false}
      className={className}
    />
  )
}

// Theme indicator for showing current theme status (optional)
export function ThemeIndicator() {
  const { mode, resolvedTheme, systemTheme, isClient } = useThemeSafe()

  if (!isClient) return null

  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
      <span className="font-medium">Theme:</span>
      <span className="capitalize">{mode}</span>
      {mode === 'system' && (
        <span className="text-gray-400 dark:text-gray-500">
          (using {systemTheme})
        </span>
      )}
      <div className={cn(
        'w-2 h-2 rounded-full',
        resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-yellow-400'
      )} />
    </div>
  )
}