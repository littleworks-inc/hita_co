'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  TrendingUp,
  Package,
  Globe,
  Calendar,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Plus,
  ExternalLink,
  Target,
  AlertCircle
} from 'lucide-react'

interface InsightsProps {
  period: string
  currency: string
}

interface Insight {
  icon: any
  color: string
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral' | 'action'
  actionText?: string
  actionLink?: string
}

export default function AnalyticsInsights({ period, currency }: InsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [period, currency])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      
      // Fetch metrics to determine insights
      const response = await fetch(`/api/admin/analytics/metrics?period=${period}&currency=${currency}`)
      const data = await response.json()
      
      // Generate insights based on real data
      const generatedInsights = generateInsights(data, period)
      setInsights(generatedInsights)
      
    } catch (error) {
      console.error('Error fetching insights:', error)
      // Set default insights for fresh system
      setInsights(getDefaultInsights())
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = (data: any, period: string): Insight[] => {
    const insights: Insight[] = []

    // Check if this is a fresh system
    if (data.isEmpty) {
      if (data.emptyStateType === 'no_products') {
        return [
          {
            icon: Package,
            color: 'text-blue-600',
            title: 'Ready to Start',
            description: 'Your analytics dashboard is ready! Add your first product to begin tracking performance.',
            impact: 'action',
            actionText: 'Add Product',
            actionLink: '/admin/products/new'
          },
          {
            icon: TrendingUp,
            color: 'text-green-600',
            title: 'Growth Potential',
            description: 'Set up your product catalog and start building your customer base for sustainable growth.',
            impact: 'neutral'
          },
          {
            icon: Target,
            color: 'text-purple-600',
            title: 'Next Steps',
            description: 'Configure your store settings, upload product images, and prepare for your first sales.',
            impact: 'neutral'
          }
        ]
      } else {
        // Have products but no orders
        return [
          {
            icon: ShoppingCart,
            color: 'text-green-600',
            title: 'Products Ready',
            description: `You have ${data.products.total} products ready for sale! Share your store to start getting orders.`,
            impact: 'action',
            actionText: 'View Store',
            actionLink: '/'
          },
          {
            icon: Globe,
            color: 'text-blue-600',
            title: 'Marketing Opportunity',
            description: 'Consider promoting your store on social media or through email marketing to drive traffic.',
            impact: 'neutral'
          },
          {
            icon: Package,
            color: 'text-orange-600',
            title: 'Inventory Status',
            description: data.products.lowStock > 0 
              ? `${data.products.lowStock} products are running low on stock. Consider restocking.`
              : 'All products are well-stocked and ready for orders.',
            impact: data.products.lowStock > 0 ? 'negative' : 'positive'
          }
        ]
      }
    }

    // Generate insights for systems with real data
    
    // Revenue insights
    if (data.revenue.change > 0) {
      insights.push({
        icon: TrendingUp,
        color: 'text-green-600',
        title: 'Revenue Growth',
        description: `Sales increased by ${data.revenue.change.toFixed(1)}% compared to the previous ${period}. Great momentum!`,
        impact: 'positive'
      })
    } else if (data.revenue.change < -10) {
      insights.push({
        icon: TrendingUp,
        color: 'text-red-600',
        title: 'Revenue Decline',
        description: `Sales decreased by ${Math.abs(data.revenue.change).toFixed(1)}%. Consider reviewing marketing strategies.`,
        impact: 'negative'
      })
    }

    // Order insights
    if (data.orders.change > 0) {
      insights.push({
        icon: ShoppingCart,
        color: 'text-blue-600',
        title: 'Order Growth',
        description: `Order volume increased by ${data.orders.change.toFixed(1)}%. Your customer base is expanding!`,
        impact: 'positive'
      })
    }

    // Product insights
    if (data.products.lowStock > 0) {
      insights.push({
        icon: AlertCircle,
        color: 'text-orange-600',
        title: 'Inventory Alert',
        description: `${data.products.lowStock} products are running low on stock. Restock soon to avoid lost sales.`,
        impact: 'negative',
        actionText: 'View Inventory',
        actionLink: '/admin/products?filter=low-stock'
      })
    }

    // Top category insight
    if (data.performance.topCategory && data.performance.topCategory !== 'No top category') {
      insights.push({
        icon: Package,
        color: 'text-purple-600',
        title: 'Top Performer',
        description: `${data.performance.topCategory} is your best-performing category. Consider expanding this product line.`,
        impact: 'positive'
      })
    }

    // Average order value insight
    if (data.performance.averageOrderValue > 0) {
      const aov = data.performance.averageOrderValue
      if (aov > 100) {
        insights.push({
          icon: TrendingUp,
          color: 'text-green-600',
          title: 'Strong Order Value',
          description: `Your average order value of ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(aov)} shows healthy customer spending.`,
          impact: 'positive'
        })
      } else {
        insights.push({
          icon: Target,
          color: 'text-blue-600',
          title: 'Growth Opportunity',
          description: `Consider bundling products or offering upsells to increase your average order value from ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(aov)}.`,
          impact: 'neutral'
        })
      }
    }

    // Ensure we always have at least 3 insights
    if (insights.length < 3) {
      insights.push({
        icon: Calendar,
        color: 'text-indigo-600',
        title: 'Period Analysis',
        description: `This ${period} analysis shows ${data.orders.current} orders worth ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(data.revenue.current)}.`,
        impact: 'neutral'
      })
    }

    return insights.slice(0, 4) // Limit to 4 insights
  }

  const getDefaultInsights = (): Insight[] => {
    return [
      {
        icon: Package,
        color: 'text-blue-600',
        title: 'Getting Started',
        description: 'Your analytics dashboard is being set up. Add products and start selling to see insights here.',
        impact: 'neutral',
        actionText: 'Add Product',
        actionLink: '/admin/products/new'
      },
      {
        icon: TrendingUp,
        color: 'text-green-600',
        title: 'Growth Ready',
        description: 'Your eCommerce platform is ready for growth. Set up your product catalog to begin tracking performance.',
        impact: 'neutral'
      },
      {
        icon: Globe,
        color: 'text-purple-600',
        title: 'Global Reach',
        description: 'With multi-currency support, you can sell to customers worldwide from day one.',
        impact: 'positive'
      }
    ]
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

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
              {insight.actionText && insight.actionLink && (
                <Link href={insight.actionLink}>
                  <Button size="sm" variant="outline" className="mt-2 text-xs">
                    {insight.actionText}
                  </Button>
                </Link>
              )}
            </div>
            {insight.impact === 'positive' && (
              <ArrowUp className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
            {insight.impact === 'negative' && (
              <ArrowDown className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}