'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Truck,
  Wrench,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Gauge,
  FileText,
  Package,
  Settings,
  Save,
  X,
  Loader2,
  Hammer,
  Cog,
  Search,
  ClipboardList,
  Boxes,
  ChevronRight,
  Building2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'

// Types
interface RepairStatus {
  id: string
  name: string
  color: string
  icon?: string | null
  sortOrder: number
  isDefault: boolean
  isCompleted: boolean
  isActive: boolean
}

interface Repair {
  id: string
  entryDate: string
  exitDate: string | null
  vehicleId: string
  regNumber: string
  vehicleInfo: string | null
  malfunction: string
  welding: boolean
  lathe: boolean
  repair: boolean
  diagnostics: boolean
  defectation: boolean
  spareParts: boolean
  downtimeDays: number
  downtimeHours: number
  downtimeMinutes: number
  priority: string
  workDescription: string | null
  sparePartsInfo: string | null
  statusId?: string | null
  status: string
  mileage: string | null
  notes: string | null
  masterId?: string | null
  masterName?: string | null
  vehicle?: {
    brand: string
    vehicleType: string
    owner: string
    tenant?: string | null
  }
}

interface RepairDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repair: Repair | null
  onUpdate: (repair: any) => void
  repairStatuses: RepairStatus[]
}

const PRIORITIES = [
  { value: 'Низкий', color: '#6b7280', bgColor: 'bg-gray-100', label: 'Низкий' },
  { value: 'Обычный', color: '#3b82f6', bgColor: 'bg-blue-100', label: 'Обычный' },
  { value: 'Высокий', color: '#f97316', bgColor: 'bg-orange-100', label: 'Высокий' },
  { value: 'Срочный', color: '#ef4444', bgColor: 'bg-red-100', label: 'Срочный' },
]

const WORK_TYPES = [
  { key: 'welding', label: 'Сварка', icon: Hammer, shortLabel: 'Сварка' },
  { key: 'lathe', label: 'Токарные', icon: Settings, shortLabel: 'Токарные' },
  { key: 'repair', label: 'Ремонт', icon: Wrench, shortLabel: 'Ремонт' },
  { key: 'diagnostics', label: 'Диагностика', icon: Search, shortLabel: 'Диагн.' },
  { key: 'defectation', label: 'Дефектовка', icon: ClipboardList, shortLabel: 'Дефект.' },
  { key: 'spareParts', label: 'Запчасти', icon: Boxes, shortLabel: 'Запчасти' },
]

