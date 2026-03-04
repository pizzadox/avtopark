'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Truck, 
  Building2, 
  Users, 
  Wrench, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Loader2,
  Car,
  User,
  Phone,
  MapPin,
  FileText,
  Palette,
  Download,
  Upload,
  FileJson
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DataManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Vehicle Types
interface VehicleType {
  id: string
  name: string
  icon?: string
  sortOrder: number
  _count?: { vehicles: number }
}

// Owners
interface Owner {
  id: string
  name: string
  phone?: string
  address?: string
  notes?: string
  _count?: { vehicles: number }
}

// Tenants
interface Tenant {
  id: string
  name: string
  phone?: string
  address?: string
  notes?: string
  _count?: { vehicles: number }
}

// Repair Statuses
interface RepairStatus {
  id: string
  name: string
  color: string
  icon?: string
  sortOrder: number
  isDefault: boolean
  isCompleted: boolean
  isActive: boolean
  _count?: { repairs: number }
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'
]

export function DataManagementDialog({ open, onOpenChange }: DataManagementDialogProps) {
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('vehicleTypes')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Data states
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [repairStatuses, setRepairStatuses] = useState<RepairStatus[]>([])
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  
  // New item states
  const [newVehicleType, setNewVehicleType] = useState({ name: '', icon: '🚗' })
  const [newOwner, setNewOwner] = useState({ name: '', phone: '', address: '', notes: '' })
  const [newTenant, setNewTenant] = useState({ name: '', phone: '', address: '', notes: '' })
  const [newRepairStatus, setNewRepairStatus] = useState({ 
    name: '', color: '#3b82f6', icon: '🔧', isDefault: false, isCompleted: false 
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Export function
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/export')
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `repair-journal-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: 'Успешно', description: 'Данные экспортированы' })
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось экспортировать данные', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка при экспорте', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  // Import function
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        const result = await res.json()
        toast({ 
          title: 'Успешно', 
          description: `Импортировано: ${result.vehicles || 0} ТС, ${result.repairs || 0} ремонтов, ${result.owners || 0} владельцев, ${result.tenants || 0} арендаторов` 
        })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error || 'Не удалось импортировать данные', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Неверный формат файла', variant: 'destructive' })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  useEffect(() => {
    if (open) {
      fetchAllData()
    }
  }, [open])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [typesRes, ownersRes, tenantsRes, statusesRes] = await Promise.all([
        fetch('/api/vehicle-types'),
        fetch('/api/owners'),
        fetch('/api/tenants'),
        fetch('/api/repair-statuses')
      ])
      
      if (typesRes.ok) setVehicleTypes(await typesRes.json())
      if (ownersRes.ok) setOwners(await ownersRes.json())
      if (tenantsRes.ok) setTenants(await tenantsRes.json())
      if (statusesRes.ok) setRepairStatuses(await statusesRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Vehicle Types CRUD
  const handleCreateVehicleType = async () => {
    if (!newVehicleType.name) {
      toast({ title: 'Ошибка', description: 'Введите название типа', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vehicle-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newVehicleType, sortOrder: vehicleTypes.length })
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Тип транспорта добавлен' })
        setNewVehicleType({ name: '', icon: '🚗' })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать тип', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateVehicleType = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/vehicle-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData })
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Тип обновлен' })
        setEditingId(null)
        setEditData({})
        fetchAllData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVehicleType = async (id: string) => {
    if (!confirm('Удалить тип транспорта?')) return
    try {
      const res = await fetch(`/api/vehicle-types?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Тип удален' })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' })
    }
  }

  // Owners CRUD
  const handleCreateOwner = async () => {
    if (!newOwner.name) {
      toast({ title: 'Ошибка', description: 'Введите название владельца', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOwner)
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Владелец добавлен' })
        setNewOwner({ name: '', phone: '', address: '', notes: '' })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать владельца', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateOwner = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/owners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData })
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Владелец обновлен' })
        setEditingId(null)
        setEditData({})
        fetchAllData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOwner = async (id: string) => {
    if (!confirm('Удалить владельца?')) return
    try {
      const res = await fetch(`/api/owners?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Владелец удален' })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' })
    }
  }

  // Tenants CRUD
  const handleCreateTenant = async () => {
    if (!newTenant.name) {
      toast({ title: 'Ошибка', description: 'Введите название арендатора', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Арендатор добавлен' })
        setNewTenant({ name: '', phone: '', address: '', notes: '' })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать арендатора', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTenant = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData })
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Арендатор обновлен' })
        setEditingId(null)
        setEditData({})
        fetchAllData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Удалить арендатора?')) return
    try {
      const res = await fetch(`/api/tenants?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Арендатор удален' })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' })
    }
  }

  // Repair Statuses CRUD
  const handleCreateRepairStatus = async () => {
    if (!newRepairStatus.name) {
      toast({ title: 'Ошибка', description: 'Введите название статуса', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/repair-statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRepairStatus, sortOrder: repairStatuses.length })
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Статус добавлен' })
        setNewRepairStatus({ name: '', color: '#3b82f6', icon: '🔧', isDefault: false, isCompleted: false })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать статус', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRepairStatus = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/repair-statuses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData })
      })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Статус обновлен' })
        setEditingId(null)
        setEditData({})
        fetchAllData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRepairStatus = async (id: string) => {
    if (!confirm('Удалить статус?')) return
    try {
      const res = await fetch(`/api/repair-statuses?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Статус удален' })
        fetchAllData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Управление данными
          </DialogTitle>
          <DialogDescription>
            Настройка справочников: типы транспорта, владельцы, арендаторы, статусы ремонта
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vehicleTypes" className="gap-1">
              <Truck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Типы</span>
            </TabsTrigger>
            <TabsTrigger value="owners" className="gap-1">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Владельцы</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Арендаторы</span>
            </TabsTrigger>
            <TabsTrigger value="statuses" className="gap-1">
              <Wrench className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Статусы</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1">
              <FileJson className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Данные</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Vehicle Types Tab */}
            <TabsContent value="vehicleTypes" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Новый тип транспорта
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Эмодзи"
                      value={newVehicleType.icon}
                      onChange={(e) => setNewVehicleType({ ...newVehicleType, icon: e.target.value })}
                      className="w-20 text-center text-lg"
                      maxLength={2}
                    />
                    <Input
                      placeholder="Название типа"
                      value={newVehicleType.name}
                      onChange={(e) => setNewVehicleType({ ...newVehicleType, name: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={handleCreateVehicleType} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Типы транспорта ({vehicleTypes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-1">
                      {vehicleTypes.map(type => (
                        <div key={type.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                          {editingId === type.id ? (
                            <>
                              <Input
                                value={editData.icon || type.icon || ''}
                                onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                                className="w-14 text-center text-lg"
                                maxLength={2}
                              />
                              <Input
                                value={editData.name || type.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                className="flex-1"
                              />
                              <Button size="sm" onClick={() => handleUpdateVehicleType(type.id)} disabled={saving}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData({}) }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-lg w-8 text-center">{type.icon || '🚗'}</span>
                              <span className="flex-1 font-medium">{type.name}</span>
                              <Badge variant="secondary">{type._count?.vehicles || 0}</Badge>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(type.id); setEditData({ name: type.name, icon: type.icon }) }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteVehicleType(type.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Owners Tab */}
            <TabsContent value="owners" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Новый владелец
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Название"
                      value={newOwner.name}
                      onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                    />
                    <Input
                      placeholder="Телефон"
                      value={newOwner.phone}
                      onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Адрес"
                    value={newOwner.address}
                    onChange={(e) => setNewOwner({ ...newOwner, address: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Примечания"
                      value={newOwner.notes}
                      onChange={(e) => setNewOwner({ ...newOwner, notes: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={handleCreateOwner} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Владельцы ({owners.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {owners.map(owner => (
                        <div key={owner.id} className="p-2 rounded-lg hover:bg-muted border">
                          {editingId === owner.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={editData.name || owner.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                                <Input value={editData.phone || owner.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} placeholder="Телефон" />
                              </div>
                              <Input value={editData.address || owner.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} placeholder="Адрес" />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleUpdateOwner(owner.id)} disabled={saving}>
                                  <Save className="h-4 w-4 mr-1" /> Сохранить
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData({}) }}>
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{owner.name}</p>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  {owner.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{owner.phone}</span>}
                                  {owner.address && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{owner.address}</span>}
                                </div>
                              </div>
                              <Badge variant="secondary">{owner._count?.vehicles || 0}</Badge>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(owner.id); setEditData(owner) }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteOwner(owner.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tenants Tab */}
            <TabsContent value="tenants" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Новый арендатор
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Название"
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    />
                    <Input
                      placeholder="Телефон"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Адрес"
                    value={newTenant.address}
                    onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Примечания"
                      value={newTenant.notes}
                      onChange={(e) => setNewTenant({ ...newTenant, notes: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={handleCreateTenant} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Арендаторы ({tenants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {tenants.map(tenant => (
                        <div key={tenant.id} className="p-2 rounded-lg hover:bg-muted border">
                          {editingId === tenant.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={editData.name || tenant.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                                <Input value={editData.phone || tenant.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} placeholder="Телефон" />
                              </div>
                              <Input value={editData.address || tenant.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} placeholder="Адрес" />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleUpdateTenant(tenant.id)} disabled={saving}>
                                  <Save className="h-4 w-4 mr-1" /> Сохранить
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData({}) }}>
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{tenant.name}</p>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  {tenant.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tenant.phone}</span>}
                                  {tenant.address && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{tenant.address}</span>}
                                </div>
                              </div>
                              <Badge variant="secondary">{tenant._count?.vehicles || 0}</Badge>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(tenant.id); setEditData(tenant) }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteTenant(tenant.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Repair Statuses Tab */}
            <TabsContent value="statuses" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Новый статус ремонта
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="🔧"
                      value={newRepairStatus.icon}
                      onChange={(e) => setNewRepairStatus({ ...newRepairStatus, icon: e.target.value })}
                      className="w-14 text-center text-lg"
                      maxLength={2}
                    />
                    <Input
                      placeholder="Название статуса"
                      value={newRepairStatus.name}
                      onChange={(e) => setNewRepairStatus({ ...newRepairStatus, name: e.target.value })}
                      className="flex-1"
                    />
                    <div className="flex gap-1">
                      {PRESET_COLORS.slice(0, 5).map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full border-2 ${newRepairStatus.color === color ? 'border-primary' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewRepairStatus({ ...newRepairStatus, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newRepairStatus.isDefault}
                        onCheckedChange={(v) => setNewRepairStatus({ ...newRepairStatus, isDefault: v })}
                      />
                      <span className="text-sm">По умолчанию</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newRepairStatus.isCompleted}
                        onCheckedChange={(v) => setNewRepairStatus({ ...newRepairStatus, isCompleted: v })}
                      />
                      <span className="text-sm">Завершенный</span>
                    </div>
                    <Button onClick={handleCreateRepairStatus} disabled={saving} className="ml-auto">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Статусы ремонта ({repairStatuses.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-1">
                      {repairStatuses.map(status => (
                        <div key={status.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                          {editingId === status.id ? (
                            <>
                              <Input
                                value={editData.icon || status.icon || ''}
                                onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                                className="w-12 text-center text-lg"
                                maxLength={2}
                              />
                              <Input
                                value={editData.name || status.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                className="flex-1"
                              />
                              <div className="flex gap-1">
                                {PRESET_COLORS.slice(0, 5).map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`w-5 h-5 rounded-full border ${editData.color === color ? 'border-primary' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setEditData({ ...editData, color })}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-1">
                                <Switch
                                  checked={editData.isDefault || false}
                                  onCheckedChange={(v) => setEditData({ ...editData, isDefault: v })}
                                  title="По умолчанию"
                                />
                                <Switch
                                  checked={editData.isCompleted || false}
                                  onCheckedChange={(v) => setEditData({ ...editData, isCompleted: v })}
                                  title="Завершен"
                                />
                              </div>
                              <Button size="sm" onClick={() => handleUpdateRepairStatus(status.id)} disabled={saving}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData({}) }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-lg w-8 text-center">{status.icon || '📋'}</span>
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              <span className="flex-1 font-medium">{status.name}</span>
                              <div className="flex gap-1">
                                {status.isDefault && <Badge variant="outline" className="text-xs">По умолчанию</Badge>}
                                {status.isCompleted && <Badge variant="secondary" className="text-xs">Завершен</Badge>}
                                {!status.isActive && <Badge variant="destructive" className="text-xs">Неактивен</Badge>}
                              </div>
                              <Badge variant="secondary">{status._count?.repairs || 0}</Badge>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(status.id); setEditData({ name: status.name, icon: status.icon, color: status.color, isDefault: status.isDefault, isCompleted: status.isCompleted }) }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteRepairStatus(status.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Export/Import Tab */}
            <TabsContent value="data" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Экспорт данных
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Выгрузите все данные из базы данных в JSON файл для резервного копирования или переноса.
                  </p>
                  <Button 
                    onClick={handleExport} 
                    disabled={isExporting}
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Экспортировать данные
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Импорт данных
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Загрузите данные из JSON файла. Существующие данные будут обновлены или добавлены.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                  />
                  <Button 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Выбрать файл для импорта
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ При импорте существующие записи с совпадающими идентификаторами будут обновлены.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
