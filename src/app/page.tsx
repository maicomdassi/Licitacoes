'use client'

import { useState, useEffect } from 'react'
import { LicitacaoForm } from '@/components/licitacoes/LicitacaoForm'
import { LicitacaoCard } from '@/components/licitacoes/LicitacaoCard'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Licitacao } from '@/types/database.types'
import { getLicitacoes, updateLicitacao, getPortaisUnicos, getConfiguracao, setConfiguracao, supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ChevronLeft, ChevronRight, Filter, Info, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Home() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [itensPorPagina] = useState(5) // Reduzindo para 5 para melhor visualização dos cards
  const [filtroInteresse, setFiltroInteresse] = useState<'P' | 'S' | 'N'>('P')
  const [filtroPortal, setFiltroPortal] = useState<string>('carregando')
  const [portaisDisponiveis, setPortaisDisponiveis] = useState<string[]>([])
  const [licitacaoEmEdicao, setLicitacaoEmEdicao] = useState<Licitacao | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('useEffect disparado:', { pagina, filtroInteresse, filtroPortal })
    // Só carregar licitações se o portal não estiver em estado de carregamento
    if (filtroPortal !== 'carregando') {
      console.log('Chamando carregarLicitacoes do useEffect')
      carregarLicitacoes()
    } else {
      console.log('Portal ainda carregando, não chamando carregarLicitacoes')
    }
  }, [pagina, filtroInteresse, filtroPortal])

  useEffect(() => {
    carregarPortais()
  }, [filtroInteresse]) // Recarregar portais quando o filtro de interesse mudar

  useEffect(() => {
    carregarPortalPadrao()
  }, [])

  const carregarPortalPadrao = async () => {
    try {
      console.log('🔄 Carregando portal padrão...')
      const { data: portalPadrao, error } = await getConfiguracao('portal_padrao')
      
      const portalParaTestar = portalPadrao || 'compras.rs.gov.br'
      console.log('Portal a ser testado:', portalParaTestar)
      
      // Verificar se o portal existe nos dados
      const { data: teste } = await supabase
        .from('licitacoes')
        .select('id', { count: 'exact' })
        .ilike('link_externo', `%${portalParaTestar}%`)
        .limit(1)
      
      if (teste && teste.length > 0) {
        console.log('✅ Portal encontrado nos dados:', portalParaTestar)
        setFiltroPortal(portalParaTestar)
      } else {
        console.log('❌ Portal não encontrado nos dados, buscando alternativo...')
        
        // Buscar um portal que tenha dados
        const { data: portaisDisponiveis } = await getPortaisUnicos('P')
        const portalAlternativo = portaisDisponiveis?.find(p => p !== 'todos') || 'todos'
        
        console.log('🔄 Usando portal alternativo:', portalAlternativo)
        setFiltroPortal(portalAlternativo)
        
        // Atualizar configuração com portal que funciona
        if (portalAlternativo !== 'todos') {
          await setConfiguracao('portal_padrao', portalAlternativo)
          console.log('💾 Portal padrão atualizado para:', portalAlternativo)
        }
      }
      
      // Forçar carregamento das licitações após definir o portal
      setTimeout(() => {
        console.log('🚀 Carregando licitações com portal definido')
        carregarLicitacoes()
      }, 100)
    } catch (error) {
      console.error('❌ Erro ao carregar portal padrão:', error)
      setFiltroPortal('todos') // fallback seguro
      
      // Forçar carregamento das licitações mesmo com erro
      setTimeout(() => {
        carregarLicitacoes()
      }, 100)
    }
  }

  const carregarPortais = async () => {
    try {
      const { data, error } = await getPortaisUnicos(filtroInteresse)
      if (error) {
        console.warn('Erro ao carregar portais:', error)
        return
      }
      setPortaisDisponiveis(data)
      
      // Se o portal atual não está mais disponível e não está carregando, resetar para portal padrão
      if (filtroPortal !== 'carregando' && filtroPortal !== 'todos' && !data.includes(filtroPortal)) {
        setTimeout(async () => {
          const { data: portalPadrao } = await getConfiguracao('portal_padrao')
          const novoPortal = (portalPadrao && data.includes(portalPadrao)) ? portalPadrao : 'todos'
          setFiltroPortal(novoPortal)
          setPagina(0)
        }, 0)
      }
    } catch (error) {
      console.warn('Erro ao carregar portais:', error)
    }
  }

  const carregarLicitacoes = async (options?: { forceRefresh?: boolean }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('=== CARREGANDO LICITAÇÕES ===')
      console.log('Estado atual dos filtros:', { 
        interesse: filtroInteresse, 
        portal: filtroPortal,
        portalParaFiltro: (filtroPortal !== 'todos' && filtroPortal !== 'carregando') ? filtroPortal : undefined,
        isCarregando: filtroPortal === 'carregando'
      })
      
      // Se ainda está carregando o portal, não fazer a consulta
      if (filtroPortal === 'carregando') {
        console.log('Portal ainda carregando, pulando consulta')
        setIsLoading(false)
        return
      }
      
      const { data, total } = await getLicitacoes(pagina, itensPorPagina, filtroInteresse, {
        portal: (filtroPortal !== 'todos' && filtroPortal !== 'carregando') ? filtroPortal : undefined
      })
      
      if (!data || data.length === 0) {
        console.log('Nenhuma licitação encontrada')
        setLicitacoes([])
        setTotalRegistros(0)
        return
      }

      console.log(`Carregadas ${data.length} licitações`)
      
      // Se for um refresh forçado, mesclar com os dados existentes
      if (options?.forceRefresh && licitacoes.length > 0) {
        // Filtrar para evitar duplicatas (usando o ID como chave)
        const idsExistentes = new Set(licitacoes.map(item => item.id))
        const novosItens = data.filter(item => !idsExistentes.has(item.id))
        
        // Adicionar apenas os novos itens à lista atual
        if (novosItens.length > 0) {
          setLicitacoes(prev => [...prev, ...novosItens].slice(0, itensPorPagina))
        }
      } else {
        // Carregamento normal
        setLicitacoes(data)
      }
      
      setTotalRegistros(total)
    } catch (error) {
      console.error('Erro detalhado:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar licitações. Por favor, tente novamente.')
      setLicitacoes([])
      setTotalRegistros(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditarLicitacao = (licitacao: Licitacao) => {
    setLicitacaoEmEdicao(licitacao)
  }

  const handleSemInteresse = async (licitacao: Licitacao) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Atualizar diretamente para sem interesse
      await updateLicitacao(licitacao.id, { interece: 'N' })
      
      // Remover da lista atual se não estamos vendo "N"
      if (filtroInteresse !== 'N') {
        setLicitacoes(prev => {
          const novaLista = prev.filter(item => item.id !== licitacao.id)
          
          // Se a lista ficou menor, carregar mais itens
          if (novaLista.length < itensPorPagina) {
            setTimeout(() => {
              carregarLicitacoes({ forceRefresh: true })
            }, 300)
          }
          
          return novaLista
        })
      } else {
        // Se estamos vendo "N", recarregar
        await carregarLicitacoes()
      }
    } catch (error) {
      console.error('Erro ao marcar sem interesse:', error)
      setError(error instanceof Error ? error.message : 'Erro ao atualizar licitação.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComInteresse = (licitacao: Licitacao) => {
    // Preparar a licitação para edição com interesse já marcado
    setLicitacaoEmEdicao({
      ...licitacao,
      interece: 'S' // Forçar interesse como 'S'
    })
  }

  const handleSubmitEdicao = async (data: any) => {
    if (!licitacaoEmEdicao) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Preparar os dados para atualização - sempre será 'S' (com interesse)
      const updateData: Partial<Licitacao> = {
        interece: 'S', // Sempre 'S' quando vem do modal
        valor_max: data.valor_max,
        data_leilao: data.data_leilao
      }
      
      await updateLicitacao(licitacaoEmEdicao.id, updateData)
      
      setLicitacaoEmEdicao(null)
      
      // Remover da lista atual se não estamos vendo "S"
      if (filtroInteresse !== 'S') {
        setLicitacoes(prev => {
          const novaLista = prev.filter(item => item.id !== licitacaoEmEdicao.id)
          
          if (novaLista.length < itensPorPagina) {
            setTimeout(() => {
              carregarLicitacoes({ forceRefresh: true })
            }, 300)
          }
          
          return novaLista
        })
      } else {
        // Se estamos vendo "S", recarregar
        await carregarLicitacoes()
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setError(error instanceof Error ? error.message : 'Erro ao atualizar licitação. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Cálculo do total de páginas
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina)

  const getStatusLabel = (status: 'P' | 'S' | 'N') => {
    switch (status) {
      case 'P': return 'Pendentes'
      case 'S': return 'Com Interesse'
      case 'N': return 'Sem Interesse'
      default: return status
    }
  }

  const getStatusColor = (status: 'P' | 'S' | 'N') => {
    switch (status) {
      case 'P': return 'bg-yellow-500'
      case 'S': return 'bg-green-500'
      case 'N': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="py-6">
          <div className="mb-8">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Filter size={18} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-medium">Filtrar Licitações</h2>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filtroInteresse === 'P' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFiltroInteresse('P')
                      setPagina(0)
                    }}
                    className={`gap-2 ${filtroInteresse === 'P' ? '' : 'hover:bg-yellow-500/10'}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${getStatusColor('P')}`}></span>
                    Pendentes
                  </Button>
                  <Button
                    variant={filtroInteresse === 'S' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFiltroInteresse('S')
                      setPagina(0)
                    }}
                    className={`gap-2 ${filtroInteresse === 'S' ? '' : 'hover:bg-green-500/10'}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${getStatusColor('S')}`}></span>
                    Com Interesse
                  </Button>
                  <Button
                    variant={filtroInteresse === 'N' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFiltroInteresse('N')
                      setPagina(0)
                    }}
                    className={`gap-2 ${filtroInteresse === 'N' ? '' : 'hover:bg-red-500/10'}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${getStatusColor('N')}`}></span>
                    Sem Interesse
                  </Button>
                </div>
              </div>

              {/* Filtro de Portal */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label htmlFor="filtro-portal" className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-fit">
                  Filtrar por Portal:
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={filtroPortal}
                    onValueChange={(value) => {
                      setFiltroPortal(value)
                      setPagina(0)
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Selecione um portal" />
                    </SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="todos">Todos os Portais</SelectItem>
                    {portaisDisponiveis.map((portal) => (
                      <SelectItem key={portal} value={portal}>
                        {portal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                  {portaisDisponiveis.length > 0 && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {portaisDisponiveis.length} portal{portaisDisponiveis.length !== 1 ? 'ais' : ''} disponível{portaisDisponiveis.length !== 1 ? 'eis' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6 flex items-start gap-2" role="alert">
              <Info size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro!</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {isLoading && licitacoes.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 size={32} className="animate-spin text-primary mb-2" />
              <span className="text-muted-foreground">Carregando licitações...</span>
            </div>
          ) : licitacoes.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 rounded-full bg-muted mb-2">
                <Info size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">Nenhuma licitação encontrada</h3>
              <p className="text-muted-foreground">
                Não existem licitações com o status {getStatusLabel(filtroInteresse).toLowerCase()}
                {filtroPortal !== 'todos' && ` no portal ${filtroPortal}`}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {licitacoes.map((licitacao) => (
                  <LicitacaoCard
                    key={licitacao.id}
                    licitacao={licitacao}
                    onEdit={handleEditarLicitacao}
                    onSemInteresse={handleSemInteresse}
                    onComInteresse={handleComInteresse}
                  />
                ))}
                
                {/* Indicador de carregamento de mais itens */}
                {isLoading && licitacoes.length > 0 && (
                  <div className="flex justify-center py-4">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              {/* Controles de paginação */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-8 pb-8">
                <div className="text-sm text-muted-foreground">
                  Mostrando {licitacoes.length} de {totalRegistros} registros
                  {filtroPortal !== 'todos' && filtroPortal !== 'carregando' && (
                    <span className="block md:inline md:ml-2">
                      • Portal: {filtroPortal}
                    </span>
                  )}
                  {filtroPortal === 'carregando' && (
                    <span className="block md:inline md:ml-2">
                      • Carregando portal padrão...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina(p => Math.max(0, p - 1))}
                    disabled={pagina === 0}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                  </Button>
                  <div className="text-sm px-3 py-1 bg-muted rounded">
                    Página {pagina + 1} de {totalPaginas || 1}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina(p => p + 1)}
                    disabled={pagina >= totalPaginas - 1 || totalPaginas === 0}
                    className="flex items-center gap-1"
                  >
                    <span>Próxima</span>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}

          <Dialog
            open={!!licitacaoEmEdicao}
            onOpenChange={(open: boolean) => !open && setLicitacaoEmEdicao(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Marcar Interesse na Licitação</DialogTitle>
              </DialogHeader>
              {licitacaoEmEdicao && (
                <LicitacaoForm
                  licitacao={licitacaoEmEdicao}
                  onSubmit={handleSubmitEdicao}
                  onCancel={() => setLicitacaoEmEdicao(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <footer className="border-t py-4 bg-background">
          <div className="container max-w-5xl mx-auto text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sistema de Gestão de Licitações
          </div>
        </footer>
      </AppLayout>
    </ProtectedRoute>
  )
}
