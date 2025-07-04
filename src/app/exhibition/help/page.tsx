// src/app/exhibition/help/page.tsx
// =====================================
// Exhibition Portal Help Page
// Quick reference guide for exhibition staff
// =====================================

import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react'

export default function ExhibitionHelpPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/exhibition">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exhibitions
          </Button>
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exhibition Portal Help</h1>
          <p className="text-gray-600">Quick reference guide for using the exhibition system</p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">View Exhibitions</h4>
                <p className="text-sm text-gray-600">Browse all exhibitions by status: ongoing, upcoming, or completed</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Select Exhibition</h4>
                <p className="text-sm text-gray-600">Click "View Details" to see products and pricing for any exhibition</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Start Selling</h4>
                <p className="text-sm text-gray-600">For ongoing exhibitions, click "Open POS" to start processing sales</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exhibition Status Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Exhibition Status Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Ongoing</h4>
                <p className="text-sm text-green-700">Exhibition is currently active. POS system is available.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Upcoming</h4>
                <p className="text-sm text-blue-700">Exhibition hasn't started yet. You can view products and pricing.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Completed</h4>
                <p className="text-sm text-gray-700">Exhibition is finished. View sales history and performance.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POS System Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
            POS System Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Making a Sale</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Search or browse products</li>
                <li>• Add items to cart</li>
                <li>• Apply customer discounts if needed</li>
                <li>• Select payment method</li>
                <li>• Complete the transaction</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Methods</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cash</li>
                <li>• Zelle</li>
                <li>• Card</li>
                <li>• Venmo</li>
                <li>• Split Payment (multiple methods)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Product Pricing Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">Pricing Hierarchy</h4>
              <p className="text-sm text-gray-600 mb-2">Products follow this pricing order:</p>
              <ol className="text-sm text-gray-600 space-y-1 ml-4">
                <li>1. Store Original Price</li>
                <li>2. Store Discount (if any)</li>
                <li>3. Exhibition Price Override (if set)</li>
                <li>4. Exhibition Discount (if any)</li>
                <li>5. Clearance Discount (additional 20% off if marked)</li>
              </ol>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-yellow-900">Clearance Items</h5>
                  <p className="text-sm text-yellow-700">Items marked as clearance get an automatic 20% additional discount</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Understanding Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Metrics</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Revenue:</strong> Total sales amount</li>
                <li>• <strong>Net Profit:</strong> Revenue minus participation fee</li>
                <li>• <strong>Sell-Through Rate:</strong> % of products sold</li>
                <li>• <strong>ROI:</strong> Return on investment percentage</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Indicators</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Excellent:</strong> 75%+ sell-through</li>
                <li>• <strong>Good:</strong> 50-75% sell-through</li>
                <li>• <strong>Slow:</strong> 25-50% sell-through</li>
                <li>• <strong>Poor:</strong> Under 25% sell-through</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Need More Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              If you need additional support or encounter any issues, please contact the admin team:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call Support
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Admin
              </Button>
              <Link href="/admin/exhibitions">
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}