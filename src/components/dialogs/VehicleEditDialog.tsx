'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Truck, 
  Save, 
  X, 
  Loader2, 
  Plus,
  Building2,
  User,
  Car,
  Hash,
  Gauge,
  Calendar,
  Satellite
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Vehicle type based on Prisma schema
interface Vehicle {
  id?: string
  brand: string
  regNumber: string
  ownerId?: string | null
  tenantId?: string | null
  owner: string
  tenant?: string | null
  hasGlonass: boolean
  vehicleTypeId?: string | null
  vehicleType: string
  vin?: string | null
  mileage?: string | null
  techInspection?: string | null
  ptsImage?: string | null
  ownerRel?: { id: string; name: string } | null
  tenantRel?: { id: string; name: string } | null
  vehicleTypeRel?: { id: string; name: string; icon?: string } | null
}

interface VehicleEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
  onSave: (vehicle: any) => void
}

// Owner type
interface Owner {
  id: string
  name: string
  phone?: string
  address?: string
}

// Tenant type
interface Tenant {
  id: string
  name: string
  phone?: string
  address?: string
}

// Vehicle Type type
interface VehicleType {
  id: string
  name: string
  icon?: string
}

const emptyVehicle: Vehicle = {
  brand: '',
  regNumber: '',
  ownerId: null,
  tenantId: null,
  owner: '',
  tenant: '',
  hasGlonass: false,
  vehicleTypeId: null,
  vehicleType: '',
  vin: '',
  mileage: '',
  techInspection: '',
}

