'use client'

import { Button } from '@/components/ui'
import {
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react'

export default function AnalyticsAlerts() {
  const alerts = [
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'Low Stock Alert',
      message: '12 products are running low on inventory',
      action: 'View Products',
      actionHref: '/admin/products?filter=low-stock'
    },
    {
      type: 'success',
      icon: CheckCircle,
      title: 'Revenue Target',
      message: "You've achieved 85% of this month's revenue goal",
      action: 'View Details',
      actionHref: '/admin/analytics?period=1m'
    },
    {
      type: 'info',
      icon: TrendingUp,
      title: 'Growth Opportunity',
      message: 'Consider expanding your Traditional Earrings category',
      action: 'Add Products',
      actionHref: '/admin/products/new'
    }
  ]

  const colorClasses = {
    warning: 'border-orange-200 bg-orange-50 text-orange-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const Icon = alert.icon
        
        return (
          <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${colorClasses[alert.type as keyof typeof colorClasses]}`}>
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <div>
                <h4 className="font-medium">{alert.title}</h4>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={alert.actionHref}>
                {alert.action}
              </a>
            </Button>
          </div>
        )
      })}
    </div>
  )
}