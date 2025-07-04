// src/app/admin/exhibitions/page.tsx
// =====================================
// 🔥 FIXED: Admin Exhibition Page - Correct Model Relationships
// Changed from 'orders' to 'sales' to fix revenue calculations
// =====================================

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import AdminNavigation from '@/components/admin/AdminNavigation'
import ExhibitionsTable from '@/components/admin/ExhibitionsTable'
import {
  Calendar,
  Plus,
  MapPin,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react'

// Exhibition Stats Component
async function ExhibitionStats() {
  const [
    totalExhibitions,
    upcomingExhibitions,
    activeExhibitions,
    // 🔥 FIXED: Calculate total revenue from exhibition sales, not participation fees
    totalRevenueData
  ] = await Promise.all([
    db.exhibition.count(),
    db.exhibition.count({
      where: {
        startDate: { gte: new Date() },
        isActive: true
      }
    }),
    db.exhibition.count({
      where: { isActive: true }
    }),
    // 🔥 FIXED: Get total revenue from exhibition sales instead of participation fees
    db.exhibitionSale.aggregate({
      _sum: { finalTotal: true },
      where: { 
        isCompleted: true,
        exhibition: { isActive: true }
      }
    })
  ])

  const stats = [
    {
      title: 'Total Exhibitions',
      value: totalExhibitions,
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Upcoming Events',
      value: upcomingExhibitions,
      icon: MapPin,
      color: 'green'
    },
    {
      title: 'Active Exhibitions',
      value: activeExhibitions,
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Total Revenue',
      value: formatPrice(totalRevenueData._sum.finalTotal || 0),
      icon: DollarSign,
      color: 'orange'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 text-${stat.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Exhibitions Data Component
async function ExhibitionsData() {
  const exhibitions = await db.exhibition.findMany({
    include: {
      products: {
        include: {
          product: {
            select: {
              name: true,
              sellingPriceUSD: true
            }
          }
        }
      },
      // 🔥 FIXED: Changed from 'orders' to 'sales' to get exhibition POS transactions
      sales: {
        select: {
          finalTotal: true,  // ✅ FIXED: Changed from total to finalTotal
          isCompleted: true // 🔥 FIXED: Use isCompleted instead of status
        }
      },
      _count: {
        select: {
          products: true,
          sales: true // 🔥 FIXED: Count sales instead of orders
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  })

  return <ExhibitionsTable exhibitions={exhibitions} />
}

export default async function ExhibitionsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Exhibitions & Events
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    Manage your exhibitions, track products taken to events, and analyze profitability.
                  </p>
                </div>
                
                <Link href="/admin/exhibitions/new">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Exhibition
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <Suspense fallback={<div>Loading stats...</div>}>
              <ExhibitionStats />
            </Suspense>

            {/* Exhibitions Table */}
            <Suspense fallback={<div>Loading exhibitions...</div>}>
              <ExhibitionsData />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}