// src/components/admin/ShippingManagement.tsx
// =====================================
// FIXED: Complete Shipping Management Interface
// Zones, rates, and configuration management with working edit/delete
// =====================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  MapPin,
  DollarSign,
  Clock,
  Star,
  Settings,
  Globe,
  AlertCircle,
  Check,
  RefreshCw
} from 'lucide-react'

// =================
// INTERFACES
// =================

interface Country {
  id: string
  name: string
  code: string
  currency: string
  currencySymbol: string
}

interface ShippingRate {
  id: string
  name: string
  flatRate: number
  freeShippingThreshold: number | null
  estimatedDays: string | null
  isActive: boolean
}

interface ShippingZone {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  countries: Country[]
  shippingRates: ShippingRate[]
}

interface StoreSettings {
  id: string
  defaultShippingZoneId: string | null
  defaultShippingZone?: ShippingZone | null
}

interface ShippingManagementProps {
  initialZones: ShippingZone[]
  unassignedCountries: Country[]
  allCountries: Country[]
  storeSettings: StoreSettings | null
}

// =================
// MAIN COMPONENT - FIXED
// =================

export default function ShippingManagement({ 
  initialZones, 
  unassignedCountries, 
  allCountries,
  storeSettings 
}: ShippingManagementProps) {
  // State management
  const [zones, setZones] = useState<ShippingZone[]>(initialZones)
  const [unassigned, setUnassigned] = useState<Country[]>(unassignedCountries)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // UI state
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [showCreateZone, setShowCreateZone] = useState(false)
  const [showCreateRate, setShowCreateRate] = useState<string | null>(null)

  // Form states
  const [newZoneForm, setNewZoneForm] = useState({
    name: '',
    description: '',
    isDefault: false
  })

  const [editZoneForm, setEditZoneForm] = useState({
    name: '',
    description: '',
    isDefault: false
  })

  const [newRateForm, setNewRateForm] = useState({
    name: '',
    flatRate: 0,
    freeShippingThreshold: null as number | null,
    estimatedDays: ''
  })

  const [editRateForm, setEditRateForm] = useState({
    name: '',
    flatRate: 0,
    freeShippingThreshold: null as number | null,
    estimatedDays: ''
  })

  // =================
  // UTILITY FUNCTIONS
  // =================

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 5000)
  }

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  // =================
  // API FUNCTIONS - FIXED
  // =================

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/shipping/zones')
      if (response.ok) {
        const data = await response.json()
        setZones(data.zones || [])
        setUnassigned(data.unassignedCountries || [])
      }
    } catch (error) {
      showError('Failed to refresh shipping data')
    } finally {
      setIsLoading(false)
    }
  }

  const createShippingZone = async () => {
    if (!newZoneForm.name.trim()) {
      showError('Zone name is required')
      return
    }

    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch('/api/admin/shipping/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZoneForm)
      })

      if (response.ok) {
        const data = await response.json()
        setZones(prev => [...prev, data.zone])
        setNewZoneForm({ name: '', description: '', isDefault: false })
        setShowCreateZone(false)
        showSuccess('Shipping zone created successfully')
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to create shipping zone')
      }
    } catch (error) {
      showError('Network error while creating shipping zone')
    } finally {
      setIsLoading(false)
    }
  }

  // FIXED: Update shipping zone function
  const updateShippingZone = async (zoneId: string) => {
    if (!editZoneForm.name.trim()) {
      showError('Zone name is required')
      return
    }

    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/admin/shipping/zones/${zoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editZoneForm)
      })

      if (response.ok) {
        const data = await response.json()
        setZones(prev => prev.map(zone => 
          zone.id === zoneId ? data.zone : zone
        ))
        setEditingZone(null)
        showSuccess('Shipping zone updated successfully')
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to update shipping zone')
      }
    } catch (error) {
      showError('Network error while updating shipping zone')
    } finally {
      setIsLoading(false)
    }
  }

  // FIXED: Delete shipping zone function
  const deleteShippingZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this shipping zone? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/admin/shipping/zones/${zoneId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        setZones(prev => prev.filter(zone => zone.id !== zoneId))
        if (data.unassignedCountries) {
          setUnassigned(data.unassignedCountries)
        }
        showSuccess('Shipping zone deleted successfully')
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to delete shipping zone')
      }
    } catch (error) {
      showError('Network error while deleting shipping zone')
    } finally {
      setIsLoading(false)
    }
  }

  const createShippingRate = async (zoneId: string) => {
    if (!newRateForm.name.trim() || newRateForm.flatRate < 0) {
      showError('Rate name and valid flat rate are required')
      return
    }

    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/admin/shipping/zones/${zoneId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRateForm,
          estimatedDays: newRateForm.estimatedDays || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setZones(prev => prev.map(zone => 
          zone.id === zoneId 
            ? { ...zone, shippingRates: [...zone.shippingRates, data.rate] }
            : zone
        ))
        setNewRateForm({ name: '', flatRate: 0, freeShippingThreshold: null, estimatedDays: '' })
        setShowCreateRate(null)
        showSuccess('Shipping rate created successfully')
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to create shipping rate')
      }
    } catch (error) {
      showError('Network error while creating shipping rate')
    } finally {
      setIsLoading(false)
    }
  }

  // FIXED: Start editing zone
  const startEditingZone = (zone: ShippingZone) => {
    setEditZoneForm({
      name: zone.name,
      description: zone.description || '',
      isDefault: zone.isDefault
    })
    setEditingZone(zone.id)
  }

  const cancelEditingZone = () => {
    setEditingZone(null)
    setEditZoneForm({ name: '', description: '', isDefault: false })
  }

  // FIXED: Shipping rate edit/delete functions
  const startEditingRate = (rate: ShippingRate) => {
    setEditRateForm({
      name: rate.name,
      flatRate: rate.flatRate,
      freeShippingThreshold: rate.freeShippingThreshold,
      estimatedDays: rate.estimatedDays || ''
    })
    setEditingRate(rate.id)
  }

  const cancelEditingRate = () => {
    setEditingRate(null)
    setEditRateForm({ name: '', flatRate: 0, freeShippingThreshold: null, estimatedDays: '' })
  }

  const updateShippingRate = async (zoneId: string, rateId: string) => {
    if (!editRateForm.name.trim() || editRateForm.flatRate < 0) {
      showError('Rate name and valid flat rate are required')
      return
    }

    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/admin/shipping/zones/${zoneId}/rates?rateId=${rateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRateForm)
      })

      if (response.ok) {
        const data = await response.json()
        setZones(prev => prev.map(zone => 
          zone.id === zoneId 
            ? { 
                ...zone, 
                shippingRates: zone.shippingRates.map(rate => 
                  rate.id === rateId ? data.rate : rate
                )
              }
            : zone
        ))
        setEditingRate(null)
        showSuccess('Shipping rate updated successfully')
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to update shipping rate')
      }
    } catch (error) {
      showError('Network error while updating shipping rate')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteShippingRate = async (zoneId: string, rateId: string, rateName: string) => {
    if (!confirm(`Are you sure you want to delete the shipping rate "${rateName}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/admin/shipping/zones/${zoneId}/rates?rateId=${rateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        setZones(prev => prev.map(zone => 
          zone.id === zoneId 
            ? { 
                ...zone, 
                shippingRates: zone.shippingRates.filter(rate => rate.id !== rateId)
              }
            : zone
        ))
        showSuccess(`Shipping rate "${rateName}" deleted successfully`)
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to delete shipping rate')
      }
    } catch (error) {
      showError('Network error while deleting shipping rate')
    } finally {
      setIsLoading(false)
    }
  }

  // =================
  // RENDER FUNCTIONS - FIXED
  // =================

  // FIXED: Complete renderZoneCard function
  const renderZoneCard = (zone: ShippingZone) => (
    <Card key={zone.id} className={`${zone.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-600" />
              {editingZone === zone.id ? (
                <Input
                  value={editZoneForm.name}
                  onChange={(e) => setEditZoneForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-auto py-1 px-2 text-lg font-semibold"
                  placeholder="Zone name"
                />
              ) : (
                zone.name
              )}
              {zone.isDefault && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Star className="h-3 w-3" />
                  Default
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {editingZone === zone.id ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateShippingZone(zone.id)}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditingZone}
                  disabled={isLoading}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditingZone(zone)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteShippingZone(zone.id)}
                  disabled={isLoading || zone.isDefault}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {editingZone === zone.id ? (
          <div className="mt-2">
            <Input
              value={editZoneForm.description}
              onChange={(e) => setEditZoneForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Zone description (optional)"
              className="text-sm"
            />
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id={`edit-default-${zone.id}`}
                checked={editZoneForm.isDefault}
                onChange={(e) => setEditZoneForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor={`edit-default-${zone.id}`} className="text-sm">Set as default shipping zone</Label>
            </div>
          </div>
        ) : (
          zone.description && (
            <p className="text-sm text-gray-600">{zone.description}</p>
          )
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countries */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Countries ({zone.countries.length})</h4>
          <div className="flex flex-wrap gap-2">
            {zone.countries.length > 0 ? (
              zone.countries.map(country => (
                <span
                  key={country.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {country.code} - {country.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No countries assigned</span>
            )}
          </div>
        </div>

        {/* Shipping Rates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Shipping Rates ({zone.shippingRates.length})</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateRate(zone.id)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rate
            </Button>
          </div>
          <div className="space-y-2">
            {zone.shippingRates.length > 0 ? (
              zone.shippingRates.map(rate => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    {editingRate === rate.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            value={editRateForm.name}
                            onChange={(e) => setEditRateForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Rate name"
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editRateForm.flatRate}
                            onChange={(e) => setEditRateForm(prev => ({ ...prev, flatRate: parseFloat(e.target.value) || 0 }))}
                            placeholder="Flat rate"
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editRateForm.freeShippingThreshold || ''}
                            onChange={(e) => setEditRateForm(prev => ({ 
                              ...prev, 
                              freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : null 
                            }))}
                            placeholder="Free shipping threshold (optional)"
                            className="text-sm"
                          />
                          <Input
                            value={editRateForm.estimatedDays}
                            onChange={(e) => setEditRateForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                            placeholder="Estimated delivery"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rate.name}</span>
                          <span className="text-sm text-gray-600">${rate.flatRate.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {rate.freeShippingThreshold && (
                            <span>Free shipping over ${rate.freeShippingThreshold.toFixed(2)} • </span>
                          )}
                          {rate.estimatedDays && (
                            <span>{rate.estimatedDays}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {editingRate === rate.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateShippingRate(zone.id, rate.id)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={cancelEditingRate}
                          disabled={isLoading}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEditingRate(rate)}
                          disabled={isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteShippingRate(zone.id, rate.id, rate.name)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                No shipping rates configured
              </div>
            )}
          </div>
        </div>

        {/* Add Rate Form */}
        {showCreateRate === zone.id && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Add Shipping Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rateName">Rate Name</Label>
                  <Input
                    id="rateName"
                    placeholder="e.g., Standard, Express"
                    value={newRateForm.name}
                    onChange={(e) => setNewRateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="flatRate">Flat Rate ($)</Label>
                  <Input
                    id="flatRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newRateForm.flatRate}
                    onChange={(e) => setNewRateForm(prev => ({ ...prev, flatRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    value={newRateForm.freeShippingThreshold || ''}
                    onChange={(e) => setNewRateForm(prev => ({ 
                      ...prev, 
                      freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedDays">Estimated Delivery</Label>
                  <Input
                    id="estimatedDays"
                    placeholder="e.g., 3-5 business days"
                    value={newRateForm.estimatedDays}
                    onChange={(e) => setNewRateForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => createShippingRate(zone.id)}
                  disabled={isLoading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Rate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateRate(null)}
                  disabled={isLoading}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )

  const renderCreateZoneForm = () => (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Create New Shipping Zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zoneName">Zone Name</Label>
            <Input
              id="zoneName"
              placeholder="e.g., USA Domestic, International"
              value={newZoneForm.name}
              onChange={(e) => setNewZoneForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="zoneDescription">Description</Label>
            <Input
              id="zoneDescription"
              placeholder="Optional description"
              value={newZoneForm.description}
              onChange={(e) => setNewZoneForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={newZoneForm.isDefault}
            onChange={(e) => setNewZoneForm(prev => ({ ...prev, isDefault: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="isDefault">Set as default shipping zone</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={createShippingZone}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? 'Creating...' : 'Create Zone'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCreateZone(false)}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderUnassignedCountries = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-orange-600" />
          Unassigned Countries ({unassigned.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unassigned.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              These countries are not assigned to any shipping zone and will use default rates.
            </p>
            <div className="flex flex-wrap gap-2">
              {unassigned.map(country => (
                <span
                  key={country.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800"
                >
                  {country.code} - {country.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-600">All countries are assigned to shipping zones</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderStoreSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          Store Shipping Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Default Shipping Zone</Label>
          <div className="mt-2">
            {storeSettings?.defaultShippingZone ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <span className="font-medium">{storeSettings.defaultShippingZone.name}</span>
                  <p className="text-sm text-gray-600">
                    Used for countries not assigned to specific zones
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-gray-600">No default zone set</span>
                  <p className="text-sm text-gray-500">
                    Hardcoded rates will be used as fallback
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Set Default
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // =================
  // MAIN RENDER - FIXED
  // =================

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Shipping Zones ({zones.length})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <Button
          onClick={() => setShowCreateZone(true)}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Shipping Zone
        </Button>
      </div>

      {/* Create Zone Form */}
      {showCreateZone && renderCreateZoneForm()}

      {/* Shipping Zones */}
      <div className="grid gap-6">
        {zones.length > 0 ? (
          zones.map(zone => renderZoneCard(zone))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipping Zones</h3>
              <p className="text-gray-600 mb-4">
                Create your first shipping zone to start configuring shipping rates.
              </p>
              <Button onClick={() => setShowCreateZone(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Zone
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Unassigned Countries */}
      {renderUnassignedCountries()}

      {/* Store Settings */}
      {renderStoreSettings()}
    </div>
  )
}