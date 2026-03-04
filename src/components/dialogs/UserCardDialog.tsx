'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Users, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2,
  Key,
  Building2,
  Download,
  FileJson,
  Truck,
  Wrench
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useToast } from '@/hooks/use-toast'

interface UserCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UserItem {
  id: string
  name: string
  groupId?: string
  avatar?: string
  isAdmin: boolean
  isActive: boolean
  group?: {
    id: string
    name: string
  }
}

interface Group {
  id: string
  name: string
  permissions?: Record<string, boolean>
  _count?: { users: number }
}

interface SystemSettings {
  vehicleTypes: string
  owners: string
  tenants: string
  defaultStatuses: string
  defaultPriorities: string
}

const AVAILABLE_PERMISSIONS = [
  { key: 'canViewVehicles', label: 'Просмотр транспорта' },
  { key: 'canAddVehicles', label: 'Добавление транспорта' },
  { key: 'canEditVehicles', label: 'Редактирование транспорта' },
  { key: 'canDeleteVehicles', label: 'Удаление транспорта' },
  { key: 'canViewRepairs', label: 'Просмотр ремонтов' },
  { key: 'canAddRepairs', label: 'Добавление ремонтов' },
  { key: 'canEditRepairs', label: 'Редактирование ремонтов' },
  { key: 'canDeleteRepairs', label: 'Удаление ремонтов' },
  { key: 'canViewStats', label: 'Просмотр статистики' },
  { key: 'canExport', label: 'Экспорт данных' },
  { key: 'canImport', label: 'Импорт данных' },
]

