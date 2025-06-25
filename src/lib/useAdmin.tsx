'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './auth'
import { getCurrentUserProfile } from './supabase'
import { Profile } from '@/types/database.types'

interface AdminContextType {
  isAdmin: boolean
  profile: Profile | null
  loading: boolean
  refetchProfile: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  profile: null,
  loading: true,
  refetchProfile: async () => {}
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const refetchProfile = async () => {
    if (!user) {
      setIsAdmin(false)
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await getCurrentUserProfile()
      
      if (error) {
        console.error('Erro ao buscar perfil:', error)
        setIsAdmin(false)
        setProfile(null)
      } else {
        setProfile(data)
        setIsAdmin(data?.role === 'admin')
      }
    } catch (error) {
      console.error('Erro ao verificar perfil:', error)
      setIsAdmin(false)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetchProfile()
  }, [user])

  return (
    <AdminContext.Provider value={{ isAdmin, profile, loading, refetchProfile }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de AdminProvider')
  }
  return context
} 