export function RepairDetailDialog({ 
  open, 
  onOpenChange, 
  repair, 
  onUpdate,
  repairStatuses 
}: RepairDetailDialogProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [saving, setSaving] = useState(false)
  
  // Form state for editable fields
  const [formData, setFormData] = useState({
    statusId: '',
    priority: '',
    workDescription: '',
    sparePartsInfo: '',
    mileage: '',
    notes: '',
    welding: false,
    lathe: false,
    repair: false,
    diagnostics: false,
    defectation: false,
    spareParts: false,
    downtimeDays: 0,
    downtimeHours: 0,
    downtimeMinutes: 0,
  })

  // Initialize form data when repair changes
  useEffect(() => {
    if (repair) {
      setFormData({
        statusId: repair.statusId || '',
        priority: repair.priority || 'Обычный',
        workDescription: repair.workDescription || '',
        sparePartsInfo: repair.sparePartsInfo || '',
        mileage: repair.mileage || '',
        notes: repair.notes || '',
        welding: repair.welding,
        lathe: repair.lathe,
        repair: repair.repair,
        diagnostics: repair.diagnostics,
        defectation: repair.defectation,
        spareParts: repair.spareParts,
        downtimeDays: repair.downtimeDays,
        downtimeHours: repair.downtimeHours,
        downtimeMinutes: repair.downtimeMinutes,
      })
    }
  }, [repair])

  // Handle save
  const handleSave = async () => {
    if (!repair) return
    
    setSaving(true)
    try {
      const statusObj = repairStatuses.find(s => s.id === formData.statusId)
      
      const res = await fetch('/api/repairs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: repair.id,
          statusId: formData.statusId || null,
          status: statusObj?.name || repair.status,
          priority: formData.priority,
          workDescription: formData.workDescription || null,
          sparePartsInfo: formData.sparePartsInfo || null,
          mileage: formData.mileage || null,
          notes: formData.notes || null,
          welding: formData.welding,
          lathe: formData.lathe,
          repair: formData.repair,
          diagnostics: formData.diagnostics,
          defectation: formData.defectation,
          spareParts: formData.spareParts,
          downtimeDays: formData.downtimeDays,
          downtimeHours: formData.downtimeHours,
          downtimeMinutes: formData.downtimeMinutes,
          exitDate: statusObj?.isCompleted ? new Date().toISOString().split('T')[0] : null,
        })
      })
      
      if (res.ok) {
        const updatedRepair = await res.json()
        toast({ title: 'Сохранено', description: 'Данные обновлены' })
        onUpdate(updatedRepair)
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error || 'Не удалось сохранить', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить изменения', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Get current status info
  const getCurrentStatus = () => {
    return repairStatuses.find(s => s.id === formData.statusId) || 
           repairStatuses.find(s => s.name === repair?.status) ||
           { name: repair?.status || 'Не указан', color: '#6b7280' }
  }

  // Get current priority info
  const getCurrentPriority = () => {
    return PRIORITIES.find(p => p.value === formData.priority) || PRIORITIES[1]
  }

  if (!repair) return null

  const currentStatus = getCurrentStatus()
  const currentPriority = getCurrentPriority()

  // Mobile compact view
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full h-[100dvh] p-0 flex flex-col">
          {/* Compact Mobile Header */}
          <DialogHeader className="p-3 border-b bg-card shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-mono truncate">
                    {repair.regNumber}
                  </DialogTitle>
                  <DialogDescription className="text-xs truncate">
                    {repair.vehicle?.brand} • {formatDate(repair.entryDate)}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Status & Priority Badges Row */}
            <div className="flex items-center gap-2 mt-2">
              {/* Status Selector */}
              <Select 
                value={formData.statusId} 
                onValueChange={(value) => setFormData({ ...formData, statusId: value })}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: currentStatus.color }}
                    />
                    <span className="truncate">{currentStatus.name}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {repairStatuses.filter(s => s.isActive).map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        <span>{status.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Priority Selector */}
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="h-8 text-xs w-28">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: currentPriority.color }}
                    />
                    <span className="truncate">{currentPriority.label}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: priority.color }}
                        />
                        <span>{priority.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {/* Dates Row */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">Заезд</p>
                    <p className="text-sm font-medium truncate">{formatDate(repair.entryDate)}</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">Выезд</p>
                    <p className="text-sm font-medium truncate">{formatDate(repair.exitDate)}</p>
                  </div>
                </div>
              </div>

              {/* Owner & Tenant */}
              {(repair.vehicle?.owner || repair.vehicle?.tenant) && (
                <div className="flex gap-2">
                  {repair.vehicle?.owner && (
                    <div className="flex-1 flex items-center gap-2 p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                      <User className="h-4 w-4 text-purple-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-purple-600">Собственник</p>
                        <p className="text-sm font-medium truncate">{repair.vehicle.owner}</p>
                      </div>
                    </div>
                  )}
                  {repair.vehicle?.tenant && (
                    <div className="flex-1 flex items-center gap-2 p-2.5 bg-cyan-50 rounded-lg border border-cyan-200">
                      <Building2 className="h-4 w-4 text-cyan-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-cyan-600">Арендатор</p>
                        <p className="text-sm font-medium truncate">{repair.vehicle.tenant}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Malfunction */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                  Неисправность
                </Label>
                <div className="text-sm bg-orange-50 p-2.5 rounded-lg border border-orange-200 whitespace-pre-wrap">
                  {repair.malfunction}
                </div>
              </div>

              {/* Work Types - Compact Grid */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Cog className="h-3.5 w-3.5" />
                  Виды работ
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {WORK_TYPES.map((item) => {
                    const Icon = item.icon
                    const checked = formData[item.key as keyof typeof formData] as boolean
                    return (
                      <label 
                        key={item.key}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-all ${
                          checked 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, [item.key]: checked })
                          }
                          className="h-4 w-4"
                        />
                        <Icon className={`h-3.5 w-3.5 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-[10px] leading-tight text-center">{item.shortLabel}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Downtime */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Простой
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={formData.downtimeDays}
                      onChange={(e) => setFormData({ ...formData, downtimeDays: parseInt(e.target.value) || 0 })}
                      className="text-center h-9"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-center text-muted-foreground mt-0.5">дней</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.downtimeHours}
                      onChange={(e) => setFormData({ ...formData, downtimeHours: parseInt(e.target.value) || 0 })}
                      className="text-center h-9"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-center text-muted-foreground mt-0.5">часов</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={formData.downtimeMinutes}
                      onChange={(e) => setFormData({ ...formData, downtimeMinutes: parseInt(e.target.value) || 0 })}
                      className="text-center h-9"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-center text-muted-foreground mt-0.5">минут</p>
                  </div>
                </div>
              </div>

              {/* Work Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Описание работ
                </Label>
                <Textarea
                  placeholder="Описание выполненных работ..."
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              {/* Spare Parts */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Запчасти
                </Label>
                <Textarea
                  placeholder="Информация о запчастях..."
                  value={formData.sparePartsInfo}
                  onChange={(e) => setFormData({ ...formData, sparePartsInfo: e.target.value })}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>

              {/* Mileage & Master */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5" />
                    Пробег
                  </Label>
                  <Input
                    placeholder="км"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    className="h-9"
                  />
                </div>
                {repair.masterName && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Мастер
                    </Label>
                    <div className="h-9 px-3 flex items-center bg-muted/50 rounded-md">
                      <span className="text-sm truncate">{repair.masterName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Примечания
                </Label>
                <Textarea
                  placeholder="Примечания..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Fixed Footer */}
          <div className="p-3 border-t bg-card shrink-0">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-10"
              >
                Отмена
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 h-10"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Desktop view (existing)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{repair.regNumber}</span>
                  {repair.vehicle?.brand && (
                    <span className="text-muted-foreground font-normal">
                      ({repair.vehicle.brand})
                    </span>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                Запись о ремонте от {formatDate(repair.entryDate)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className="text-white font-medium"
                style={{ backgroundColor: currentStatus.color }}
              >
                {currentStatus.icon && <span className="mr-1">{currentStatus.icon}</span>}
                {currentStatus.name}
              </Badge>
              <Badge 
                className="text-white"
                style={{ backgroundColor: currentPriority.color }}
              >
                {currentPriority.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Status and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status Selector */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Статус ремонта
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={formData.statusId} 
                    onValueChange={(value) => setFormData({ ...formData, statusId: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      {repairStatuses.filter(s => s.isActive).map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: status.color }}
                            />
                            {status.icon && <span>{status.icon}</span>}
                            <span>{status.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Priority Selector */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Приоритет
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: priority.color }}
                            />
                            <span>{priority.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Dates Card */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Даты
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Дата заезда</p>
                    <p className="font-medium">{formatDate(repair.entryDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Дата выезда</p>
                    <p className="font-medium">{formatDate(repair.exitDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner & Tenant Card */}
            {(repair.vehicle?.owner || repair.vehicle?.tenant) && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Владельцы
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {repair.vehicle?.owner && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-600 font-medium">Собственник</p>
                        <p className="font-medium">{repair.vehicle.owner}</p>
                      </div>
                    </div>
                  )}
                  {repair.vehicle?.tenant && (
                    <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <div className="p-2 bg-cyan-100 rounded-full">
                        <Building2 className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-xs text-cyan-600 font-medium">Арендатор</p>
                        <p className="font-medium">{repair.vehicle.tenant}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Malfunction */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Неисправность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap bg-orange-50 p-3 rounded-lg border border-orange-200">
                  {repair.malfunction}
                </p>
              </CardContent>
            </Card>

            {/* Work Types */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cog className="h-4 w-4" />
                  Виды работ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {WORK_TYPES.map((item) => {
                    const Icon = item.icon
                    const checked = formData[item.key as keyof typeof formData] as boolean
                    return (
                      <label 
                        key={item.key}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          checked 
                            ? 'bg-primary/10 border-primary shadow-sm' 
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, [item.key]: checked })
                          }
                        />
                        <Icon className={`h-4 w-4 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm ${checked ? 'font-medium' : ''}`}>{item.label}</span>
                      </label>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Downtime */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Простой
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Дни</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.downtimeDays}
                      onChange={(e) => setFormData({ ...formData, downtimeDays: parseInt(e.target.value) || 0 })}
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Часы</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.downtimeHours}
                      onChange={(e) => setFormData({ ...formData, downtimeHours: parseInt(e.target.value) || 0 })}
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Минуты</Label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={formData.downtimeMinutes}
                      onChange={(e) => setFormData({ ...formData, downtimeMinutes: parseInt(e.target.value) || 0 })}
                      className="text-center"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Description */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Описание работ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Введите описание выполненных работ..."
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  className="min-h-[100px] resize-none"
                />
              </CardContent>
            </Card>

            {/* Spare Parts Info */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Информация о запчастях
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Информация о запчастях..."
                  value={formData.sparePartsInfo}
                  onChange={(e) => setFormData({ ...formData, sparePartsInfo: e.target.value })}
                  className="min-h-[80px] resize-none"
                />
              </CardContent>
            </Card>

            {/* Mileage and Master Row */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Пробег
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Укажите пробег"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  />
                </CardContent>
              </Card>

              {repair.masterName && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Мастер
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-medium">{repair.masterName}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Примечания
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Дополнительные примечания..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[80px] resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              Создано: {new Date(repair.entryDate).toLocaleString('ru-RU')}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
