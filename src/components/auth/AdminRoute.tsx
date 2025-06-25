'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/useAdmin'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, loading, router])

  // Tela de carregamento enquanto verifica se é admin
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-2">Verificando permissões...</span>
      </div>
    )
  }

  // Se for admin, renderiza o conteúdo
  if (isAdmin) {
    return <>{children}</>
  }

  // Caso contrário, não renderiza nada (será redirecionado)
  return null
} 