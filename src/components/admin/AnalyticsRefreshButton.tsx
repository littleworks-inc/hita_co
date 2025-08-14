'use client'

import { Button } from '@/components/ui'
import { RefreshCw } from 'lucide-react'

export default function AnalyticsRefreshButton() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleRefresh}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  )
}