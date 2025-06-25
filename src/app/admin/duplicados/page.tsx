'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppLayout } from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import { 
  CheckCircle, 
  Clock, 
  Search, 
  Copy,
  Trash2,
  Eye,
  AlertTriangle,
  ArrowRight,
  Calendar,
  FileText,
  Link,
  RotateCcw
} from 'lucide-react'

interface DuplicadosResult {
  success: boolean
  duplicados: {
    chaveNormalizada: string
    criterio: string
    quantidade: number
    registros: {
      id: number
      titulo: string
      objeto: string
      link_externo: string
      interece: string
      created_at: string
      id_licitacao: string
    }[]
  }[]
  totalAnalisados: number
  totalDuplicados: number
  totalGrupos: number
  criterio: string
}

export default function DuplicadosPage() {
  // Estados
  const [isDetectingDuplicates, setIsDetectingDuplicates] = useState(false)
  const [duplicados, setDuplicados] = useState<DuplicadosResult | null>(null)
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set())
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false)
  const [criterioDuplicados, setCriterioDuplicados] = useState<'id_licitacao' | 'titulo' | 'objeto'>('titulo')
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | null>(null)

  const detectarDuplicados = async () => {
    setIsDetectingDuplicates(true)
    setGrupoSelecionado(null)
    try {
      const response = await fetch(`/api/detectar-duplicados?criterio=${criterioDuplicados}`)
      if (!response.ok) {
        throw new Error('Erro ao detectar duplicados')
      }
      const result = await response.json()
      setDuplicados(result)
      setSelectedDuplicates(new Set())
    } catch (error) {
      console.error('Erro ao detectar duplicados:', error)
      alert('Erro ao detectar duplicados. Tente novamente.')
    } finally {
      setIsDetectingDuplicates(false)
    }
  }

  const toggleDuplicateSelection = (id: number) => {
    const newSelected = new Set(selectedDuplicates)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDuplicates(newSelected)
  }

  const selectAllFromGroup = (registros: any[]) => {
    const newSelected = new Set(selectedDuplicates)
    // Manter o primeiro (mais antigo) e selecionar os demais para exclusão
    registros.slice(1).forEach(registro => {
      newSelected.add(registro.id)
    })
    setSelectedDuplicates(newSelected)
  }

  const excluirDuplicadosSelecionados = async () => {
    if (selectedDuplicates.size === 0) {
      alert('Selecione pelo menos um registro para excluir.')
      return
    }

    if (!confirm(`Tem certeza que deseja excluir ${selectedDuplicates.size} registros duplicados? Esta ação não pode ser desfeita.`)) {
      return
    }

    setIsDeletingDuplicates(true)
    try {
      const response = await fetch('/api/detectar-duplicados', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedDuplicates) })
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir duplicados')
      }

      const result = await response.json()
      
      if (result.success) {
        alert(`${result.excluidos} registros excluídos com sucesso!`)
        // Redetectar duplicados após exclusão
        await detectarDuplicados()
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao excluir duplicados:', error)
      alert('Erro ao excluir duplicados. Tente novamente.')
    } finally {
      setIsDeletingDuplicates(false)
    }
  }

  const resetar = () => {
    setDuplicados(null)
    setSelectedDuplicates(new Set())
    setGrupoSelecionado(null)
  }

  const getCriterioLabel = (criterio: string) => {
    switch (criterio) {
      case 'titulo': return 'Título'
      case 'objeto': return 'Objeto'
      case 'id_licitacao': return 'ID Licitação'
      default: return criterio
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getIntereceBadge = (interece: string) => {
    switch (interece) {
      case 'P': return { variant: 'default' as const, label: 'Participando', color: 'bg-green-100 text-green-800' }
      case 'S': return { variant: 'secondary' as const, label: 'Acompanhar', color: 'bg-blue-100 text-blue-800' }
      case 'N': return { variant: 'destructive' as const, label: 'Sem Interesse', color: 'bg-red-100 text-red-800' }
      default: return { variant: 'outline' as const, label: interece, color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <ProtectedRoute>
      <AdminRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            {/* Cabeçalho */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Copy className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Gerenciar Duplicados
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Detecte e remova registros duplicados com comparação visual lado a lado
              </p>
            </div>

            {/* Configuração e Detecção */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Configurar Detecção
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Critério de Comparação
                  </label>
                  <Select 
                    value={criterioDuplicados} 
                    onValueChange={(value: 'id_licitacao' | 'titulo' | 'objeto') => setCriterioDuplicados(value)}
                    disabled={isDetectingDuplicates}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="titulo">📝 Título (recomendado)</SelectItem>
                      <SelectItem value="objeto">📋 Objeto da licitação</SelectItem>
                      <SelectItem value="id_licitacao">🆔 ID Licitação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={detectarDuplicados}
                    disabled={isDetectingDuplicates}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isDetectingDuplicates ? (
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    {isDetectingDuplicates ? 'Analisando...' : 'Detectar Duplicados'}
                  </Button>
                  
                  {duplicados && (
                    <Button 
                      onClick={resetar}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Estatísticas */}
            {duplicados && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {duplicados.totalAnalisados}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300 font-medium">Total Analisados</div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {duplicados.totalGrupos}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-300 font-medium">Grupos de Duplicados</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {duplicados.totalDuplicados}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-300 font-medium">Total de Duplicados</div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {selectedDuplicates.size}
                  </div>
                  <div className="text-sm text-red-800 dark:text-red-300 font-medium">Selecionados</div>
                </div>
              </div>
            )}

            {/* Ações de Massa */}
            {duplicados && duplicados.totalGrupos > 0 && (
              <Card className="p-4 mb-8">
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={excluirDuplicadosSelecionados}
                    disabled={selectedDuplicates.size === 0 || isDeletingDuplicates}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeletingDuplicates ? 'Excluindo...' : `Excluir Selecionados (${selectedDuplicates.size})`}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      // Selecionar todos os duplicados (exceto o primeiro de cada grupo)
                      const newSelected = new Set<number>()
                      duplicados.duplicados.forEach(grupo => {
                        grupo.registros.slice(1).forEach(registro => {
                          newSelected.add(registro.id)
                        })
                      })
                      setSelectedDuplicates(newSelected)
                    }}
                    variant="outline"
                    disabled={isDeletingDuplicates}
                  >
                    Selecionar Todos os Duplicados
                  </Button>
                  
                  <Button 
                    onClick={() => setSelectedDuplicates(new Set())}
                    variant="outline"
                    disabled={isDeletingDuplicates}
                  >
                    Desmarcar Todos
                  </Button>
                </div>
              </Card>
            )}

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista de Grupos (Coluna Esquerda) */}
              <div className="lg:col-span-1">
                <Card className="p-6 h-full">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    📋 Grupos de Duplicados
                  </h3>
                  
                  {duplicados ? (
                    duplicados.totalGrupos > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {duplicados.duplicados.map((grupo, index) => (
                          <div 
                            key={index}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              grupoSelecionado === index 
                                ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => setGrupoSelecionado(index)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {grupo.quantidade} registros
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getCriterioLabel(grupo.criterio)}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <strong>Chave:</strong> {grupo.chaveNormalizada.substring(0, 50)}...
                            </div>
                            
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              ID mais antigo: {grupo.registros[0]?.id}
                            </div>
                            
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                selectAllFromGroup(grupo.registros)
                              }}
                              size="sm"
                              variant="outline"
                              className="text-xs mt-2"
                            >
                              Marcar Duplicados
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🎉 Nenhum duplicado encontrado!
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          Sua base de dados está limpa.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Execute a detecção para ver os grupos de duplicados
                      </p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Comparação Visual (Duas Colunas Direita) */}
              <div className="lg:col-span-2">
                {grupoSelecionado !== null && duplicados?.duplicados[grupoSelecionado] ? (
                  <div className="space-y-6">
                    {/* Cabeçalho da Comparação */}
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Comparação Visual - Grupo {grupoSelecionado + 1}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Critério: <strong>{getCriterioLabel(duplicados.duplicados[grupoSelecionado].criterio)}</strong>
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {duplicados.duplicados[grupoSelecionado].quantidade} registros
                        </Badge>
                      </div>
                      
                      {/* Chave de Comparação Destacada */}
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                        <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          🔍 Chave de Comparação ({getCriterioLabel(duplicados.duplicados[grupoSelecionado].criterio)}):
                        </div>
                        <div className="text-sm text-yellow-900 dark:text-yellow-200 font-mono">
                          {duplicados.duplicados[grupoSelecionado].chaveNormalizada}
                        </div>
                      </div>
                    </Card>

                    {/* Registros em Duas Colunas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {duplicados.duplicados[grupoSelecionado].registros.map((registro, index) => (
                        <Card 
                          key={registro.id}
                          className={`p-6 ${
                            selectedDuplicates.has(registro.id) 
                              ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' 
                              : index === 0 
                                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                                : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {/* Cabeçalho do Registro */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                                ID: {registro.id}
                              </Badge>
                              <Badge className={`text-xs ${getIntereceBadge(registro.interece).color}`}>
                                {getIntereceBadge(registro.interece).label}
                              </Badge>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs bg-blue-600">
                                  MANTER
                                </Badge>
                              )}
                            </div>
                            
                            {index > 0 && (
                              <input
                                type="checkbox"
                                checked={selectedDuplicates.has(registro.id)}
                                onChange={() => toggleDuplicateSelection(registro.id)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                            )}
                          </div>

                          {/* Dados do Registro */}
                          <div className="space-y-4">
                            {/* Título */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</span>
                                {duplicados.criterio === 'titulo' && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                    CRITÉRIO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-2 rounded border">
                                {registro.titulo}
                              </p>
                            </div>

                            {/* Objeto */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Objeto</span>
                                {duplicados.criterio === 'objeto' && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                    CRITÉRIO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-2 rounded border max-h-20 overflow-y-auto">
                                {registro.objeto}
                              </p>
                            </div>

                            {/* ID Licitação */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Copy className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Licitação</span>
                                {duplicados.criterio === 'id_licitacao' && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                    CRITÉRIO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-2 rounded border font-mono">
                                {registro.id_licitacao}
                              </p>
                            </div>

                            {/* Link Externo */}
                            {registro.link_externo && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Link className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Link</span>
                                </div>
                                <a 
                                  href={registro.link_externo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline bg-white dark:bg-gray-800 p-2 rounded border block truncate"
                                >
                                  {registro.link_externo}
                                </a>
                              </div>
                            )}

                            {/* Data de Criação */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Criado em</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border">
                                {formatDate(registro.created_at)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <ArrowRight className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Selecione um grupo para comparar
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500">
                      Clique em um grupo na lista à esquerda para ver a comparação detalhada
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </AppLayout>
      </AdminRoute>
    </ProtectedRoute>
  )
} 