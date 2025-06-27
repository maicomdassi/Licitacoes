'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AdminRoute from '@/components/auth/AdminRoute'
import { AppLayout } from '@/components/layout/AppLayout'

interface StatusColeta {
  ipAtual: string
  ultimaDataConsultada: string
  ultimoIPUsado: string
  statusUltimaConsulta: string
  totalLicitacoes: number
  statusAPI: 'online' | 'offline' | 'verificando'
  apiConfigurada: boolean
  configuracoes: {
    uf: string
    modalidades: string
    tokenConfigurado: boolean
  }
}

interface ProcessoColeta {
  ativo: boolean
  dataAtual: string
  progresso: number
  totalDias: number
  diasProcessados: number
  ultimaDataSalva: string
  totalInseridas: number
  logs: string[]
}

export default function ColetaLicitacoesPage() {
  const [status, setStatus] = useState<StatusColeta | null>(null)
  const [processo, setProcesso] = useState<ProcessoColeta>({
    ativo: false,
    dataAtual: '',
    progresso: 0,
    totalDias: 0,
    diasProcessados: 0,
    ultimaDataSalva: '',
    totalInseridas: 0,
    logs: []
  })
  const [loading, setLoading] = useState(true)
  const [dataManual, setDataManual] = useState('')
  const [alterandoData, setAlterandoData] = useState(false)
  
  // Referencias para controlar a requisição e scroll automático
  const abortControllerRef = useRef<AbortController | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const isStreamingRef = useRef(false)

  useEffect(() => {
    carregarStatus()
  }, [])

  // Auto-scroll para o final dos logs quando novos logs são adicionados
  useEffect(() => {
    if (logsEndRef.current && processo.logs.length > 0) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [processo.logs.length])

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const carregarStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/licitacoes/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const iniciarBuscaNovas = useCallback(async () => {
    // Previne múltiplas execuções simultâneas
    if (isStreamingRef.current) {
      console.log('🚫 Requisição já em andamento, ignorando...')
      return
    }

    try {
      // Cancela requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Cria novo controller para esta requisição
      abortControllerRef.current = new AbortController()
      isStreamingRef.current = true

      setProcesso(prev => ({ 
        ...prev, 
        ativo: true, 
        logs: [
          '🔄 Iniciando busca de novas licitações...',
          '📡 Estabelecendo conexão com streaming...'
        ] 
      }))
      
      const response = await fetch('/api/licitacoes/buscar-novas', {
        method: 'POST',
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
      }

      // Implementar streaming de resposta com tratamento robusto
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (reader) {
        setProcesso(prev => ({
          ...prev,
          logs: [...prev.logs, '✅ Streaming conectado, processando dados...']
        }))

        while (isStreamingRef.current && !abortControllerRef.current?.signal.aborted) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('🎯 Stream finalizado naturalmente')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          // Processa linhas completas
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Mantém linha incompleta no buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim()
              if (data && data !== '[DONE]') {
                setProcesso(prev => ({
                  ...prev,
                  logs: [...prev.logs.slice(-20), data] // Mantém últimos 20 logs
                }))
              }
            }
          }
        }
      }

      setProcesso(prev => ({
        ...prev,
        logs: [...prev.logs, '🎉 Busca concluída com sucesso!']
      }))

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Requisição cancelada pelo usuário')
        setProcesso(prev => ({
          ...prev,
          logs: [...prev.logs, '🛑 Operação cancelada']
        }))
      } else {
        console.error('❌ Erro na busca:', error)
        setProcesso(prev => ({
          ...prev,
          logs: [...prev.logs, `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
        }))
      }
    } finally {
      isStreamingRef.current = false
      setProcesso(prev => ({ ...prev, ativo: false }))
      
      // Aguarda um pouco antes de recarregar status para permitir que o servidor processe
      setTimeout(() => {
        carregarStatus()
      }, 1000)
    }
  }, [])

  const iniciarBuscaTodas = async () => {
    if (!confirm('Isso irá buscar TODAS as licitações abertas. Pode demorar bastante. Continuar?')) {
      return
    }

    try {
      setProcesso(prev => ({ ...prev, ativo: true, logs: ['🔄 Iniciando busca de todas as licitações...'] }))
      
      const response = await fetch('/api/licitacoes/buscar-todas', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        setProcesso(prev => ({
          ...prev,
          logs: [...prev.logs, `✅ Concluído: ${result.totalInseridas} licitações inseridas`]
        }))
      }
    } catch (error) {
      setProcesso(prev => ({
        ...prev,
        logs: [...prev.logs, `❌ Erro: ${error}`]
      }))
    } finally {
      setProcesso(prev => ({ ...prev, ativo: false }))
      carregarStatus()
    }
  }

  const testarAPI = async () => {
    try {
      setStatus(prev => prev ? { ...prev, statusAPI: 'verificando' } : null)
      
      setProcesso(prev => ({ 
        ...prev, 
        ativo: true, 
        logs: ['🧪 Testando conectividade com API externa...', '📡 Executando diagnóstico avançado...'] 
      }))
      
      const response = await fetch('/api/licitacoes/testar-api')
      const result = await response.json()
      
      setStatus(prev => prev ? { 
        ...prev, 
        statusAPI: result.success ? 'online' : 'offline' 
      } : null)
      
      if (result.success) {
        const logs = [
          '✅ API externa funcionando corretamente!',
          `📊 Dados: ${JSON.stringify(result.dados, null, 2)}`,
          `🔍 IP: ${result.diagnostico.ipAtual} | Token: ${result.diagnostico.tokenConfigurado ? 'OK' : 'ERRO'}`
        ]
        
        setProcesso(prev => ({ ...prev, ativo: false, logs }))
        alert('✅ API funcionando!')
        
        // Recarrega status após teste bem-sucedido
        await carregarStatus()
      } else {
        const logs = [
          `❌ Erro: ${result.error}`,
          `📋 Tipo: ${result.tipoErro}`,
          `💡 Solução: ${result.instrucoes}`
        ]
        
        if (result.diagnostico) {
          logs.push(`🔍 IP Atual: ${result.diagnostico.ipAtual}`)
          logs.push(`⏰ Timestamp: ${result.diagnostico.timestamp}`)
        }
        
        setProcesso(prev => ({ ...prev, ativo: false, logs }))
        alert(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      setStatus(prev => prev ? { ...prev, statusAPI: 'offline' } : null)
      setProcesso(prev => ({ 
        ...prev, 
        ativo: false, 
        logs: [
          `💥 Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          '🔧 Verifique se o servidor está funcionando corretamente'
        ] 
      }))
      alert(`❌ Erro ao testar API: ${error}`)
    }
  }

  const limparDuplicatas = async () => {
    if (!confirm('Isso irá remover licitações duplicadas. Continuar?')) {
      return
    }

    try {
      const response = await fetch('/api/licitacoes/limpar-duplicatas', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.removidas} duplicatas removidas`)
        carregarStatus()
      }
    } catch (error) {
      alert(`❌ Erro: ${error}`)
    }
  }

  const alterarDataUltimaConsulta = async () => {
    if (!dataManual) {
      alert('Por favor, informe uma data válida')
      return
    }

    // Validar formato da data (YYYY-MM-DD)
    const regexData = /^\d{4}-\d{2}-\d{2}$/
    if (!regexData.test(dataManual)) {
      alert('Por favor, use o formato YYYY-MM-DD (ex: 2025-06-20)')
      return
    }

    if (!confirm(`Alterar a última data consultada para ${dataManual}? Isso afetará a próxima coleta.`)) {
      return
    }

    try {
      setAlterandoData(true)
      
      const response = await fetch('/api/licitacoes/alterar-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          novaDataUltimaConsulta: dataManual
        })
      })

      const result = await response.json()

      if (response.ok) {
        await carregarStatus()
        setDataManual('')
        alert(`✅ Data alterada com sucesso! Última data consultada agora é: ${dataManual}`)
      } else {
        alert(`❌ Erro ao alterar data: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao alterar data:', error)
      alert('❌ Erro ao alterar data')
    } finally {
      setAlterandoData(false)
    }
  }

  if (loading) {
    return (
      <AdminRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Carregando status...</p>
              </div>
            </div>
          </div>
        </AppLayout>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Coleta de Licitações</h1>
              <p className="text-muted-foreground">
                Gerenciamento manual da coleta de dados da API externa
              </p>
            </div>
            <Button onClick={carregarStatus} variant="outline">
              🔄 Atualizar
            </Button>
          </div>

          {/* Alerta de Configuração */}
          {status && !status.apiConfigurada && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-red-800 dark:text-red-200">
                    ⚠️ Token da API não configurado
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Para usar o sistema de coleta, configure o token no arquivo <code>.env.local</code>:
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded font-mono text-xs">
                    ALERTA_LICITACAO_TOKEN=&quot;seu-token-aqui&quot;
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Após adicionar, reinicie o servidor de desenvolvimento
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta de IP não autorizado */}
          {status && status.apiConfigurada && status.statusAPI === 'offline' && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    🔒 IP não autorizado para este token
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Seu IP atual (<code>{status.ipAtual}</code>) não está autorizado para usar este token.
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Solução:</strong> Acesse o painel da API Externa e autorize este IP:
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-xs">
                    1. Acesse <strong>alertalicitacao.com.br</strong><br/>
                    2. Vá em <strong>&quot;Minha API&quot;</strong><br/>
                    3. Adicione o IP: <strong>{status.ipAtual}</strong><br/>
                    4. Salve as configurações
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Status da Rede e API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌐 Informações de Rede e API
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">IP Atual</p>
                <p className="text-lg font-mono">{status?.ipAtual || 'Carregando...'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último IP Usado</p>
                <p className="text-lg font-mono">{status?.ultimoIPUsado || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status da API</p>
                <Badge variant={
                  status?.statusAPI === 'online' ? 'default' : 
                  status?.statusAPI === 'offline' ? 'destructive' : 'secondary'
                }>
                  {status?.statusAPI === 'online' ? '✅ Online' : 
                   status?.statusAPI === 'offline' ? '❌ Offline' : '🔄 Verificando'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status Token</p>
                <Badge variant={status?.apiConfigurada ? 'default' : 'destructive'}>
                  {status?.apiConfigurada ? '✅ Configurado' : '❌ Não Configurado'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Licitações</p>
                <p className="text-lg font-semibold">{status?.totalLicitacoes?.toLocaleString() || '0'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status da Última Consulta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Status da Última Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Data Consultada</p>
                <p className="text-lg">{status?.ultimaDataConsultada || 'Nunca'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={status?.statusUltimaConsulta === 'sucesso' ? 'default' : 'destructive'}>
                  {status?.statusUltimaConsulta === 'sucesso' ? '✅ Sucesso' : '❌ Erro'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">IP Utilizado</p>
                <p className="text-lg font-mono">{status?.ultimoIPUsado || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Alterar Data Manual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📅 Alterar Última Data Consultada
              </CardTitle>
              <CardDescription>
                Defina manualmente qual foi a última data consultada para ajustar o ponto de início da próxima coleta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="data-manual">Nova Data (YYYY-MM-DD)</Label>
                    <Input
                      id="data-manual"
                      type="date"
                      value={dataManual}
                      onChange={(e) => setDataManual(e.target.value)}
                      disabled={alterandoData || processo.ativo}
                      placeholder="2025-06-20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Data Atual no Sistema</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded text-sm">
                      {status?.ultimaDataConsultada || 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <Button 
                      onClick={alterarDataUltimaConsulta}
                      disabled={alterandoData || processo.ativo || !dataManual}
                      className="w-full"
                      variant="secondary"
                    >
                      {alterandoData ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Alterando...
                        </>
                      ) : (
                        <>📅 Alterar Data</>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Explicação sobre o impacto */}
                <div className="text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="font-medium mb-1">💡 Como funciona:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Esta data define o último dia que foi coletado com sucesso</li>
                    <li>A próxima coleta começará do dia seguinte à data informada</li>
                    <li>Por exemplo: se você informar 2025-06-20, a próxima coleta buscará desde 2025-06-21</li>
                    <li>A coleta sempre para no dia anterior ao atual (nunca coleta o dia corrente)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Manuais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔄 Ações Manuais
              </CardTitle>
              <CardDescription>
                Execute manualmente os processos de coleta e manutenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={iniciarBuscaNovas}
                  disabled={processo.ativo || !status?.apiConfigurada}
                  className="h-20 flex flex-col gap-2"
                >
                  <span className="text-lg">🔍</span>
                  <span>Buscar Novas Licitações</span>
                </Button>
                
                <Button 
                  onClick={iniciarBuscaTodas}
                  disabled={processo.ativo || !status?.apiConfigurada}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <span className="text-lg">🔄</span>
                  <span>Buscar Todas</span>
                </Button>
                
                <Button 
                  onClick={testarAPI}
                  disabled={processo.ativo || !status?.apiConfigurada}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <span className="text-lg">🧪</span>
                  <span>Testar API</span>
                </Button>
                
                <Button 
                  onClick={limparDuplicatas}
                  disabled={processo.ativo}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  title="Remove licitações duplicadas por ID, conteúdo similar e registros inválidos"
                >
                  <span className="text-lg">🧹</span>
                  <span>Limpar Duplicatas</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Processo em Andamento */}
          {processo.ativo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    🔄 Processamento em Andamento
                  </span>
                  <Button 
                    onClick={() => {
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort()
                      }
                      isStreamingRef.current = false
                    }}
                    variant="destructive"
                    size="sm"
                  >
                    🛑 Cancelar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processo.progresso > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Progresso: {processo.diasProcessados}/{processo.totalDias} dias</span>
                      <span>{processo.progresso.toFixed(1)}%</span>
                    </div>
                    <Progress value={processo.progresso} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Logs em Tempo Real:</h4>
                    <Badge variant="secondary">{processo.logs.length} mensagens</Badge>
                  </div>
                  <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-40 overflow-y-auto relative">
                    {processo.logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-500 text-xs">[{String(index + 1).padStart(2, '0')}]</span> {log}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                    
                    {/* Indicador de atividade */}
                    {isStreamingRef.current && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-green-900 px-2 py-1 rounded text-xs">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Streaming ativo
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Estatísticas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-2xl font-bold text-blue-600">RS</p>
                  <p className="text-sm text-muted-foreground">UF de Pesquisa</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="text-2xl font-bold text-green-600">6</p>
                  <p className="text-sm text-muted-foreground">Modalidades Ativas</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <p className="text-2xl font-bold text-purple-600">{status?.totalLicitacoes || 0}</p>
                  <p className="text-sm text-muted-foreground">Total no Banco</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AdminRoute>
  )
} 