'use client'

import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAdmin } from '@/lib/useAdmin'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAdmin, loading } = useAdmin()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <Header onSidebarToggle={toggleSidebar} />
      
      {/* Sidebar para admins */}
      {!loading && isAdmin && (
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}
      
      {/* Conteúdo principal */}
      <main className={cn(
        "transition-all duration-300 pt-14", // pt-14 para compensar header fixo
        !loading && isAdmin ? "lg:pl-80" : "", // Padding left apenas no desktop quando admin
        "min-h-screen" // Altura mínima da tela inteira
      )}>
        <div className={cn(
          "w-full mx-auto px-4",
          // Manter a mesma largura máxima do header, mas ajustar padding
          !loading && isAdmin ? "max-w-6xl" : "max-w-5xl"
        )}>
          {children}
        </div>
      </main>
    </div>
  )
} 