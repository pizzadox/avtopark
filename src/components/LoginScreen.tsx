'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wrench, Loader2, User, Lock, AlertCircle, Users } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { login } = useUser()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      setError('Введите PIN-код')
      return
    }

    setIsLoggingIn(true)
    setError('')

    const result = await login(pin.trim())

    if (result.success) {
      onLoginSuccess()
    } else {
      setError(result.error || 'Неверный PIN-код')
    }

    setIsLoggingIn(false)
  }

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    setPin(numericValue)
    setError('')
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(selectedUserId === userId ? null : userId)
  }

  const handleKeyPress = (key: string) => {
    if (key === '⌫') {
      setPin(prev => prev.slice(0, -1))
    } else if (key && pin.length < 6) {
      setPin(prev => prev + key)
    }
    setError('')
  }

  // PIN display dots
  const renderPinDots = () => {
    const dots = []
    for (let i = 0; i < 4; i++) {
      dots.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-all duration-150 ${
            i < pin.length 
              ? 'bg-primary border-primary scale-110' 
              : 'border-muted-foreground/40'
          }`}
        />
      )
    }
    return dots
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      {/* Header - compact */}
      <div className="flex-shrink-0 pt-4 pb-2 px-4 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl shadow-lg mb-2">
          <Wrench className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Журнал ремонта</h1>
        <p className="text-xs text-muted-foreground">подвижного состава</p>
      </div>

      {/* Main content - scrollable if needed */}
      <div className="flex-1 flex flex-col justify-center px-4 overflow-auto">
        <Card className="shadow-lg border-muted/50 max-w-xs mx-auto w-full">
          <CardHeader className="text-center py-3 px-4">
            <CardTitle className="flex items-center justify-center gap-2 text-base">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Вход в систему
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <form onSubmit={handleLogin} className="space-y-3">
              {/* PIN Dots Display */}
              <div className="flex justify-center gap-3 py-2">
                {renderPinDots()}
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-destructive text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant={key === 'C' ? 'destructive' : key === '⌫' ? 'secondary' : 'outline'}
                    className={`h-12 text-lg font-medium ${key === '' ? 'invisible' : ''}`}
                    disabled={isLoggingIn}
                    onClick={() => {
                      if (key === 'C') {
                        setPin('')
                        setError('')
                      } else if (key === '⌫') {
                        handleKeyPress(key)
                      } else {
                        handleKeyPress(key)
                      }
                    }}
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={isLoggingIn || pin.length < 4}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Users Quick Access - scrollable at bottom */}
      {!loadingUsers && users.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground text-center mb-2 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Пользователи
            </p>
            <div className="flex gap-1.5 justify-center flex-wrap">
              {users.slice(0, 6).map(user => (
                <Button
                  key={user.id}
                  variant={selectedUserId === user.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUserSelect(user.id)}
                  className="h-8 px-2 gap-1"
                >
                  {user.avatar ? (
                    <span className="text-sm">{user.avatar}</span>
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span className="max-w-[60px] truncate text-xs">{user.name.split(' ')[0]}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 pb-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          Нет PIN? Обратитесь к администратору
        </p>
      </div>
    </div>
  )
}