export function UserCardDialog({ open, onOpenChange }: UserCardDialogProps) {
  const { user, logout, isAdmin } = useUser()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [users, setUsers] = useState<UserItem[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // System settings
  const [settings, setSettings] = useState<SystemSettings>({
    vehicleTypes: '',
    owners: '',
    tenants: '',
    defaultStatuses: '',
    defaultPriorities: ''
  })
  
  // New user form
  const [newUser, setNewUser] = useState({
    name: '',
    pin: '',
    groupId: '',
    isAdmin: false,
    avatar: ''
  })
  
  // New group form
  const [newGroup, setNewGroup] = useState({
    name: '',
    permissions: {} as Record<string, boolean>
  })
  
  // Edit states
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserData, setEditUserData] = useState<Partial<UserItem>>({})
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupData, setEditGroupData] = useState<{ name: string; permissions: Record<string, boolean> }>({ name: '', permissions: {} })

  useEffect(() => {
    if (open) {
      if (isAdmin) {
        fetchData()
      }
      fetchSettings()
    }
  }, [open, isAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/groups')
      ])
      
      if (usersRes.ok) setUsers(await usersRes.json())
      if (groupsRes.ok) setGroups(await groupsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({
          vehicleTypes: data.vehicleTypes || '',
          owners: data.owners || '',
          tenants: data.tenants || '',
          defaultStatuses: data.defaultStatuses || 'Не выполнено\nВ работе\nВыполнено',
          defaultPriorities: data.defaultPriorities || 'Обычный\nСрочный\nОчень срочный'
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Настройки сохранены' })
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

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
        a.click()
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
        toast({ title: 'Успешно', description: `Импортировано: ${result.vehicles || 0} машин, ${result.repairs || 0} ремонтов` })
        fetchData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error || 'Ошибка импорта', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Неверный формат файла', variant: 'destructive' })
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.pin) {
      toast({ title: 'Ошибка', description: 'Заполните имя и PIN', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Пользователь создан' })
        setNewUser({ name: '', pin: '', groupId: '', isAdmin: false, avatar: '' })
        fetchData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать пользователя', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUserId) return

    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUserId, ...editUserData })
      })

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Пользователь обновлен' })
        setEditingUserId(null)
        setEditUserData({})
        fetchData()
      } else {
        const error = await res.json()
        toast({ title: 'Ошибка', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить пользователя', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Удалить пользователя?')) return

    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Пользователь удален' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить пользователя', variant: 'destructive' })
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroup.name) {
      toast({ title: 'Ошибка', description: 'Введите название группы', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Группа создана' })
        setNewGroup({ name: '', permissions: {} })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать группу', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroupId) return

    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingGroupId, ...editGroupData })
      })

      if (res.ok) {
        toast({ title: 'Успешно', description: 'Группа обновлена' })
        setEditingGroupId(null)
        setEditGroupData({ name: '', permissions: {} })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить группу', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Удалить группу? Пользователи этой группы останутся без группы.')) return

    try {
      const res = await fetch(`/api/groups?id=${groupId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Успешно', description: 'Группа удалена' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить группу', variant: 'destructive' })
    }
  }

  const handleTogglePermission = (permission: string) => {
    setNewGroup(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }))
  }

  const handleToggleEditPermission = (permission: string) => {
    setEditGroupData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }))
  }

  const handleLogout = () => {
    logout()
    onOpenChange(false)
  }

  if (!user) return null

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {user.avatar ? (
              <span className="text-2xl">{user.avatar}</span>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {getUserInitials(user.name)}
                </span>
              </div>
            )}
            <div>
              <div>{user.name}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {user.isAdmin ? 'Администратор' : user.group?.name || 'Без группы'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className={`w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-1'}`}>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Пользователи</span>
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Группы</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Настройки</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {user.avatar ? (
                      <span className="text-4xl">{user.avatar}</span>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xl font-bold text-primary-foreground">
                          {getUserInitials(user.name)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-lg">{user.name}</p>
                      <div className="flex gap-2 mt-1">
                        {user.isAdmin && (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Администратор
                          </Badge>
                        )}
                        {user.group && (
                          <Badge variant="secondary">{user.group.name}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Права доступа</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.isAdmin ? (
                      <Badge className="gap-1">Полный доступ</Badge>
                    ) : user.group?.permissions ? (
                      Object.entries(user.group.permissions)
                        .filter(([, has]) => has)
                        .map(([key]) => {
                          const perm = AVAILABLE_PERMISSIONS.find(p => p.key === key)
                          return perm ? (
                            <Badge key={key} variant="secondary">{perm.label}</Badge>
                          ) : null
                        })
                    ) : (
                      <Badge variant="outline">Нет прав</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button variant="destructive" onClick={handleLogout} className="w-full gap-2">
                <LogOut className="h-4 w-4" />
                Выйти из системы
              </Button>
            </TabsContent>

            {/* Users Tab (Admin only) */}
            {isAdmin && (
              <TabsContent value="users" className="space-y-4 mt-0">
                {/* New User Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Новый пользователь
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Имя *</Label>
                        <Input
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Иван Иванов"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PIN *</Label>
                        <Input
                          value={newUser.pin}
                          onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          placeholder="1234"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Группа</Label>
                        <Select 
                          value={newUser.groupId} 
                          onValueChange={(v) => setNewUser({ ...newUser, groupId: v === 'none' ? '' : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Без группы" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Без группы</SelectItem>
                            {groups.map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Аватар (эмодзи)</Label>
                        <Input
                          value={newUser.avatar}
                          onChange={(e) => setNewUser({ ...newUser, avatar: e.target.value })}
                          placeholder="👤"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newUser.isAdmin}
                        onCheckedChange={(v) => setNewUser({ ...newUser, isAdmin: v })}
                      />
                      <Label>Администратор</Label>
                    </div>
                    <Button onClick={handleCreateUser} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Создать
                    </Button>
                  </CardContent>
                </Card>

                {/* Users List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Пользователи</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {users.map(u => (
                          <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                            {editingUserId === u.id ? (
                              <>
                                <Input
                                  value={editUserData.name || u.name}
                                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                                  className="flex-1"
                                />
                                <Input
                                  value={(editUserData as any).pin || ''}
                                  onChange={(e) => setEditUserData({ ...editUserData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                  placeholder="PIN"
                                  className="w-24"
                                  maxLength={6}
                                />
                                <Select 
                                  value={editUserData.groupId || 'none'} 
                                  onValueChange={(v) => setEditUserData({ ...editUserData, groupId: v === 'none' ? '' : v })}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Без группы</SelectItem>
                                    {groups.map(g => (
                                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" onClick={handleUpdateUser} disabled={saving}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingUserId(null); setEditUserData({}) }}>
                                  Отмена
                                </Button>
                              </>
                            ) : (
                              <>
                                {u.avatar ? (
                                  <span className="text-xl">{u.avatar}</span>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{u.name}</p>
                                  <div className="flex gap-1">
                                    {u.isAdmin && (
                                      <Badge variant="default" className="text-xs">Админ</Badge>
                                    )}
                                    {u.group && (
                                      <Badge variant="secondary" className="text-xs">{u.group.name}</Badge>
                                    )}
                                    {!u.isActive && (
                                      <Badge variant="outline" className="text-xs">Неактивен</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setEditingUserId(u.id)
                                    setEditUserData({
                                      name: u.name,
                                      groupId: u.groupId || '',
                                      isAdmin: u.isAdmin,
                                      isActive: u.isActive
                                    })
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-destructive"
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={u.id === user.id}
                                >
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
            )}

            {/* Groups Tab (Admin only) */}
            {isAdmin && (
              <TabsContent value="groups" className="space-y-4 mt-0">
                {/* New Group Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Новая группа
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Название группы *</Label>
                      <Input
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                        placeholder="Механики"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Права доступа</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {AVAILABLE_PERMISSIONS.map(perm => (
                          <div key={perm.key} className="flex items-center gap-2">
                            <Switch
                              checked={newGroup.permissions[perm.key] || false}
                              onCheckedChange={() => handleTogglePermission(perm.key)}
                            />
                            <Label className="text-sm">{perm.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleCreateGroup} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Создать группу
                    </Button>
                  </CardContent>
                </Card>

                {/* Groups List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Группы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groups.map(g => (
                          <div key={g.id} className="p-3 rounded-lg hover:bg-muted border">
                            {editingGroupId === g.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editGroupData.name}
                                  onChange={(e) => setEditGroupData({ ...editGroupData, name: e.target.value })}
                                  placeholder="Название группы"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  {AVAILABLE_PERMISSIONS.map(perm => (
                                    <div key={perm.key} className="flex items-center gap-2">
                                      <Switch
                                        checked={editGroupData.permissions[perm.key] || false}
                                        onCheckedChange={() => handleToggleEditPermission(perm.key)}
                                      />
                                      <Label className="text-xs">{perm.label}</Label>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleUpdateGroup} disabled={saving}>
                                    <Save className="h-4 w-4 mr-1" /> Сохранить
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingGroupId(null); setEditGroupData({ name: '', permissions: {} }) }}>
                                    Отмена
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="font-medium">{g.name}</p>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">{g._count?.users || 0} польз.</Badge>
                                    {g.permissions && Object.entries(g.permissions).filter(([, v]) => v).map(([k]) => {
                                      const perm = AVAILABLE_PERMISSIONS.find(p => p.key === k)
                                      return perm ? <Badge key={k} variant="secondary" className="text-xs">{perm.label}</Badge> : null
                                    })}
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setEditingGroupId(g.id)
                                    setEditGroupData({
                                      name: g.name,
                                      permissions: g.permissions || {}
                                    })
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-destructive"
                                  onClick={() => handleDeleteGroup(g.id)}
                                >
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
            )}

            {/* Settings Tab (Admin only) */}
            {isAdmin && (
              <TabsContent value="settings" className="space-y-4 mt-0">
                {/* Export/Import */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Экспорт / Импорт данных
                    </CardTitle>
                    <CardDescription>
                      Резервное копирование и восстановление данных
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={handleExport} disabled={isExporting} variant="outline" className="flex-1">
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Экспорт
                      </Button>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="hidden"
                          id="import-file"
                          disabled={isImporting}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={isImporting}
                          onClick={() => document.getElementById('import-file')?.click()}
                        >
                          {isImporting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <FileJson className="h-4 w-4 mr-2" />
                          )}
                          Импорт
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      При импорте существующие данные будут обновлены или добавлены новые.
                    </p>
                  </CardContent>
                </Card>

                {/* Vehicle Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Настройки транспорта
                    </CardTitle>
                    <CardDescription>
                      Списки для автозаполнения (по одному на строку)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Типы транспорта</Label>
                      <Textarea
                        value={settings.vehicleTypes}
                        onChange={(e) => setSettings({ ...settings, vehicleTypes: e.target.value })}
                        placeholder="Мусоровоз&#10;Фусик&#10;Газель&#10;..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Собственники</Label>
                      <Textarea
                        value={settings.owners}
                        onChange={(e) => setSettings({ ...settings, owners: e.target.value })}
                        placeholder="ООО &quot;ЭКО СЕРВИС&quot;&#10;ЗАО &quot;НСАХ&quot;&#10;..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Арендаторы</Label>
                      <Textarea
                        value={settings.tenants}
                        onChange={(e) => setSettings({ ...settings, tenants: e.target.value })}
                        placeholder="Спецтранссити&#10;ООО &quot;САХ&quot;&#10;..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Repair Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Настройки ремонтов
                    </CardTitle>
                    <CardDescription>
                      Статусы и приоритеты по умолчанию
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Статусы</Label>
                      <Textarea
                        value={settings.defaultStatuses}
                        onChange={(e) => setSettings({ ...settings, defaultStatuses: e.target.value })}
                        placeholder="Не выполнено&#10;В работе&#10;Выполнено"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Приоритеты</Label>
                      <Textarea
                        value={settings.defaultPriorities}
                        onChange={(e) => setSettings({ ...settings, defaultPriorities: e.target.value })}
                        placeholder="Обычный&#10;Срочный&#10;Очень срочный"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Сохранить настройки
                </Button>
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
