'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Mostrar tela de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  // Se o usuário estiver autenticado, renderiza o conteúdo protegido
  if (user) {
    return <>{children}</>
  }

  // Caso contrário, não renderiza nada (será redirecionado no useEffect)
  return null
} 