export function VehicleEditDialog({ open, onOpenChange, vehicle, onSave }: VehicleEditDialogProps) {
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Reference data
  const [owners, setOwners] = useState<Owner[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  
  // Form data
  const [formData, setFormData] = useState<Vehicle>(emptyVehicle)
  
  // New item inputs for inline creation
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newTenantName, setNewTenantName] = useState('')
  const [showNewOwnerInput, setShowNewOwnerInput] = useState(false)
  const [showNewTenantInput, setShowNewTenantInput] = useState(false)
  const [creatingOwner, setCreatingOwner] = useState(false)
  const [creatingTenant, setCreatingTenant] = useState(false)

  useEffect(() => {
    if (open) {
      fetchReferenceData()
      if (vehicle) {
        setFormData({
          ...vehicle,
          ownerId: vehicle.ownerId || vehicle.ownerRel?.id || null,
          tenantId: vehicle.tenantId || vehicle.tenantRel?.id || null,
          vehicleTypeId: vehicle.vehicleTypeId || vehicle.vehicleTypeRel?.id || null,
        })
      } else {
        setFormData(emptyVehicle)
      }
    }
  }, [open, vehicle])

  const fetchReferenceData = async () => {
    setLoading(true)
    try {
      const [ownersRes, tenantsRes, typesRes] = await Promise.all([
        fetch('/api/owners'),
        fetch('/api/tenants'),
        fetch('/api/vehicle-types')
      ])
      
      if (ownersRes.ok) setOwners(await ownersRes.json())
      if (tenantsRes.ok) setTenants(await tenantsRes.json())
      if (typesRes.ok) setVehicleTypes(await typesRes.json())
    } catch (error) {
      console.error('Error fetching reference data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOwner = async () => {
    if (!newOwnerName.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название владельца', variant: 'destructive' })
      return
    }
    
    setCreatingOwner(true)
    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOwnerName.trim() })
      })
      
      if (res.ok) {
        const newOwner = await res.json()
        setOwners(prev => [...prev, newOwner])
        setFormData(prev => ({
          ...prev,
          ownerId: newOwner.id,
          owner: newOwner.name
        }))
        setNewOwnerName('')
        setShowNewOwnerInput(false)
        toast({ title: 'Успешно', description: 'Владелец создан' })
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать владельца', variant: 'destructive' })
    } finally {
      setCreatingOwner(false)
    }
  }

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название арендатора', variant: 'destructive' })
      return
    }
    
    setCreatingTenant(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTenantName.trim() })
      })
      
      if (res.ok) {
        const newTenant = await res.json()
        setTenants(prev => [...prev, newTenant])
        setFormData(prev => ({
          ...prev,
          tenantId: newTenant.id,
          tenant: newTenant.name
        }))
        setNewTenantName('')
        setShowNewTenantInput(false)
        toast({ title: 'Успешно', description: 'Арендатор создан' })
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать арендатора', variant: 'destructive' })
    } finally {
      setCreatingTenant(false)
    }
  }

  const handleSave = async () => {
    // Validation
    if (!formData.brand.trim()) {
      toast({ title: 'Ошибка', description: 'Введите марку транспорта', variant: 'destructive' })
      return
    }
    if (!formData.regNumber.trim()) {
      toast({ title: 'Ошибка', description: 'Введите рег. номер', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      // Find selected names for denormalized fields
      const selectedOwner = owners.find(o => o.id === formData.ownerId)
      const selectedTenant = tenants.find(t => t.id === formData.tenantId)
      const selectedType = vehicleTypes.find(t => t.id === formData.vehicleTypeId)
      
      const vehicleData = {
        ...formData,
        owner: selectedOwner?.name || formData.owner || '',
        tenant: selectedTenant?.name || formData.tenant || '',
        vehicleType: selectedType?.name || formData.vehicleType || '',
      }
      
      await onSave(vehicleData)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(emptyVehicle)
    setNewOwnerName('')
    setNewTenantName('')
    setShowNewOwnerInput(false)
    setShowNewTenantInput(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {vehicle ? 'Редактирование транспорта' : 'Новый транспорт'}
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о транспортном средстве
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-2">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Марка *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="КамАЗ, МАЗ, ГАЗ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Рег. номер *</Label>
                    <Input
                      id="regNumber"
                      value={formData.regNumber}
                      onChange={(e) => setFormData({ ...formData, regNumber: e.target.value.toUpperCase() })}
                      placeholder="А 000 АА 00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Тип транспорта</Label>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Загрузка...
                    </div>
                  ) : (
                    <Select
                      value={formData.vehicleTypeId || 'none'}
                      onValueChange={(v) => {
                        const type = vehicleTypes.find(t => t.id === v)
                        setFormData({
                          ...formData,
                          vehicleTypeId: v === 'none' ? null : v,
                          vehicleType: type?.name || ''
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не указан</SelectItem>
                        {vehicleTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.icon && <span className="mr-1">{type.icon}</span>}
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Owner Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Собственник
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </div>
                ) : (
                  <>
                    <Select
                      value={formData.ownerId || 'none'}
                      onValueChange={(v) => {
                        const owner = owners.find(o => o.id === v)
                        setFormData({
                          ...formData,
                          ownerId: v === 'none' ? null : v,
                          owner: owner?.name || ''
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите собственника" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не указан</SelectItem>
                        {owners.map(owner => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {!showNewOwnerInput ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowNewOwnerInput(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить нового собственника
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={newOwnerName}
                          onChange={(e) => setNewOwnerName(e.target.value)}
                          placeholder="Название собственника"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateOwner()
                            if (e.key === 'Escape') {
                              setShowNewOwnerInput(false)
                              setNewOwnerName('')
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateOwner}
                          disabled={creatingOwner || !newOwnerName.trim()}
                        >
                          {creatingOwner ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowNewOwnerInput(false)
                            setNewOwnerName('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tenant Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Арендатор
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </div>
                ) : (
                  <>
                    <Select
                      value={formData.tenantId || 'none'}
                      onValueChange={(v) => {
                        const tenant = tenants.find(t => t.id === v)
                        setFormData({
                          ...formData,
                          tenantId: v === 'none' ? null : v,
                          tenant: tenant?.name || ''
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите арендатора" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не указан</SelectItem>
                        {tenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {!showNewTenantInput ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowNewTenantInput(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить нового арендатора
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={newTenantName}
                          onChange={(e) => setNewTenantName(e.target.value)}
                          placeholder="Название арендатора"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateTenant()
                            if (e.key === 'Escape') {
                              setShowNewTenantInput(false)
                              setNewTenantName('')
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateTenant}
                          disabled={creatingTenant || !newTenantName.trim()}
                        >
                          {creatingTenant ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowNewTenantInput(false)
                            setNewTenantName('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Technical Info Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Техническая информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN номер</Label>
                    <Input
                      id="vin"
                      value={formData.vin || ''}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      placeholder="VIN код"
                      maxLength={17}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5" />
                        Пробег
                      </div>
                    </Label>
                    <Input
                      id="mileage"
                      value={formData.mileage || ''}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      placeholder="км"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="techInspection">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Тех. осмотр
                    </div>
                  </Label>
                  <Input
                    id="techInspection"
                    value={formData.techInspection || ''}
                    onChange={(e) => setFormData({ ...formData, techInspection: e.target.value })}
                    placeholder="Дата или срок действия"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Satellite className="h-4 w-4" />
                      ЭРО ГЛОНАСС
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Наличие оборудования ЭРО ГЛОНАСС
                    </p>
                  </div>
                  <Switch
                    checked={formData.hasGlonass}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasGlonass: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
