'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Save,
  AlertTriangle,
  MessageSquare,
  Star,
  CheckCircle
} from 'lucide-react'

interface Supplier {
  id?: string
  name: string
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  pincode?: string | null
  businessType?: string | null
  gstNumber?: string | null
  panNumber?: string | null
  bankName?: string | null
  accountNumber?: string | null
  ifscCode?: string | null
  notes?: string | null
  rating?: number | null
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
    country: supplier?.country || '',
    pincode: supplier?.pincode || '',
    businessType: supplier?.businessType || '',
    gstNumber: supplier?.gstNumber || '',
    panNumber: supplier?.panNumber || '',
    bankName: supplier?.bankName || '',
    accountNumber: supplier?.accountNumber || '',
    ifscCode: supplier?.ifscCode || '',
    notes: supplier?.notes || '',
    rating: supplier?.rating || null,
    isActive: supplier?.isActive ?? true,
  })

  const handleInputChange = (field: keyof Supplier, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required'
    }

    // Email validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Phone validation (basic)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(formData.phone.trim().replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    // GST validation (if provided)
    if (formData.gstNumber && formData.gstNumber.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!gstRegex.test(formData.gstNumber.trim())) {
        newErrors.gstNumber = 'Please enter a valid GST number'
      }
    }

    // PAN validation (if provided)
    if (formData.panNumber && formData.panNumber.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(formData.panNumber.trim())) {
        newErrors.panNumber = 'Please enter a valid PAN number'
      }
    }

    // Rating validation
    if (formData.rating !== null && (formData.rating < 1 || formData.rating > 5)) {
      newErrors.rating = 'Rating must be between 1 and 5'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

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

      const data = await response.json()

      if (response.ok) {
        router.push(`/admin/suppliers/${data.id}`)
        router.refresh()
      } else {
        if (data.error) {
          setErrors({ submit: data.error })
        }
      }
    } catch (error) {
      console.error('Supplier submission error:', error)
      setErrors({ submit: 'Failed to save supplier. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {errors.submit}
              </div>
            </div>
          </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter business name"
                className={errors.name ? 'border-red-500' : ''}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <Input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                value={formData.businessType || ''}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select business type</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Distributor">Distributor</option>
                <option value="Retailer">Retailer</option>
                <option value="Artisan">Artisan</option>
                <option value="Co-operative">Co-operative</option>
                <option value="Import/Export">Import/Export</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={formData.rating || ''}
                  onChange={(e) => handleInputChange('rating', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No rating</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the supplier..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Supplier
            </label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="supplier@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91 12345 67890"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number
              </label>
              <Input
                type="tel"
                value={formData.whatsapp || ''}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="+91 12345 67890"
              />
            </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <textarea
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter full address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <Input
                type="text"
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <Input
                type="text"
                value={formData.pincode || ''}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                placeholder="Pincode"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <Input
                type="text"
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business & Banking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <Input
                type="text"
                value={formData.gstNumber || ''}
                onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                className={errors.gstNumber ? 'border-red-500' : ''}
                maxLength={15}
              />
              {errors.gstNumber && <p className="mt-1 text-sm text-red-600">{errors.gstNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number
              </label>
              <Input
                type="text"
                value={formData.panNumber || ''}
                onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className={errors.panNumber ? 'border-red-500' : ''}
                maxLength={10}
              />
              {errors.panNumber && <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <Input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                placeholder="Bank name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <Input
                type="text"
                value={formData.accountNumber || ''}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="Account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <Input
                type="text"
                value={formData.ifscCode || ''}
                onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                placeholder="ABCD0123456"
                maxLength={11}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Create Supplier' : 'Update Supplier'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}