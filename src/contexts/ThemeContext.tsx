'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

// Theme types
type ThemeMode = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  // Current states
  mode: ThemeMode              // User's preference (system/light/dark)
  resolvedTheme: ResolvedTheme // Actual theme being used (light/dark)
  
  // Actions
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void      // Cycles through system → light → dark
  
  // System detection
  systemTheme: ResolvedTheme   // What system prefers
  isSystemMode: boolean        // Whether following system
  isClient: boolean           // Client-side hydration status
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  // Dark mode is intentionally disabled app-wide: only a few components were
  // ever styled for it, so a system/dark visitor would see a broken UI. Force
  // light everywhere. (Provider/hook kept so existing imports keep working.)
  const resolvedTheme: ResolvedTheme = 'light'
  const isSystemMode = mode === 'system'

  // Initialize client-side state (hydration safe)
  useEffect(() => {
    setMounted(true)
    
    // Get system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    // Load saved theme preference
    try {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
      if (savedMode && ['system', 'light', 'dark'].includes(savedMode)) {
        setModeState(savedMode)
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error)
    }
  }, [])

  // Listen for system theme changes (only after mounted)
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [mounted])

  // Apply theme to document (only after mounted)
  useEffect(() => {
    if (!mounted) return

    // Dark mode disabled app-wide: always ensure the dark class is absent.
    document.documentElement.classList.remove('dark')
  }, [resolvedTheme, mounted])

  // Set theme mode with persistence
  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    
    if (mounted) {
      try {
        localStorage.setItem('theme-mode', newMode)
      } catch (error) {
        console.warn('Failed to save theme preference:', error)
      }
    }
  }, [mounted])

  // Toggle through theme modes: system → light → dark → system
  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = 
      mode === 'system' ? 'light' :
      mode === 'light' ? 'dark' :
      'system'
    
    setTheme(nextMode)
  }, [mode, setTheme])

  // Don't render children until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{
      mode,
      resolvedTheme,
      setTheme,
      toggleTheme,
      systemTheme,
      isSystemMode,
      isClient: mounted
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Safe theme hook that doesn't throw errors (for optional theme usage)
export function useThemeSafe() {
  const context = useContext(ThemeContext)
  
  // Return safe defaults if no provider
  if (context === undefined) {
    return {
      mode: 'system' as ThemeMode,
      resolvedTheme: 'light' as ResolvedTheme,
      setTheme: () => {},
      toggleTheme: () => {},
      systemTheme: 'light' as ResolvedTheme,
      isSystemMode: true,
      isClient: false
    }
  }
  
  return context
}

// Hook for theme with loading state handling
export function useThemeWithLoading() {
  const theme = useThemeSafe()
  
  return {
    ...theme,
    // Don't render theme-dependent content until client-side
    canRenderTheme: theme.isClient
  }
}