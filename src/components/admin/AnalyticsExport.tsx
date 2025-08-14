'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Share,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface AnalyticsExportProps {
  period: string
  currency: string
}

export default function AnalyticsExport({ period, currency }: AnalyticsExportProps) {
  const [exporting, setExporting] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const exportOptions = [
    {
      id: 'pdf',
      label: 'PDF Report',
      description: 'Comprehensive analytics report with charts',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Detailed data for further analysis',
      icon: FileSpreadsheet,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'csv',
      label: 'CSV Data',
      description: 'Raw data in comma-separated format',
      icon: Download,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ]

  const handleExport = async (format: string) => {
    setExporting(format)
    
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          period,
          currency,
          timestamp: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Handle different response types
      if (format === 'pdf') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${period}-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-data-${period}-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      // Show success message
      const successEvent = new CustomEvent('export-success', {
        detail: { format, period }
      })
      window.dispatchEvent(successEvent)
      
    } catch (error) {
      console.error('Export failed:', error)
      
      // Show error message
      const errorEvent = new CustomEvent('export-error', {
        detail: { format, error: error instanceof Error ? error.message : 'Export failed' }
      })
      window.dispatchEvent(errorEvent)
      
      // For development, create mock download
      if (process.env.NODE_ENV === 'development') {
        createMockDownload(format)
      }
    } finally {
      setExporting(null)
      setShowExportMenu(false)
    }
  }

  const createMockDownload = (format: string) => {
    const mockData = generateMockData(format)
    const blob = new Blob([mockData], { 
      type: format === 'pdf' ? 'application/pdf' : 'text/plain' 
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format}-${Date.now()}.${format === 'pdf' ? 'pdf' : format}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const generateMockData = (format: string) => {
    const timestamp = new Date().toISOString()
    
    if (format === 'csv') {
      return `Date,Revenue,Orders,Avg Order Value,Top Category
2024-01-01,12420,89,139.55,Traditional Jewelry
2024-01-02,15680,112,140.00,Traditional Jewelry
2024-01-03,13250,95,139.47,Ethnic Wear
2024-01-04,18900,135,140.00,Traditional Jewelry
2024-01-05,16750,120,139.58,Home Decor
2024-01-06,21200,152,139.47,Traditional Jewelry
2024-01-07,19650,141,139.36,Accessories`
    }
    
    if (format === 'excel') {
      return `Analytics Report - ${period}\nGenerated: ${timestamp}\n\nSummary:\nTotal Revenue: $87,850\nTotal Orders: 644\nAverage Order Value: $139.52\n\nTop Categories:\n1. Traditional Jewelry - $28,500\n2. Ethnic Wear - $22,100\n3. Home Decor - $15,600`
    }
    
    return `Hita&Co Analytics Report\nPeriod: ${period}\nCurrency: ${currency}\nGenerated: ${timestamp}\n\nThis is a sample analytics report.\nIn production, this would contain comprehensive business insights.`
  }

  const getPeriodLabel = () => {
    switch (period) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 3 Months'
      case '1y': return 'Last Year'
      default: return 'Custom Period'
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowExportMenu(!showExportMenu)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      {showExportMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowExportMenu(false)}
          />
          
          {/* Export Menu */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Analytics
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Download your analytics data for {getPeriodLabel().toLowerCase()} in {currency}
              </p>
            </div>
            
            <div className="p-4 space-y-3">
              {exportOptions.map((option) => {
                const Icon = option.icon
                const isExporting = exporting === option.id
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleExport(option.id)}
                    disabled={isExporting || !!exporting}
                    className={`w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all text-left ${
                      isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${option.bgColor}`}>
                        {isExporting ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                        ) : (
                          <Icon className={`h-5 w-5 ${option.color}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{option.label}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                        {isExporting && (
                          <p className="text-xs text-blue-600 mt-1">Generating {option.label.toLowerCase()}...</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium">Export includes:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Sales trends and revenue data</li>
                    <li>• Product performance metrics</li>
                    <li>• Geographic breakdown</li>
                    <li>• Category analysis</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}