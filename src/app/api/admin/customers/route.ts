import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'lastOrderDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Get all unique customers from orders
    const whereClause = search ? {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } }
      ]
    } : {}

    // Get all orders to aggregate customer data
    const allOrders = await db.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sellingPriceUSD: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Aggregate customer data
    const customerMap = new Map()

    allOrders.forEach(order => {
      const customerKey = order.customerEmail.toLowerCase()
      
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
          orders: [],
          status: 'active' // We'll determine this based on activity
        })
      }

      const customer = customerMap.get(customerKey)
      customer.totalOrders += 1
      customer.totalSpent += order.total
      customer.orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length
      })

      // Update dates
      if (order.createdAt < customer.firstOrderDate) {
        customer.firstOrderDate = order.createdAt
      }
      if (order.createdAt > customer.lastOrderDate) {
        customer.lastOrderDate = order.createdAt
      }

      // Update name/phone if more recent order has different info
      if (order.createdAt === customer.lastOrderDate) {
        customer.name = order.customerName
        customer.phone = order.customerPhone
      }
    })

    // Convert to array and calculate additional metrics
    let customers = Array.from(customerMap.values()).map(customer => {
      customer.averageOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0
      
      // Determine customer status based on last order date
      const daysSinceLastOrder = Math.floor((new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceLastOrder > 365) {
        customer.status = 'inactive'
      } else if (daysSinceLastOrder > 90) {
        customer.status = 'at_risk'
      } else {
        customer.status = 'active'
      }

      return customer
    })

    // Sort customers
    customers.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === 'totalSpent') {
        return sortOrder === 'asc' ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent
      } else if (sortBy === 'totalOrders') {
        return sortOrder === 'asc' ? a.totalOrders - b.totalOrders : b.totalOrders - a.totalOrders
      } else { // lastOrderDate
        return sortOrder === 'asc' ? 
          new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime() :
          new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      }
    })

    // Calculate total and pagination
    const total = customers.length
    const startIndex = (page - 1) * limit
    const paginatedCustomers = customers.slice(startIndex, startIndex + limit)

    // Calculate statistics
    const stats = {
      totalCustomers: total,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      atRiskCustomers: customers.filter(c => c.status === 'at_risk').length,
      inactiveCustomers: customers.filter(c => c.status === 'inactive').length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      averageCustomerValue: total > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / total : 0,
      repeatCustomers: customers.filter(c => c.totalOrders > 1).length,
      newCustomersThisMonth: customers.filter(c => {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return c.firstOrderDate > monthAgo
      }).length
    }

    return NextResponse.json({
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Customers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}