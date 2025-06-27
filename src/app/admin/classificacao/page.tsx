'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  executarClassificacaoInteligente, 
  gerarRelatorioClassificacao 
} from '@/lib/classificacao-inteligente'
import { CheckCircle, XCircle, Clock, AlertTriangle, Download, Play, Trash2, Copy, Search } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import AdminRoute from '@/components/auth/AdminRoute'

interface ClassificacaoResult {
  success: boolean
  backupCreated: boolean
  totalProcessados: number
  alterados: number
  mantidos: number
  erros: string[]
  detalhes: {
    alteradosParaN: { id: number, titulo: string, motivo: string }[]
    mantidosComoP: { id: number, titulo: string, motivo: string }[]
  }
}

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

export default function ClassificacaoPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultado, setResultado] = useState<ClassificacaoResult | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [etapaAtual, setEtapaAtual] = useState('')
  
  // Estados para duplicados
  const [isDetectingDuplicates, setIsDetectingDuplicates] = useState(false)
  const [duplicados, setDuplicados] = useState<DuplicadosResult | null>(null)
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set())
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false)
  const [criterioDuplicados, setCriterioDuplicados] = useState<'id_licitacao' | 'titulo' | 'objeto'>('titulo')

  const executarClassificacao = async () => {
    setIsProcessing(true)
    setProgresso(0)
    setEtapaAtual('Iniciando processo...')
    setResultado(null)

    try {
      setEtapaAtual('Processando licitações por lotes...')
      let totalProcessados = 0
      let totalAlterados = 0
      let totalErros = 0
      let proximoLote = true
      
      const detalhesCompletos: any[] = []

      // Processar em lotes até não haver mais dados
      while (proximoLote) {
        setProgresso(Math.min(90, (totalProcessados / 7000) * 100))
        setEtapaAtual(`Processando... ${totalProcessados} licitações processadas, ${totalAlterados} alteradas`)

        const response = await fetch('/api/classificacao-lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lote: 200 })
        })

        if (!response.ok) {
          throw new Error('Erro na API de classificação')
        }

        const loteResult = await response.json()
        
        totalProcessados += loteResult.loteProcessado
        totalAlterados += loteResult.alteradosComSucesso
        totalErros += loteResult.erros
        
        if (loteResult.detalhesAlterados) {
          detalhesCompletos.push(...loteResult.detalhesAlterados)
        }

        proximoLote = loteResult.proximoLote && loteResult.loteProcessado > 0
        
        // Aguardar um pouco entre lotes para evitar sobrecarga
        if (proximoLote) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      setProgresso(100)
      setEtapaAtual('Processo concluído!')

      const resultadoFinal = {
        success: totalErros === 0,
        backupCreated: true,
        totalProcessados,
        alterados: totalAlterados,
        mantidos: totalProcessados - totalAlterados,
        erros: totalErros > 0 ? [`${totalErros} erros durante o processamento`] : [],
        detalhes: {
          alteradosParaN: detalhesCompletos,
          mantidosComoP: []
        }
      }

      setResultado(resultadoFinal)

    } catch (error) {
      console.error('Erro na classificação:', error)
      setResultado({
        success: false,
        backupCreated: false,
        totalProcessados: 0,
        alterados: 0,
        mantidos: 0,
        erros: [error instanceof Error ? error.message : 'Erro desconhecido'],
        detalhes: { alteradosParaN: [], mantidosComoP: [] }
      })
      setEtapaAtual('Erro no processamento')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadRelatorio = () => {
    if (!resultado) return

    const relatorio = gerarRelatorioClassificacao(resultado)
    const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-classificacao-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const detectarDuplicados = async () => {
    setIsDetectingDuplicates(true)
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
      alert(`${result.excluidos} registros excluídos com sucesso!`)
      
      // Redetectar duplicados após exclusão
      await detectarDuplicados()
    } catch (error) {
      console.error('Erro ao excluir duplicados:', error)
      alert('Erro ao excluir duplicados. Tente novamente.')
    } finally {
      setIsDeletingDuplicates(false)
    }
  }

  return (
    <AdminRoute>
      <AppLayout>
        <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Classificação Inteligente de Licitações
          </h1>
          <p className="mt-2 text-gray-600">
            Sistema automático para classificar licitações baseado nas atividades da empresa
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Play className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Executar Classificação</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Este processo irá criar um backup da tabela e aplicar critérios inteligentes 
            para classificar as licitações automaticamente.
          </p>

          {!isProcessing && !resultado && (
            <Button 
              onClick={executarClassificacao} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-medium"
            >
              <Play className="mr-2 h-5 w-5" />
              Iniciar Classificação Inteligente
            </Button>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center text-blue-600">
                <Clock className="h-5 w-5 animate-spin mr-2" />
                <span className="font-medium">{etapaAtual}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progresso}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                Processamento em andamento... Por favor, aguarde.
              </p>
            </div>
          )}

          {resultado && (
            <div className="space-y-6">
              {/* Status Alert */}
              <div className={`p-4 rounded-lg border-l-4 ${
                resultado.success 
                  ? 'bg-green-50 border-green-400' 
                  : 'bg-red-50 border-red-400'
              }`}>
                <div className="flex items-center">
                  {resultado.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-medium ${
                    resultado.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {resultado.success 
                      ? '✅ Classificação executada com sucesso!' 
                      : '❌ Classificação concluída com erros'}
                  </span>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {resultado.totalProcessados}
                  </div>
                  <div className="text-sm text-blue-800 font-medium">Total Processados</div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {resultado.mantidos}
                  </div>
                  <div className="text-sm text-green-800 font-medium">Mantidos como &quot;P&quot;</div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {resultado.alterados}
                  </div>
                  <div className="text-sm text-orange-800 font-medium">Alterados para &quot;N&quot;</div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {resultado.erros.length}
                  </div>
                  <div className="text-sm text-red-800 font-medium">Erros</div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                <Button 
                  onClick={downloadRelatorio}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Relatório Completo
                </Button>
                
                <Button 
                  onClick={() => {
                    setResultado(null)
                    setProgresso(0)
                    setEtapaAtual('')
                  }}
                  variant="outline"
                >
                  🔄 Nova Classificação
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Link para Gerenciar Duplicados */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 text-center">
          <div className="mb-6">
            <Copy className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gerenciar Registros Duplicados</h2>
            <p className="text-gray-600">
              Detecte e remova registros duplicados com comparação visual lado a lado
            </p>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/admin/duplicados'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
          >
            <Copy className="mr-2 h-5 w-5" />
            Acessar Gerenciador de Duplicados
          </Button>
        </div>

        {/* Card para Detecção de Duplicados */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Copy className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Detectar Duplicados</h2>
          </div>
          
          {!isDetectingDuplicates && !duplicados && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Critério de comparação:
                </label>
                <Select value={criterioDuplicados} onValueChange={(value: 'id_licitacao' | 'titulo' | 'objeto') => setCriterioDuplicados(value)}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="titulo">Título (recomendado)</SelectItem>
                    <SelectItem value="objeto">Objeto da licitação</SelectItem>
                    <SelectItem value="id_licitacao">ID Licitação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={detectarDuplicados} 
                className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg"
              >
                <Search className="mr-2 h-5 w-5" />
                Detectar Registros Duplicados
              </Button>
            </div>
          )}

          {isDetectingDuplicates && (
            <div className="flex items-center text-purple-600">
              <Clock className="h-5 w-5 animate-spin mr-2" />
              <span className="font-medium">Analisando registros em busca de duplicados...</span>
            </div>
          )}

          {duplicados && (
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {duplicados.totalAnalisados}
                  </div>
                  <div className="text-sm text-blue-800 font-medium">Total Analisados</div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {duplicados.totalGrupos}
                  </div>
                  <div className="text-sm text-purple-800 font-medium">Grupos de Duplicados</div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {duplicados.totalDuplicados}
                  </div>
                  <div className="text-sm text-orange-800 font-medium">Total de Duplicados</div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedDuplicates.size}
                  </div>
                  <div className="text-sm text-red-800 font-medium">Selecionados</div>
                </div>
              </div>

              {/* Ações */}
              {duplicados.totalGrupos > 0 && (
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    onClick={excluirDuplicadosSelecionados}
                    disabled={selectedDuplicates.size === 0 || isDeletingDuplicates}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeletingDuplicates ? 'Excluindo...' : `Excluir Selecionados (${selectedDuplicates.size})`}
                  </Button>
                  
                  <Button 
                    onClick={detectarDuplicados}
                    variant="outline"
                    disabled={isDetectingDuplicates}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Redetectar
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setDuplicados(null)
                      setSelectedDuplicates(new Set())
                    }}
                    variant="outline"
                  >
                    🔄 Limpar Resultados
                  </Button>
                </div>
              )}

              {/* Lista de Duplicados */}
              {duplicados.totalGrupos > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    📋 Grupos de Registros Duplicados ({duplicados.totalGrupos})
                  </h3>
                  
                  <div className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4 bg-gray-50">
                    {duplicados.duplicados.map((grupo, grupoIndex) => (
                      <div key={grupoIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Copy className="h-4 w-4 text-purple-600 mr-2" />
                            {grupo.quantidade} registros similares
                          </h4>
                          <Button
                            onClick={() => selectAllFromGroup(grupo.registros)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Selecionar Duplicados
                          </Button>
                        </div>
                        
                                                 <div className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                           <strong>Chave de comparação ({grupo.criterio}):</strong> {grupo.chaveNormalizada}
                         </div>
                        
                        <div className="space-y-2">
                          {grupo.registros.map((registro, index) => (
                            <div 
                              key={registro.id} 
                              className={`border rounded p-3 ${
                                selectedDuplicates.has(registro.id) 
                                  ? 'border-red-300 bg-red-50' 
                                  : index === 0 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                      index === 0 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      ID: {registro.id}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                      registro.interece === 'P' ? 'bg-yellow-100 text-yellow-800' :
                                      registro.interece === 'S' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {registro.interece}
                                    </span>
                                    {index === 0 && (
                                      <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-800">
                                        MANTER
                                      </span>
                                    )}
                                  </div>
                                                                     <p className="text-sm text-gray-900 mb-1">
                                     <strong>Título:</strong> {registro.titulo}
                                   </p>
                                   <p className="text-xs text-gray-600 mb-1">
                                     <strong>ID Licitação:</strong> {registro.id_licitacao}
                                   </p>
                                   <p className="text-xs text-gray-600 mb-1">
                                     <strong>Objeto:</strong> {registro.objeto}
                                   </p>
                                  <p className="text-xs text-gray-500">
                                    <strong>Criado em:</strong> {new Date(registro.created_at).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                
                                {index > 0 && (
                                  <input
                                    type="checkbox"
                                    checked={selectedDuplicates.has(registro.id)}
                                    onChange={() => toggleDuplicateSelection(registro.id)}
                                    className="ml-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    🎉 Nenhum duplicado encontrado!
                  </h3>
                  <p className="text-gray-600">
                    Sua base de dados está limpa, sem registros duplicados detectados.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Critérios de Classificação */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            📋 Critérios de Classificação
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Manter como P */}
            <div>
              <h3 className="text-lg font-medium text-green-700 mb-4 flex items-center">
                🟢 Manter como &quot;P&quot; (Participando)
              </h3>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800">🏗️ Construção & Engenharia</h4>
                  <p className="text-sm text-green-700 mt-1">
                    construção, reforma, obra, alvenaria, estrutura, civil, predial
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800">🔧 Instalações</h4>
                  <p className="text-sm text-green-700 mt-1">
                    instalação, ar condicionado, ventilação, elétrica, hidráulica
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800">🎨 Pintura & Acabamentos</h4>
                  <p className="text-sm text-green-700 mt-1">
                    pintura, tinta, verniz, revestimento
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800">🚪 Portas & Janelas</h4>
                  <p className="text-sm text-green-700 mt-1">
                    porta, janela, divisória, armário, esquadria, teto
                  </p>
                </div>
              </div>
            </div>

            {/* Alterar para N */}
            <div>
              <h3 className="text-lg font-medium text-red-700 mb-4 flex items-center">
                🔴 Alterar para &quot;N&quot; (Sem Interesse)
              </h3>
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800">🏥 Serviços de Saúde</h4>
                  <p className="text-sm text-red-700 mt-1">
                    médico, consulta, exame, laboratório, análise clínica
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800">🍎 Alimentação & PNAE</h4>
                  <p className="text-sm text-red-700 mt-1">
                    PNAE, gêneros alimentícios, agricultura familiar, merenda
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800">📊 Contábil & Jurídico</h4>
                  <p className="text-sm text-red-700 mt-1">
                    contábil, consultoria, perícia, laudo, auditoria
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800">👥 Serviços Sociais</h4>
                  <p className="text-sm text-red-700 mt-1">
                    acolhimento, idoso, assistência social, SCFV, oficina
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes dos Resultados */}
        {resultado && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📊 Detalhes da Classificação
            </h2>
            
            {/* Licitações Alteradas */}
            {resultado.detalhes.alteradosParaN.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-orange-700 mb-4">
                  🔄 Licitações Alteradas para &quot;N&quot; ({resultado.detalhes.alteradosParaN.length})
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4 bg-orange-50">
                  {resultado.detalhes.alteradosParaN.slice(0, 10).map((item, index) => (
                    <div key={item.id} className="bg-white border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded mb-2">
                            ID: {item.id}
                          </span>
                          <h4 className="font-medium text-sm mb-2 text-gray-900">
                            {item.titulo}
                          </h4>
                          <p className="text-xs text-gray-600">
                            <strong>Motivo:</strong> {item.motivo}
                          </p>
                        </div>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-medium">
                          N
                        </span>
                      </div>
                    </div>
                  ))}
                  {resultado.detalhes.alteradosParaN.length > 10 && (
                    <p className="text-center text-sm text-gray-600 py-3 bg-white rounded border">
                      ... e mais {resultado.detalhes.alteradosParaN.length - 10} registros alterados
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Erros */}
            {resultado.erros.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-red-700 mb-4">
                  ❌ Erros Encontrados ({resultado.erros.length})
                </h3>
                <div className="space-y-2">
                  {resultado.erros.map((erro, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                        <span className="text-red-800 text-sm">{erro}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
      </AppLayout>
    </AdminRoute>
  )
} 