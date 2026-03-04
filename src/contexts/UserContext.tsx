'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  name: string
  pin: string
  groupId?: string
  avatar?: string
  isAdmin: boolean
  isActive: boolean
  group?: {
    id: string
    name: string
    permissions?: Record<string, boolean>
  }
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (pin: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const savedUserId = localStorage.getItem('userId')
      if (savedUserId) {
        const res = await fetch(`/api/users?id=${savedUserId}`)
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          localStorage.removeItem('userId')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      localStorage.removeItem('userId')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })

      const data = await res.json()

      if (res.ok && data.user) {
        setUser(data.user)
        localStorage.setItem('userId', data.user.id)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Неверный PIN-код' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Ошибка соединения' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('userId')
  }

  const refreshUser = async () => {
    if (user?.id) {
      try {
        const res = await fetch(`/api/users?id=${user.id}`)
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        }
      } catch (error) {
        console.error('Refresh user error:', error)
      }
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.isAdmin) return true
    if (user.group?.permissions) {
      return user.group.permissions[permission] === true
    }
    return false
  }

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
      hasPermission
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
