'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Package,
  Globe,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface InsightsProps {
  period: string
  currency: string
}

export default function AnalyticsInsights({ period, currency }: InsightsProps) {
  const [insights, setInsights] = useState([
    {
      icon: TrendingUp,
      color: 'text-green-600',
      title: 'Revenue Growth',
      description: 'Sales increased by 23% compared to the previous period',
      impact: 'positive'
    },
    {
      icon: Package,
      color: 'text-blue-600', 
      title: 'Product Performance',
      description: 'Traditional Jewelry category is your top performer with 35% of total sales',
      impact: 'neutral'
    },
    {
      icon: Globe,
      color: 'text-purple-600',
      title: 'Geographic Insights',
      description: 'North American market shows 18% growth, consider expanding inventory',
      impact: 'positive'
    },
    {
      icon: Calendar,
      color: 'text-orange-600',
      title: 'Seasonal Trends',
      description: 'Exhibition sales contribute 28% of monthly revenue - optimize event strategy',
      impact: 'neutral'
    }
  ])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {insights.map((insight, index) => {
        const Icon = insight.icon
        return (
          <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <div className={`p-2 rounded-lg bg-white`}>
              <Icon className={`h-5 w-5 ${insight.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
            {insight.impact === 'positive' && (
              <ArrowUp className="h-5 w-5 text-green-500" />
            )}
            {insight.impact === 'negative' && (
              <ArrowDown className="h-5 w-5 text-red-500" />
            )}
          </div>
        )
      })}
    </div>
  )
}