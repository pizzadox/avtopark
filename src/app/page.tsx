'use client'

import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { 
  Truck, 
  Wrench, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus, 
  BarChart3,
  Calendar,
  User,
  Building2,
  Gauge,
  X,
  Info,
  History,
  Upload,
  Eye,
  Loader2,
  ChevronDown,
  Clock as ClockIcon,
  Edit2,
  Save,
  Pencil,
  TrendingUp,
  Activity,
  PieChart,
  Download,
  FileJson,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { LoginScreen } from '@/components/LoginScreen'
import { UserCardDialog } from '@/components/dialogs/UserCardDialog'
import { DataManagementDialog } from '@/components/dialogs/DataManagementDialog'
import { VehicleEditDialog } from '@/components/dialogs/VehicleEditDialog'
import { RepairDetailDialog } from '@/components/dialogs/RepairDetailDialog'
import { useIsMobile } from '@/hooks/use-mobile'

// Types
interface VehicleHistory {
  id: string
  vehicleId: string
  action: string
  field: string | null
  oldValue: string | null
  newValue: string | null
  description: string | null
  createdAt: string
}

interface Vehicle {
  id: string
  brand: string
  regNumber: string
  owner: string
  tenant: string | null
  hasGlonass: boolean
  vehicleType: string
  vin: string | null
  mileage: string | null
  techInspection: string | null
  ptsImage: string | null
  history?: VehicleHistory[]
  _count?: { repairs: number }
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
  statusId: string | null
  status: string
  mileage: string | null
  notes: string | null
  masterId: string | null
  masterName: string | null
  vehicle?: {
    brand: string
    vehicleType: string
    owner: string
    tenant?: string | null
  }
}

interface Stats {
  totalVehicles: number
  vehiclesByType: { type: string; count: number }[]
  totalRepairs: number
  repairsByStatus: { status: string; count: number }[]
  pendingRepairs: number
  completedRepairs: number
  recentRepairs: Repair[]
  vehiclesWithGlonass: number
  uniqueOwners: number
  repairsByMonth: { month: string; total: number; completed: number; pending: number }[]
  repairsByVehicleType: { type: string; count: number }[]
  topVehiclesByRepairs: { regNumber: string; brand: string; count: number }[]
  repairsByPriority: { priority: string; count: number }[]
}

function MainApp() {
  const { user, isLoading, isAuthenticated, isAdmin, hasPermission } = useUser()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchVehicle, setSearchVehicle] = useState('')
  const [searchRepair, setSearchRepair] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [isAddRepairOpen, setIsAddRepairOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isVehicleDetailOpen, setIsVehicleDetailOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isTypeVehiclesOpen, setIsTypeVehiclesOpen] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [isRepairDetailOpen, setIsRepairDetailOpen] = useState(false)
  const [ptsImage, setPtsImage] = useState<string | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory[]>([])
  const [isUserCardOpen, setIsUserCardOpen] = useState(false)
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [repairStatuses, setRepairStatuses] = useState<any[]>([])
  const [isVehicleEditOpen, setIsVehicleEditOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    regNumber: '',
    owner: '',
    tenant: '',
    hasGlonass: false,
    vehicleType: '',
    vin: '',
    mileage: '',
    techInspection: '',
    ptsImage: null as string | null
  })
  const [newRepair, setNewRepair] = useState({
    vehicleId: '',
    regNumber: '',
    vehicleInfo: '',
    malfunction: '',
    status: 'Не выполнено',
    priority: 'Обычный',
    entryDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [selectedVehicleForRepair, setSelectedVehicleForRepair] = useState<Vehicle | null>(null)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Fetch data
  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  // Set mounted state for client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vehiclesRes, repairsRes, statsRes, statusesRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/repairs'),
        fetch('/api/stats'),
        fetch('/api/repair-statuses')
      ])
      
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json())
      if (repairsRes.ok) setRepairs(await repairsRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
      if (statusesRes.ok) setRepairStatuses(await statusesRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = searchVehicle === '' || 
      v.brand.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      v.regNumber.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      v.owner.toLowerCase().includes(searchVehicle.toLowerCase())
    const matchesType = typeFilter === 'all' || v.vehicleType === typeFilter
    return matchesSearch && matchesType
  })

  // Filter repairs
  const filteredRepairs = repairs.filter(r => {
    const matchesSearch = searchRepair === '' ||
      r.regNumber.toLowerCase().includes(searchRepair.toLowerCase()) ||
      r.malfunction.toLowerCase().includes(searchRepair.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get unique vehicle types
  const vehicleTypes = [...new Set(vehicles.map(v => v.vehicleType))].filter(Boolean)

  // Get repairs for a specific vehicle
  const getVehicleRepairs = (vehicleId: string) => {
    return repairs.filter(r => r.vehicleId === vehicleId)
  }

  // Handle vehicle click
  const handleVehicleClick = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsVehicleDetailOpen(true)
    
    // Fetch vehicle history
    try {
      const res = await fetch(`/api/vehicle-history?vehicleId=${vehicle.id}`)
      if (res.ok) {
        setVehicleHistory(await res.json())
      }
    } catch (error) {
      console.error('Error fetching vehicle history:', error)
    }
  }

  // Handle type click
  const handleTypeClick = (type: string) => {
    setSelectedType(type)
    setIsTypeVehiclesOpen(true)
  }

  // Get vehicles by type
  const getVehiclesByType = (type: string) => {
    return vehicles.filter(v => v.vehicleType === type)
  }

  // Handle vehicle selection for repair
  const handleVehicleSelectForRepair = (vehicle: Vehicle) => {
    setSelectedVehicleForRepair(vehicle)
    setNewRepair({
      ...newRepair,
      vehicleId: vehicle.id,
      regNumber: vehicle.regNumber,
      vehicleInfo: vehicle.brand
    })
  }

  // Open repair dialog with vehicle pre-filled
  const openRepairDialogForVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleForRepair(vehicle)
    setNewRepair({
      vehicleId: vehicle.id,
      regNumber: vehicle.regNumber,
      vehicleInfo: vehicle.brand,
      malfunction: '',
      status: 'Не выполнено',
      priority: 'Обычный',
      entryDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setIsAddRepairOpen(true)
  }

  // Add vehicle
  const handleAddVehicle = async () => {
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle)
      })
      
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Транспортное средство добавлено' })
        setIsAddVehicleOpen(false)
        setNewVehicle({
          brand: '',
          regNumber: '',
          owner: '',
          tenant: '',
          hasGlonass: false,
          vehicleType: '',
          vin: '',
          mileage: '',
          techInspection: ''
        })
        fetchData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить транспорт', variant: 'destructive' })
    }
  }

  // Add repair
  const handleAddRepair = async () => {
    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRepair)
      })
      
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Запись о ремонте добавлена' })
        setIsAddRepairOpen(false)
        setNewRepair({
          vehicleId: '',
          regNumber: '',
          vehicleInfo: '',
          malfunction: '',
          status: 'Не выполнено',
          priority: 'Обычный',
          entryDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
        fetchData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить запись', variant: 'destructive' })
    }
  }

  // Update repair status
  const handleUpdateStatus = async (repairId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/repairs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: repairId, 
          status: newStatus,
          exitDate: newStatus === 'Выполнено' ? new Date().toISOString().split('T')[0] : null
        })
      })
      
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Статус обновлен' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить статус', variant: 'destructive' })
    }
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ru-RU')
  }

  // Format datetime
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle PTS image upload
  const handlePtsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsRecognizing(true)
    
    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vehicleId', newVehicle.regNumber || 'new')
      
      const uploadRes = await fetch('/api/upload-pts', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadRes.ok) {
        throw new Error('Failed to upload image')
      }
      
      const uploadData = await uploadRes.json()
      const imageUrl = uploadData.url
      setPtsImage(imageUrl)
      
      // Recognize PTS
      const recognizeRes = await fetch('/api/recognize-pts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })
      
      if (!recognizeRes.ok) {
        throw new Error('Failed to recognize PTS')
      }
      
      const recognizeData = await recognizeRes.json()
      
      if (recognizeData.success && recognizeData.data) {
        // Fill form with recognized data
        setNewVehicle(prev => ({
          ...prev,
          brand: recognizeData.data.brand || prev.brand,
          vin: recognizeData.data.vin || prev.vin,
          regNumber: recognizeData.data.regNumber || prev.regNumber,
          vehicleType: recognizeData.data.vehicleType || prev.vehicleType,
          ptsImage: imageUrl
        }))
        toast({ title: 'Успешно', description: 'Данные ПТС распознаны и заполнены' })
      } else {
        toast({ title: 'Внимание', description: 'Не удалось распознать все данные ПТС', variant: 'default' })
      }
    } catch (error) {
      console.error('PTS recognition error:', error)
      toast({ title: 'Ошибка', description: 'Не удалось распознать ПТС', variant: 'destructive' })
    } finally {
      setIsRecognizing(false)
    }
  }

  // Handle repair click
  const handleRepairClick = (repair: Repair) => {
    setSelectedRepair(repair)
    setIsRepairDetailOpen(true)
  }

  // Handle status change
  const handleStatusChange = async (repairId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/repairs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: repairId, 
          status: newStatus,
          exitDate: newStatus === 'Выполнено' ? new Date().toISOString().split('T')[0] : null
        })
      })
      
      if (res.ok) {
        toast({ title: 'Успешно', description: `Статус изменен на "${newStatus}"` })
        fetchData()
        if (selectedRepair && selectedRepair.id === repairId) {
          setSelectedRepair({ ...selectedRepair, status: newStatus })
        }
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось изменить статус', variant: 'destructive' })
    }
  }

  // Handle field edit
  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field)
    setEditValue(value || '')
  }

  const handleSaveEdit = async (field: string) => {
    if (!selectedVehicle) return
    
    const fieldMapping: Record<string, string> = {
      'Марка': 'brand',
      'Рег. номер': 'regNumber',
      'Собственник': 'owner',
      'Арендатор': 'tenant',
      'Тип транспорта': 'vehicleType',
      'VIN': 'vin',
      'Пробег': 'mileage',
      'Тех. осмотр': 'techInspection',
    }
    
    const apiField = fieldMapping[field]
    if (!apiField) return
    
    try {
      const res = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedVehicle.id,
          [apiField]: editValue
        })
      })
      
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Поле обновлено' })
        setSelectedVehicle({ ...selectedVehicle, [apiField]: editValue })
        
        // Refresh history
        const historyRes = await fetch(`/api/vehicle-history?vehicleId=${selectedVehicle.id}`)
        if (historyRes.ok) {
          setVehicleHistory(await historyRes.json())
        }
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить поле', variant: 'destructive' })
    }
    
    setEditingField(null)
  }

  const handleEditGlonass = async (value: boolean) => {
    if (!selectedVehicle) return
    
    try {
      const res = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedVehicle.id,
          hasGlonass: value
        })
      })
      
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Статус ГЛОНАСС обновлен' })
        setSelectedVehicle({ ...selectedVehicle, hasGlonass: value })
        
        // Refresh history
        const historyRes = await fetch(`/api/vehicle-history?vehicleId=${selectedVehicle.id}`)
        if (historyRes.ok) {
          setVehicleHistory(await historyRes.json())
        }
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить', variant: 'destructive' })
    }
  }

  // Get action description
  const getActionDescription = (history: VehicleHistory) => {
    switch (history.action) {
      case 'created':
        return 'Транспортное средство добавлено'
      case 'updated':
        return history.description || `Изменено поле "${history.field}"`
      case 'repair_added':
        return history.description || 'Добавлена запись о ремонте'
      case 'repair_completed':
        return history.description || 'Ремонт завершен'
      case 'repair_status_changed':
        return history.description || 'Изменен статус ремонта'
      case 'repair_deleted':
        return history.description || 'Удалена запись о ремонте'
      default:
        return history.description || history.action
    }
  }

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'updated':
        return <Edit2 className="h-4 w-4 text-blue-500" />
      case 'repair_added':
        return <Wrench className="h-4 w-4 text-orange-500" />
      case 'repair_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'repair_status_changed':
        return <Activity className="h-4 w-4 text-yellow-500" />
      case 'repair_deleted':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <History className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Get max value for chart scaling
  const getMaxRepairs = () => {
    if (!stats?.repairsByMonth) return 10
    return Math.max(...stats.repairsByMonth.map(m => m.total), 1)
  }

  // Handle export
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

  // Handle import
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
          description: `Импортировано: ${result.vehicles || 0} транспортных средств, ${result.repairs || 0} ремонтов, ${result.history || 0} записей истории` 
        })
        fetchData()
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

  // Get user initials
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => {}} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Wrench className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Журнал ремонта</h1>
                <p className="text-sm text-muted-foreground">подвижного состава</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* User card - clickable to open profile */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1 transition-colors"
                onClick={() => setIsUserCardOpen(true)}
              >
                {user?.avatar ? (
                  <span className="text-xl">{user.avatar}</span>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">
                      {user?.name ? getUserInitials(user.name) : '?'}
                    </span>
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? 'Администратор' : user?.group?.name || 'Без группы'}
                  </p>
                </div>
              </div>

              {/* Admin settings */}
              {isAdmin && (
                <Button variant="outline" size="icon" onClick={() => setIsDataManagementOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              <Badge variant="outline" className="gap-1 hidden sm:flex">
                <Calendar className="h-3 w-3" />
                {mounted ? new Date().toLocaleDateString('ru-RU') : ''}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 container mx-auto px-4 py-6 ${isMobile ? 'pb-20' : ''}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full lg:w-[400px] hidden sm:grid" style={{ gridTemplateColumns: `repeat(${[hasPermission('canViewStats'), hasPermission('canViewVehicles'), hasPermission('canViewRepairs')].filter(Boolean).length}, 1fr)` }}>
            {hasPermission('canViewStats') && (
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Обзор</span>
              </TabsTrigger>
            )}
            {hasPermission('canViewVehicles') && (
              <TabsTrigger value="vehicles" className="gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Транспорт</span>
              </TabsTrigger>
            )}
            {hasPermission('canViewRepairs') && (
              <TabsTrigger value="repairs" className="gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Ремонт</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {!hasPermission('canViewStats') ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Нет доступа</p>
                  <p className="text-muted-foreground">У вас нет прав для просмотра этой страницы</p>
                </CardContent>
              </Card>
            ) : loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted rounded w-16"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Всего транспорта
                      </CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalVehicles || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.uniqueOwners || 0} собственников
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Всего ремонтов
                      </CardTitle>
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalRepairs || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        В работе
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-500">{stats?.pendingRepairs || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ожидают выполнения
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Выполнено
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">{stats?.completedRepairs || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        завершено
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Repairs by Month Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Ремонты по месяцам
                      </CardTitle>
                      <CardDescription>За последние 12 месяцев</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-end gap-1">
                        {stats?.repairsByMonth?.map((month, i) => {
                          const height = (month.total / getMaxRepairs()) * 100
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full flex flex-col gap-0.5" style={{ height: '160px' }}>
                                {month.completed > 0 && (
                                  <div 
                                    className="w-full bg-green-500 rounded-t"
                                    style={{ height: `${(month.completed / getMaxRepairs()) * 160}px`, marginTop: 'auto' }}
                                    title={`Выполнено: ${month.completed}`}
                                  />
                                )}
                                {month.pending > 0 && (
                                  <div 
                                    className="w-full bg-orange-400 rounded-t"
                                    style={{ height: `${(month.pending / getMaxRepairs()) * 160}px` }}
                                    title={`В работе: ${month.pending}`}
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground rotate-0 truncate w-full text-center">
                                {month.month}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-4 mt-4 justify-center">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded" />
                          <span className="text-xs text-muted-foreground">Выполнено</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-orange-400 rounded" />
                          <span className="text-xs text-muted-foreground">В работе</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vehicle Types Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Распределение по типам
                      </CardTitle>
                      <CardDescription>Типы транспортных средств</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats?.vehiclesByType?.slice(0, 8).map((item, i) => {
                          const total = stats.vehiclesByType.reduce((sum, t) => sum + t.count, 0)
                          const percentage = total > 0 ? (item.count / total) * 100 : 0
                          const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-red-500']
                          return (
                            <div 
                              key={i} 
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                              onClick={() => handleTypeClick(item.type)}
                            >
                              <div className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
                              <span className="text-sm font-medium flex-1 truncate">{item.type}</span>
                              <Badge variant="secondary">{item.count}</Badge>
                              <span className="text-xs text-muted-foreground w-12 text-right">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Second Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Top Vehicles by Repairs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Частые ремонты
                      </CardTitle>
                      <CardDescription>Топ-5 по количеству ремонтов</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats?.topVehiclesByRepairs?.map((vehicle, i) => {
                          const maxCount = stats.topVehiclesByRepairs[0]?.count || 1
                          const width = (vehicle.count / maxCount) * 100
                          return (
                            <div 
                              key={i} 
                              className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                              onClick={() => {
                                const v = vehicles.find(v => v.regNumber === vehicle.regNumber)
                                if (v) handleVehicleClick(v)
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono">{vehicle.regNumber}</Badge>
                                <span className="text-sm truncate">{vehicle.brand}</span>
                                <Badge variant="secondary" className="ml-auto">{vehicle.count}</Badge>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Repairs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Последние ремонты</CardTitle>
                      <CardDescription>Недавние записи в журнале</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[220px]">
                        <div className="space-y-3">
                          {stats?.recentRepairs?.map((repair) => (
                            <div 
                              key={repair.id} 
                              className="flex items-start gap-3 pb-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                              onClick={() => handleRepairClick(repair)}
                            >
                              <div className={`p-2 rounded-lg ${repair.status === 'Выполнено' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                {repair.status === 'Выполнено' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-orange-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{repair.regNumber}</p>
                                <p className="text-xs text-muted-foreground truncate">{repair.malfunction}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(repair.entryDate)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* GLONASS Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Система мониторинга</CardTitle>
                    <CardDescription>ЭРА-ГЛОНАСС</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Установлено</span>
                          <span className="text-sm font-medium">{stats?.vehiclesWithGlonass} из {stats?.totalVehicles}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${stats?.totalVehicles ? (stats.vehiclesWithGlonass / stats.totalVehicles) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по транспорту..."
                    value={searchVehicle}
                    onChange={(e) => setSearchVehicle(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    {vehicleTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasPermission('canAddVehicles') && (
                <Button onClick={() => {
                  setEditingVehicle(null)
                  setIsVehicleEditOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              )}
            </div>

            {/* Vehicles Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Марка</TableHead>
                      <TableHead>Рег. номер</TableHead>
                      <TableHead>Собственник</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>ГЛОНАСС</TableHead>
                      <TableHead className="text-right">Ремонтов</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Нет транспортных средств
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map(vehicle => (
                        <TableRow 
                          key={vehicle.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleVehicleClick(vehicle)}
                        >
                          <TableCell className="font-medium">{vehicle.brand}</TableCell>
                          <TableCell className="font-mono">{vehicle.regNumber}</TableCell>
                          <TableCell>{vehicle.owner}</TableCell>
                          <TableCell>{vehicle.vehicleType}</TableCell>
                          <TableCell>
                            {vehicle.hasGlonass ? (
                              <Badge variant="default" className="bg-green-500">Да</Badge>
                            ) : (
                              <Badge variant="secondary">Нет</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{vehicle._count?.repairs || 0}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                openRepairDialogForVehicle(vehicle)
                              }}
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repairs Tab */}
          <TabsContent value="repairs" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по ремонтам..."
                    value={searchRepair}
                    onChange={(e) => setSearchRepair(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="Не выполнено">Не выполнено</SelectItem>
                    <SelectItem value="В работе">В работе</SelectItem>
                    <SelectItem value="Выполнено">Выполнено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasPermission('canAddRepairs') && (
                <Dialog open={isAddRepairOpen} onOpenChange={setIsAddRepairOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Добавить ремонт</DialogTitle>
                    <DialogDescription>
                      Введите данные о ремонте
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Транспорт *</Label>
                      <Select 
                        value={newRepair.vehicleId} 
                        onValueChange={(v) => {
                          const vehicle = vehicles.find(vh => vh.id === v)
                          if (vehicle) {
                            handleVehicleSelectForRepair(vehicle)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите транспорт" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {vehicles.map(v => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.regNumber} - {v.brand}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedVehicleForRepair && (
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Тип: {selectedVehicleForRepair.vehicleType}</span>
                        <span>Собств.: {selectedVehicleForRepair.owner}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="malfunction">Неисправность *</Label>
                      <Textarea
                        id="malfunction"
                        value={newRepair.malfunction}
                        onChange={(e) => setNewRepair({...newRepair, malfunction: e.target.value})}
                        placeholder="Описание неисправности"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="entryDate">Дата поступления</Label>
                        <Input
                          id="entryDate"
                          type="date"
                          value={newRepair.entryDate}
                          onChange={(e) => setNewRepair({...newRepair, entryDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Приоритет</Label>
                        <Select 
                          value={newRepair.priority} 
                          onValueChange={(v) => setNewRepair({...newRepair, priority: v})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Низкий">Низкий</SelectItem>
                            <SelectItem value="Обычный">Обычный</SelectItem>
                            <SelectItem value="Высокий">Высокий</SelectItem>
                            <SelectItem value="Срочный">Срочный</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Примечания</Label>
                      <Textarea
                        id="notes"
                        value={newRepair.notes}
                        onChange={(e) => setNewRepair({...newRepair, notes: e.target.value})}
                        placeholder="Дополнительная информация"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddRepairOpen(false)}>Отмена</Button>
                    <Button onClick={handleAddRepair}>Добавить</Button>
                  </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Repairs Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Рег. номер</TableHead>
                      <TableHead>Неисправность</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepairs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Нет записей о ремонтах
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRepairs.map(repair => (
                        <TableRow 
                          key={repair.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRepairClick(repair)}
                        >
                          <TableCell>{formatDate(repair.entryDate)}</TableCell>
                          <TableCell className="font-mono">{repair.regNumber}</TableCell>
                          <TableCell className="max-w-xs truncate">{repair.malfunction}</TableCell>
                          <TableCell>
                            <Badge variant={
                              repair.priority === 'Срочный' ? 'destructive' :
                              repair.priority === 'Высокий' ? 'default' :
                              repair.priority === 'Низкий' ? 'secondary' : 'outline'
                            }>
                              {repair.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              repair.status === 'Выполнено' ? 'default' :
                              repair.status === 'В работе' ? 'secondary' : 'outline'
                            } className={
                              repair.status === 'Выполнено' ? 'bg-green-500' :
                              repair.status === 'В работе' ? 'bg-blue-500' : ''
                            }>
                              {repair.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={repair.status} 
                              onValueChange={(v) => {
                                handleStatusChange(repair.id, v)
                              }}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Не выполнено">Не выполнено</SelectItem>
                                <SelectItem value="В работе">В работе</SelectItem>
                                <SelectItem value="Выполнено">Выполнено</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Vehicle Detail Dialog */}
      <Dialog open={isVehicleDetailOpen} onOpenChange={setIsVehicleDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {selectedVehicle?.brand}
                </DialogTitle>
                <DialogDescription>
                  {selectedVehicle?.regNumber}
                </DialogDescription>
              </div>
              {hasPermission('canEditVehicles') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingVehicle(selectedVehicle)
                    setIsVehicleDetailOpen(false)
                    setIsVehicleEditOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="grid gap-4 py-4">
              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Марка</Label>
                  {editingField === 'Марка' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => handleSaveEdit('Марка')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedVehicle?.brand}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('Марка', selectedVehicle?.brand || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Рег. номер</Label>
                  {editingField === 'Рег. номер' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => handleSaveEdit('Рег. номер')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium font-mono">{selectedVehicle?.regNumber}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('Рег. номер', selectedVehicle?.regNumber || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Собственник</Label>
                  {editingField === 'Собственник' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => handleSaveEdit('Собственник')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedVehicle?.owner}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('Собственник', selectedVehicle?.owner || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Арендатор</Label>
                  {editingField === 'Арендатор' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => handleSaveEdit('Арендатор')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedVehicle?.tenant || '-'}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('Арендатор', selectedVehicle?.tenant || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Тип транспорта</Label>
                  {editingField === 'Тип транспорта' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => handleSaveEdit('Тип транспорта')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedVehicle?.vehicleType}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('Тип транспорта', selectedVehicle?.vehicleType || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">VIN</Label>
                  {editingField === 'VIN' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => handleSaveEdit('VIN')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium font-mono text-sm">{selectedVehicle?.vin || '-'}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('VIN', selectedVehicle?.vin || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Пробег</Label>
                  {editingField === 'Пробег' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => handleSaveEdit('Пробег')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedVehicle?.mileage ? `${selectedVehicle.mileage} км` : '-'}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('Пробег', selectedVehicle?.mileage || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Тех. осмотр</Label>
                  {editingField === 'Тех. осмотр' ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" type="date" />
                      <Button size="sm" onClick={() => handleSaveEdit('Тех. осмотр')}><Save className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formatDate(selectedVehicle?.techInspection)}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartEdit('Тех. осмотр', selectedVehicle?.techInspection || '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label>ЭРА-ГЛОНАСС</Label>
                <input
                  type="checkbox"
                  checked={selectedVehicle?.hasGlonass || false}
                  onChange={(e) => handleEditGlonass(e.target.checked)}
                  className="rounded"
                />
              </div>

              {/* PTS Image */}
              {selectedVehicle?.ptsImage && (
                <div className="space-y-2">
                  <Label>ПТС</Label>
                  <img 
                    src={selectedVehicle.ptsImage} 
                    alt="ПТС" 
                    className="max-h-48 rounded border cursor-pointer"
                    onClick={() => window.open(selectedVehicle.ptsImage, '_blank')}
                  />
                </div>
              )}

              <Separator />

              {/* Vehicle History */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  История изменений
                </Label>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {vehicleHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Нет истории</p>
                    ) : (
                      vehicleHistory.map(h => (
                        <div key={h.id} className="flex items-start gap-2 text-sm">
                          {getActionIcon(h.action)}
                          <div className="flex-1">
                            <p>{getActionDescription(h)}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Vehicle Repairs */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Ремонты ({selectedVehicle ? getVehicleRepairs(selectedVehicle.id).length : 0})
                </Label>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {selectedVehicle && getVehicleRepairs(selectedVehicle.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Нет записей о ремонтах</p>
                    ) : (
                      selectedVehicle && getVehicleRepairs(selectedVehicle.id).map(r => (
                        <div 
                          key={r.id} 
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setIsVehicleDetailOpen(false)
                            handleRepairClick(r)
                          }}
                        >
                          <div className={`p-2 rounded-lg ${r.status === 'Выполнено' ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {r.status === 'Выполнено' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{r.malfunction}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{formatDate(r.entryDate)}</span>
                              <span>-</span>
                              <span>{r.status}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVehicleDetailOpen(false)}>Закрыть</Button>
            <Button onClick={() => {
              if (selectedVehicle) {
                openRepairDialogForVehicle(selectedVehicle)
                setIsVehicleDetailOpen(false)
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить ремонт
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type Vehicles Dialog */}
      <Dialog open={isTypeVehiclesOpen} onOpenChange={setIsTypeVehiclesOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {selectedType}
            </DialogTitle>
            <DialogDescription>
              {getVehiclesByType(selectedType || '').length} транспортных средств
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-2 py-4">
              {getVehiclesByType(selectedType || '').map(v => (
                <div 
                  key={v.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setIsTypeVehiclesOpen(false)
                    handleVehicleClick(v)
                  }}
                >
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{v.brand}</p>
                    <p className="text-sm text-muted-foreground font-mono">{v.regNumber}</p>
                  </div>
                  <Badge variant="secondary">{v._count?.repairs || 0} ремонтов</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Repair Detail Dialog */}
      <RepairDetailDialog
        open={isRepairDetailOpen}
        onOpenChange={setIsRepairDetailOpen}
        repair={selectedRepair}
        onUpdate={(updatedRepair) => {
          fetchData()
          setSelectedRepair(updatedRepair)
        }}
        repairStatuses={repairStatuses}
      />

      {/* Vehicle Edit Dialog */}
      <VehicleEditDialog
        open={isVehicleEditOpen}
        onOpenChange={setIsVehicleEditOpen}
        vehicle={editingVehicle}
        onSave={async (vehicleData) => {
          try {
            const isEditing = !!editingVehicle?.id
            const res = await fetch('/api/vehicles', {
              method: isEditing ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(isEditing ? { id: editingVehicle.id, ...vehicleData } : vehicleData)
            })
            
            if (res.ok) {
              toast({ title: 'Успешно', description: isEditing ? 'Транспорт обновлен' : 'Транспорт добавлен' })
              setIsVehicleEditOpen(false)
              setEditingVehicle(null)
              fetchData()
            } else {
              const error = await res.json()
              toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
            }
          } catch (error) {
            toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' })
          }
        }}
      />

      {/* User Card Dialog */}
      <UserCardDialog 
        open={isUserCardOpen} 
        onOpenChange={setIsUserCardOpen} 
        onOpenSettings={() => {
          setIsUserCardOpen(false)
          setIsDataManagementOpen(true)
        }}
      />
      
      {/* Data Management Dialog */}
      <DataManagementDialog open={isDataManagementOpen} onOpenChange={setIsDataManagementOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-20 safe-area-bottom">
          <div className="grid grid-cols-4 h-16">
            {hasPermission('canViewStats') && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-[10px]">Обзор</span>
              </button>
            )}
            {hasPermission('canViewVehicles') && (
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'vehicles' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Truck className="h-5 w-5" />
                <span className="text-[10px]">Транспорт</span>
              </button>
            )}
            {hasPermission('canViewRepairs') && (
              <button
                onClick={() => setActiveTab('repairs')}
                className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'repairs' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Wrench className="h-5 w-5" />
                <span className="text-[10px]">Ремонт</span>
              </button>
            )}
            <button
              onClick={() => setIsUserCardOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              {user?.avatar ? (
                <span className="h-5 w-5 text-lg leading-5">{user.avatar}</span>
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="text-[10px]">Профиль</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  )
}
