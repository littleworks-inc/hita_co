// File: src/app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma, OrderStatus, OrderSource } from '@prisma/client' // ✅ ADD: Import OrderSource enum

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const source = searchParams.get('source') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // ✅ FIXED: Build where clause with proper typing
    const where: Prisma.OrderWhereInput = {}

    // Search filter
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { customerName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { customerEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { customerPhone: { contains: search, mode: Prisma.QueryMode.insensitive } }
      ]
    }

    // ✅ FIXED: Status filter with proper enum validation
    if (status !== 'all') {
      // Validate that the status is a valid OrderStatus enum value
      if (Object.values(OrderStatus).includes(status as OrderStatus)) {
        where.status = status as OrderStatus
      }
    }

    // ✅ FIXED: Source filter with proper enum validation
    if (source !== 'all') {
      // Validate that the source is a valid OrderSource enum value
      if (Object.values(OrderSource).includes(source as OrderSource)) {
        where.source = source as OrderSource
      }
    }

    // Get total count
    const total = await db.order.count({ where })

    // Get orders with pagination
    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                sku: true
              }
            }
          }
        },
        exhibition: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // ✅ FIXED: Calculate summary statistics with proper where clause typing
    const statsWhere: Prisma.OrderWhereInput = {}
    
    // Add status filter if valid
    if (status !== 'all' && Object.values(OrderStatus).includes(status as OrderStatus)) {
      statsWhere.status = status as OrderStatus
    }
    
    // Add source filter if valid
    if (source !== 'all' && Object.values(OrderSource).includes(source as OrderSource)) {
      statsWhere.source = source as OrderSource
    }

    const stats = await db.order.aggregate({
      where: statsWhere,
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true }
    })

    // Get status breakdown
    const statusBreakdown = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { total: true }
    })

    // Get source breakdown
    const sourceBreakdown = await db.order.groupBy({
      by: ['source'],
      _count: { source: true },
      _sum: { total: true }
    })

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalOrders: stats._count.id || 0,
        totalRevenue: stats._sum.total || 0,
        averageOrderValue: stats._avg.total || 0,
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: item._count.status,
          revenue: item._sum.total || 0
        })),
        sourceBreakdown: sourceBreakdown.map(item => ({
          source: item.source,
          count: item._count.source,
          revenue: item._sum.total || 0
        }))
      }
    })

  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, status, source } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // ✅ FIXED: Validate status before updating
    if (status !== undefined) {
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        return NextResponse.json(
          { error: 'Invalid order status' },
          { status: 400 }
        )
      }
      updateData.status = status as OrderStatus
    }

    // ✅ FIXED: Validate source before updating
    if (source !== undefined) {
      if (!Object.values(OrderSource).includes(source as OrderSource)) {
        return NextResponse.json(
          { error: 'Invalid order source' },
          { status: 400 }
        )
      }
      updateData.source = source as OrderSource
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update order with proper typing
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}