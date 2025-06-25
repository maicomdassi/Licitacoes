'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { AppLayout } from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  PlayCircle, 
  FileText,
  AlertTriangle,
  TrendingUp,
  Database,
  Copy,
  Trash2
} from 'lucide-react'

interface ResumoAnalise {
  totalAnalisadas: number
  paraAlterar: number
  paraManter: number
  percentualAlteracao: number
}

interface ExemploAlteracao {
  id: number
  titulo: string
  motivo: string
  palavrasEncontradas: string[]
}



export default function ClassificacaoOtimizadaPage() {
  const [etapa, setEtapa] = useState<'inicial' | 'analisando' | 'analisada' | 'executando' | 'concluida'>('inicial')
  const [resumoAnalise, setResumoAnalise] = useState<ResumoAnalise | null>(null)
  const [exemplos, setExemplos] = useState<ExemploAlteracao[]>([])
  const [idsParaAlterar, setIdsParaAlterar] = useState<number[]>([])
  const [resultadoExecucao, setResultadoExecucao] = useState<{
    atualizadas: number
    erros: string[]
    message: string
  } | null>(null)



  const executarAnalise = async () => {
    setEtapa('analisando')
    
    try {
      const response = await fetch('/api/classificacao-otimizada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: 'analisar' })
      })

      if (!response.ok) {
        throw new Error('Erro na análise')
      }

      const resultado = await response.json()
      
      if (resultado.success) {
        setResumoAnalise(resultado.resumo)
        setExemplos(resultado.exemplosParaAlterar || [])
        setIdsParaAlterar(resultado.idsParaAlterar || [])
        setEtapa('analisada')
      } else {
        throw new Error(resultado.error || 'Erro na análise')
      }

    } catch (error) {
      console.error('Erro na análise:', error)
      alert(`Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setEtapa('inicial')
    }
  }

  const executarAtualizacoes = async () => {
    setEtapa('executando')
    
    try {
      const response = await fetch('/api/classificacao-otimizada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          etapa: 'executar',
          idsParaAlterar 
        })
      })

      if (!response.ok) {
        throw new Error('Erro na execução')
      }

      const resultado = await response.json()
      
      setResultadoExecucao({
        atualizadas: resultado.atualizadas,
        erros: resultado.erros || [],
        message: resultado.message
      })
      setEtapa('concluida')

    } catch (error) {
      console.error('Erro na execução:', error)
      alert(`Erro na execução: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setEtapa('analisada')
    }
  }

  const reiniciar = () => {
    setEtapa('inicial')
    setResumoAnalise(null)
    setExemplos([])
    setIdsParaAlterar([])
    setResultadoExecucao(null)
  }



  return (
    <ProtectedRoute>
      <AdminRoute>
        <AppLayout>
          <div className="py-6">
            <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🎯 Classificação Inteligente Otimizada
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Processo em duas etapas: análise completa e execução controlada
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${
              ['inicial', 'analisando', 'analisada', 'executando', 'concluida'].includes(etapa) 
                ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                etapa === 'analisando' ? 'bg-blue-600 text-white animate-spin' :
                ['analisada', 'executando', 'concluida'].includes(etapa) ? 'bg-green-600 text-white' :
                'bg-blue-600 text-white'
              }`}>
                {etapa === 'analisando' ? <Clock className="w-4 h-4" /> :
                 ['analisada', 'executando', 'concluida'].includes(etapa) ? <CheckCircle className="w-4 h-4" /> :
                 <Search className="w-4 h-4" />}
              </div>
              <span className="ml-2 font-medium">Análise</span>
            </div>
            
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
            
            <div className={`flex items-center ${
              ['executando', 'concluida'].includes(etapa) 
                ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                etapa === 'executando' ? 'bg-green-600 text-white animate-pulse' :
                etapa === 'concluida' ? 'bg-green-600 text-white' :
                'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {etapa === 'executando' ? <Clock className="w-4 h-4" /> :
                 etapa === 'concluida' ? <CheckCircle className="w-4 h-4" /> :
                 <PlayCircle className="w-4 h-4" />}
              </div>
              <span className="ml-2 font-medium">Execução</span>
            </div>
          </div>
        </div>

        {/* Etapa Inicial */}
        {etapa === 'inicial' && (
          <div className="space-y-6">
            {/* Classificação Inteligente */}
            <Card className="p-8 text-center">
              <div className="mb-6">
                <Database className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Classificação Inteligente
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Vamos buscar todas as licitações com interesse "P" e analisar quais devem ser alteradas
                </p>
              </div>
              
              <Button 
                onClick={executarAnalise}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <Search className="mr-2 h-5 w-5" />
                Iniciar Análise Completa
              </Button>
            </Card>

            {/* Link para Gerenciar Duplicados */}
            <Card className="p-8 text-center">
              <div className="mb-6">
                <Copy className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Gerenciar Registros Duplicados
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
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
            </Card>
          </div>
        )}

        {/* Etapa Analisando */}
        {etapa === 'analisando' && (
          <Card className="p-8 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Analisando Licitações
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Carregando todas as licitações em memória e aplicando critérios...
            </p>
          </Card>
        )}

        {/* Etapa Analisada */}
        {etapa === 'analisada' && resumoAnalise && (
          <div className="space-y-6">
            {/* Resumo da Análise */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Análise Concluída
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {resumoAnalise.totalAnalisadas.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300 font-medium">Total Analisadas</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {resumoAnalise.paraAlterar.toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-300 font-medium">Para Alterar (P→N)</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {resumoAnalise.paraManter.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300 font-medium">Para Manter (P)</div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {resumoAnalise.percentualAlteracao}%
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-300 font-medium">% de Alteração</div>
                </div>
              </div>

              {/* Exemplos */}
              {exemplos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Exemplos de Licitações para Alterar:
                  </h3>
                  <div className="space-y-2">
                    {exemplos.slice(0, 5).map((exemplo, index) => (
                      <div key={exemplo.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              ID: {exemplo.id} - {exemplo.titulo}...
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {exemplo.motivo}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exemplo.palavrasEncontradas.map((palavra, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {palavra}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={reiniciar}
                  variant="outline"
                  size="lg"
                >
                  Cancelar
                </Button>
                
                <Button 
                  onClick={executarAtualizacoes}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  disabled={resumoAnalise.paraAlterar === 0}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Confirmar e Atualizar {resumoAnalise.paraAlterar.toLocaleString()} Licitações
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Etapa Executando */}
        {etapa === 'executando' && (
          <Card className="p-8 text-center">
            <div className="animate-pulse w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Executando Atualizações
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Atualizando as licitações selecionadas no banco de dados...
            </p>
          </Card>
        )}

        {/* Etapa Concluída */}
        {etapa === 'concluida' && resultadoExecucao && (
          <Card className="p-8 text-center">
            <div className="mb-6">
              {resultadoExecucao.erros.length === 0 ? (
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {resultadoExecucao.erros.length === 0 ? 'Processo Concluído!' : 'Processo Concluído com Avisos'}
              </h2>
              
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                {resultadoExecucao.message}
              </p>

              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {resultadoExecucao.atualizadas.toLocaleString()}
                </div>
                <div className="text-green-800 dark:text-green-300 font-medium">Licitações Atualizadas</div>
              </div>

              {resultadoExecucao.erros.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Avisos:</h3>
                  <ul className="text-sm text-orange-700 dark:text-orange-400">
                    {resultadoExecucao.erros.map((erro, index) => (
                      <li key={index}>• {erro}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button 
              onClick={reiniciar}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="mr-2 h-5 w-5" />
              Executar Nova Classificação
            </Button>
          </Card>
        )}
          </div>
        </div>
        </AppLayout>
      </AdminRoute>
    </ProtectedRoute>
  )
} 