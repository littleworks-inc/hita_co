'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Save,
  Star
} from 'lucide-react'

interface Supplier {
  id?: string
  name: string
  contactPerson: string
  email: string
  phone: string
  whatsapp: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  businessType: string
  gstNumber: string
  panNumber: string
  bankName: string
  accountNumber: string
  ifscCode: string
  notes: string
  rating: number
  isActive: boolean
}

interface SupplierFormProps {
  supplier?: Supplier
  mode: 'create' | 'edit'
}

export default function SupplierForm({ supplier, mode }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form state
  const [formData, setFormData] = useState<Supplier>({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    whatsapp: supplier?.whatsapp || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    state: supplier?.state || '',
    country: supplier?.country || 'India',
    pincode: supplier?.pincode || '',
    businessType: supplier?.businessType || 'Wholesaler',
    gstNumber: supplier?.gstNumber || '',
    panNumber: supplier?.panNumber || '',
    bankName: supplier?.bankName || '',
    accountNumber: supplier?.accountNumber || '',
    ifscCode: supplier?.ifscCode || '',
    notes: supplier?.notes || '',
    rating: supplier?.rating || 0,
    isActive: supplier?.isActive ?? true
  })

  const handleInputChange = (field: keyof Supplier, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Supplier name is required'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const url = mode === 'create' 
        ? '/api/admin/suppliers'
        : `/api/admin/suppliers/${supplier?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/suppliers')
        router.refresh()
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Something went wrong' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const businessTypes = [
    'Manufacturer',
    'Wholesaler', 
    'Retailer',
    'Distributor',
    'Individual Seller',
    'Cooperative',
    'Export House',
    'Other'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., ABC Handicrafts"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder="e.g., Mr. Rajesh Kumar"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type</Label>
            <select
              id="businessType"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91-9876543210"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="+91-9876543210"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="supplier@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Shop 15, Karol Bagh Market"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Delhi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Delhi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pin Code</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                placeholder="110005"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="India"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                placeholder="07AAACH7409R1Z4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                value={formData.panNumber}
                onChange={(e) => handleInputChange('panNumber', e.target.value)}
                placeholder="AAACH7409R"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Details (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder="State Bank of India"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={formData.ifscCode}
                onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                placeholder="SBIN0001234"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rating">Supplier Rating (1-5)</Label>
            <select
              id="rating"
              value={formData.rating}
              onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>No Rating</option>
              <option value={1}>1 Star - Poor</option>
              <option value={2}>2 Stars - Fair</option>
              <option value={3}>3 Stars - Good</option>
              <option value={4}>4 Stars - Very Good</option>
              <option value={5}>5 Stars - Excellent</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Special notes about this supplier, payment terms, quality notes, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Active Supplier</Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : mode === 'create' ? 'Create Supplier' : 'Update Supplier'}
        </Button>
      </div>
    </form>
  )
}