'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  ExternalLink,
  Loader2
} from 'lucide-react'

interface AIStatus {
  configured: boolean
  provider?: string
  error?: string
}

export default function AIStatusIndicator() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    checkAIStatus()
  }, [])

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/test')
      const data = await response.json()
      
      setStatus({
        configured: data.isAvailable || false,
        provider: data.currentProvider,
        error: data.configCheck?.error
      })
    } catch (error) {
      setStatus({
        configured: false,
        error: 'Failed to check AI status'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />
    if (status?.configured) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusText = () => {
    if (loading) return 'Checking...'
    if (status?.configured) return `AI Ready (${status.provider})`
    return 'AI Not Configured'
  }

  const getStatusColor = () => {
    if (loading) return 'text-gray-600'
    if (status?.configured) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <div className="relative">
      {/* Main Status Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
          status?.configured 
            ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
            : 'bg-red-50 hover:bg-red-100 border border-red-200'
        }`}
      >
        {getStatusIcon()}
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </button>

      {/* Dropdown Details */}
      {showDetails && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900">AI Content Generation</span>
            </div>

            {status?.configured ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>AI is configured and ready</span>
                </div>
                <div className="text-sm text-gray-600">
                  Provider: <span className="font-medium capitalize">{status.provider}</span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Link href="/admin/ai-tools">
                    <Button size="sm" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Bulk Generate
                    </Button>
                  </Link>
                  <Link href="/admin/settings">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span>AI not configured</span>
                </div>
                {status?.error && (
                  <div className="text-sm text-gray-600">
                    {status.error}
                  </div>
                )}
                
                <div className="pt-2">
                  <Link href="/admin/settings">
                    <Button size="sm" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure AI
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Generate product descriptions</div>
                <div>• Create SEO meta tags</div>
                <div>• Social media captions</div>
                <div>• Bulk content processing</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for navigation sidebar
export function AIStatusBadge() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAIStatus()
  }, [])

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/test')
      const data = await response.json()
      
      setStatus({
        configured: data.isAvailable || false,
        provider: data.currentProvider
      })
    } catch (error) {
      setStatus({ configured: false })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>AI</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${
      status?.configured ? 'text-green-600' : 'text-red-600'
    }`}>
      {status?.configured ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      <span>AI {status?.configured ? 'Ready' : 'Off'}</span>
    </div>
  )
}

// AI Tools Navigation Item
export function AIToolsNavItem() {
  const [status, setStatus] = useState<AIStatus | null>(null)

  useEffect(() => {
    checkAIStatus()
  }, [])

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/test')
      const data = await response.json()
      setStatus({
        configured: data.isAvailable || false,
        provider: data.currentProvider
      })
    } catch (error) {
      setStatus({ configured: false })
    }
  }

  return (
    <Link
      href="/admin/ai-tools"
      className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Sparkles className="h-5 w-5 text-purple-600" />
      <span>AI Tools</span>
      {status?.configured && (
        <div className="ml-auto">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )}
    </Link>
  )
}