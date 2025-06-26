'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/useAdmin'
import { 
  Brain, 
  Users, 
  Settings, 
  Menu, 
  X, 
  Home,
  BarChart3,
  Shield,
  ChevronRight,
  Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const adminMenuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/',
    description: 'Visão geral das licitações'
  },
  {
    title: 'Classificação Inteligente',
    icon: Brain,
    href: '/admin/classificacao-otimizada',
    description: 'Sistema automático de classificação'
  },
  {
    title: 'Gerenciar Duplicados',
    icon: Copy,
    href: '/admin/duplicados',
    description: 'Detectar e remover registros duplicados'
  },
  {
    title: 'Coleta de Licitações',
    icon: Brain,
    href: '/admin/coleta-licitacoes',
    description: 'Gerenciar coleta da API externa'
  },
  {
    title: 'Relatórios',
    icon: BarChart3,
    href: '/admin/relatorios',
    description: 'Relatórios e estatísticas'
  },
  {
    title: 'Usuários',
    icon: Users,
    href: '/admin/usuarios',
    description: 'Gerenciar usuários e permissões'
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/admin/configuracoes',
    description: 'Configurações do sistema'
  }
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { isAdmin, loading } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()

  // Não mostrar sidebar se não for admin
  if (loading || !isAdmin) {
    return null
  }

  const handleNavigation = (href: string) => {
    // Navegação SPA sem recarregar a página
    router.push(href)
    
    // Fechar sidebar no mobile após clicar
    if (window.innerWidth < 1024) {
      onToggle()
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 h-14">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="font-semibold text-lg">Admin</h2>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {adminMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors group text-left",
                  isActive 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <Icon size={20} className={cn(
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.description}
                  </div>
                </div>
                <ChevronRight size={16} className={cn(
                  "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300",
                  isActive && "text-blue-600 dark:text-blue-400"
                )} />
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Sistema de Gestão de Licitações
            <br />
            Painel Administrativo
          </div>
        </div>
      </aside>
    </>
  )
}

// Botão para toggle da sidebar (usar no header)
export function SidebarToggle({ onToggle }: { onToggle: () => void }) {
  const { isAdmin, loading } = useAdmin()

  if (loading || !isAdmin) {
    return null
  }

  return (
    <button
      onClick={onToggle}
      className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Abrir menu admin"
    >
      <Menu size={20} />
    </button>
  )
} 