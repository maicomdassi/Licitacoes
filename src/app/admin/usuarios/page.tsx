'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppLayout } from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  User,
  Mail,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Crown,
  RefreshCw,
  Filter
} from 'lucide-react'
import { Profile } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface Usuario extends Profile {
  last_sign_in_at?: string
  created_at_auth?: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  
  // Estados para ações
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  useEffect(() => {
    // Aplicar filtros
    let filtered = usuarios

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsuarios(filtered)
  }, [usuarios, searchTerm, roleFilter])

  const carregarUsuarios = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/usuarios')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }

      const data = await response.json()
      
      if (data.success) {
        setUsuarios(data.usuarios)
      } else {
        throw new Error(data.error || 'Erro ao carregar usuários')
      }

    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const alterarRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      setUpdatingUserId(userId)

      const response = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário')
      }

      const data = await response.json()
      
      if (data.success) {
        // Atualizar o usuário na lista local
        setUsuarios(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
      } else {
        throw new Error(data.error || 'Erro ao atualizar usuário')
      }

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="default" className="bg-blue-600 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <User className="w-3 h-3 mr-1" />
        Usuário
      </Badge>
    )
  }

  const getStats = () => {
    const total = usuarios.length
    const admins = usuarios.filter(u => u.role === 'admin').length
    const users = usuarios.filter(u => u.role === 'user').length
    
    return { total, admins, users }
  }

  const stats = getStats()

  return (
    <ProtectedRoute>
      <AdminRoute>
        <AppLayout>
          <div className="py-6">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Gerenciamento de Usuários
                  </h1>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    Gerencie usuários e suas permissões no sistema
                  </p>
                </div>
                
                <Button 
                  onClick={carregarUsuarios}
                  disabled={isLoading}
                  variant="outline"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                  Atualizar
                </Button>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total de Usuários
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {stats.total}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Administradores
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {stats.admins}
                        </p>
                      </div>
                      <Crown className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Usuários Comuns
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {stats.users}
                        </p>
                      </div>
                      <User className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar por email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os usuários</SelectItem>
                        <SelectItem value="admin">Apenas admins</SelectItem>
                        <SelectItem value="user">Apenas usuários</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Usuários ({filteredUsuarios.length})
                  </CardTitle>
                  <CardDescription>
                    Lista de todos os usuários cadastrados no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      <span>Carregando usuários...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 dark:text-red-400">{error}</p>
                      <Button onClick={carregarUsuarios} className="mt-4" variant="outline">
                        Tentar novamente
                      </Button>
                    </div>
                  ) : filteredUsuarios.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm || roleFilter !== 'all' 
                          ? 'Nenhum usuário encontrado com os filtros aplicados' 
                          : 'Nenhum usuário cadastrado'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsuarios.map((usuario) => (
                        <div
                          key={usuario.id}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {usuario.email}
                                </h3>
                                {getRoleBadge(usuario.role)}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Criado: {formatDate(usuario.created_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  Último acesso: {formatDate(usuario.last_sign_in_at)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {usuario.role === 'user' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => alterarRole(usuario.id, 'admin')}
                                disabled={updatingUserId === usuario.id}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                {updatingUserId === usuario.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Crown className="w-4 h-4 mr-1" />
                                    Tornar Admin
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => alterarRole(usuario.id, 'user')}
                                disabled={updatingUserId === usuario.id || usuario.email === 'maicomdassi@gmail.com'}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              >
                                {updatingUserId === usuario.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <User className="w-4 h-4 mr-1" />
                                    Remover Admin
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </AppLayout>
      </AdminRoute>
    </ProtectedRoute>
  )
} 