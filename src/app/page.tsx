'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Input } from '@/components/ui/input'
import { Licitacao } from '@/types/database.types'
import { getLicitacoes, getAllLicitacoes, updateLicitacao, getPortaisUnicos, getConfiguracao, setConfiguracao, supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ChevronLeft, ChevronRight, Filter, Info, Loader2, Search, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Função para normalizar texto removendo acentos e convertendo para lowercase
const normalizarTexto = (texto: string): string => {
  const resultado = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
  
  return resultado
}

export default function Home() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
  const [licitacoesFiltradas, setLicitacoesFiltradas] = useState<Licitacao[]>([])
  const [licitacoesPaginadas, setLicitacoesPaginadas] = useState<Licitacao[]>([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [itensPorPagina] = useState(5) // Reduzindo para 5 para melhor visualização dos cards
  const [filtroInteresse, setFiltroInteresse] = useState<'P' | 'S' | 'N'>('P')
  const [filtroPortal, setFiltroPortal] = useState<string>('carregando')
  const [portaisDisponiveis, setPortaisDisponiveis] = useState<string[]>([])
  const [licitacaoEmEdicao, setLicitacaoEmEdicao] = useState<Licitacao | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtro por palavras-chave
  const [palavrasChave, setPalavrasChave] = useState<string[]>([])
  const [inputPalavrasChave, setInputPalavrasChave] = useState('')



  useEffect(() => {
    const temFiltroAtivo = palavrasChave.length > 0
    console.log('🔄 useEffect PAGINAÇÃO disparado:', { 
      pagina, 
      filtroInteresse, 
      filtroPortal,
      palavrasChaveAtivas: palavrasChave.length,
      estrategia: temFiltroAtivo ? 'FILTRO_LOCAL' : 'PAGINACAO_BANCO'
    })
    
    // Só carregar licitações se o portal não estiver em estado de carregamento
    if (filtroPortal !== 'carregando') {
      console.log('✅ Chamando carregarLicitacoes do useEffect')
      carregarLicitacoes()
    } else {
      console.log('⏳ Portal ainda carregando, não chamando carregarLicitacoes')
    }
  }, [pagina, filtroInteresse, filtroPortal])

  // useEffect específico para mudanças de palavras-chave
  useEffect(() => {
    console.log('🔍 useEffect PALAVRAS-CHAVE disparado:', { 
      palavrasChave, 
      filtroPortal,
      isCarregando: filtroPortal === 'carregando'
    })
    
    // Quando palavras-chave mudam, sempre recarregar dados
    if (filtroPortal !== 'carregando') {
      console.log('✅ Recarregando dados por mudança de palavras-chave')
      carregarLicitacoes()
    }
  }, [palavrasChave])

  useEffect(() => {
    carregarPortais()
  }, [filtroInteresse]) // Recarregar portais quando o filtro de interesse mudar

  useEffect(() => {
    console.log('🚀 Componente Home montado - iniciando carregamento')
    carregarPortalPadrao()
  }, [])

  // Função para aplicar filtro por palavras-chave
  const aplicarFiltroPalavrasChave = useCallback(() => {
    console.log('🔍 Aplicando filtro por palavras-chave:', { 
      palavrasChave, 
      totalLicitacoes: licitacoes.length,
      filtroPortal,
      isLoading
    })
    
    // Se não há licitações carregadas ainda, não aplicar filtro
    if (licitacoes.length === 0) {
      console.log('⏳ Nenhuma licitação carregada ainda, aguardando...')
      return
    }
    
    if (palavrasChave.length === 0) {
      console.log('📝 Nenhuma palavra-chave, mostrando todas as licitações')
      setLicitacoesFiltradas(licitacoes)
      return
    }

    const resultadoFiltrado = licitacoes.filter(licitacao => {
      const objetoNormalizado = normalizarTexto(licitacao.objeto || '')
      
      // Verificar se alguma palavra-chave está presente no objeto
      const temPalavra = palavrasChave.some(palavra => {
        const palavraNormalizada = normalizarTexto(palavra)
        const encontrou = objetoNormalizado.includes(palavraNormalizada)
        
        if (encontrou) {
          console.log('✅ Encontrou palavra:', { 
            palavra, 
            palavraNormalizada, 
            objeto: licitacao.objeto?.substring(0, 100) + '...',
            objetoNormalizado: objetoNormalizado.substring(0, 100) + '...'
          })
        }
        
        return encontrou
      })
      
      return temPalavra
    })

    console.log('📊 Resultado do filtro:', { 
      totalOriginal: licitacoes.length,
      totalFiltradas: resultadoFiltrado.length,
      palavrasChave,
      dadosOriginais: licitacoes.map(l => l.id)
    })

    setLicitacoesFiltradas(resultadoFiltrado)
  }, [licitacoes, palavrasChave])

  // Função para aplicar paginação aos dados filtrados
  const aplicarPaginacao = useCallback(() => {
    const temFiltroAtivo = palavrasChave.length > 0
    
    console.log('📄 INÍCIO aplicarPaginacao:', {
      temFiltroAtivo,
      licitacoesFiltradas: licitacoesFiltradas.length,
      pagina,
      itensPorPagina
    })
    
    if (temFiltroAtivo) {
      // COM FILTRO: Paginação local nos dados filtrados
      if (licitacoesFiltradas.length === 0) {
        console.log('📄 Nenhum dado filtrado, limpando paginação')
        setLicitacoesPaginadas([])
        return
      }
      
      const inicio = pagina * itensPorPagina
      const fim = inicio + itensPorPagina
      const dadosPaginados = licitacoesFiltradas.slice(inicio, fim)
      
      console.log('📄 Aplicando paginação LOCAL (com filtro):', { 
        pagina, 
        inicio, 
        fim, 
        totalFiltradas: licitacoesFiltradas.length,
        dadosPaginados: dadosPaginados.length
      })
      
      setLicitacoesPaginadas(dadosPaginados)
    } else {
      // SEM FILTRO: Usar dados diretamente do banco (já paginados)
      console.log('📄 Usando dados diretos do banco (sem filtro):', { 
        totalLicitacoes: licitacoesFiltradas.length,
        pagina,
        estrategia: 'BANCO_PAGINADO',
        idsDisponveis: licitacoesFiltradas.map(l => l.id)
      })
      
      setLicitacoesPaginadas(licitacoesFiltradas)
      console.log('✅ licitacoesPaginadas definidas:', licitacoesFiltradas.length, 'registros')
    }
    
    console.log('📄 FIM aplicarPaginacao')
  }, [licitacoesFiltradas, pagina, itensPorPagina, palavrasChave])

  // useEffect para aplicar filtro por palavras-chave
  useEffect(() => {
    console.log('🔍 useEffect APLICAR FILTRO disparado:', {
      licitacoesLength: licitacoes.length,
      palavrasChaveLength: palavrasChave.length,
      filtroPortal
    })
    aplicarFiltroPalavrasChave()
  }, [aplicarFiltroPalavrasChave])

  // useEffect para aplicar paginação aos dados filtrados
  useEffect(() => {
    console.log('📄 useEffect APLICAR PAGINAÇÃO disparado:', {
      licitacoesFiltradas: licitacoesFiltradas.length,
      pagina,
      palavrasChaveLength: palavrasChave.length
    })
    aplicarPaginacao()
  }, [aplicarPaginacao])

  // useEffect para resetar página quando ADICIONA palavras-chave (não quando remove)
  useEffect(() => {
    if (palavrasChave.length > 0) {
      console.log('📄 Resetando página para 0 devido a filtro ativo')
      setPagina(0)
    }
  }, [palavrasChave.length]) // Usar .length para evitar reset desnecessário

  // useEffect para garantir sincronização quando portal muda
  useEffect(() => {
    // Quando o portal muda e há licitações carregadas, reaplica o filtro
    if (licitacoes.length > 0 && palavrasChave.length === 0) {
      console.log('🔄 Portal mudou, sincronizando licitações filtradas...')
      setLicitacoesFiltradas(licitacoes)
    }
  }, [filtroPortal, licitacoes, palavrasChave.length])

  // useEffect para resetar página quando ADICIONA palavras-chave (não quando remove)
  useEffect(() => {
    console.log('🎨 ESTADOS DE RENDERIZAÇÃO:', {
      isLoading,
      licitacoes: licitacoes.length,
      licitacoesFiltradas: licitacoesFiltradas.length,
      licitacoesPaginadas: licitacoesPaginadas.length,
      palavrasChave: palavrasChave.length,
      filtroPortal,
      error: !!error,
      totalRegistros
    })
  }, [isLoading, licitacoes.length, licitacoesFiltradas.length, licitacoesPaginadas.length, palavrasChave.length, filtroPortal, error, totalRegistros])



  // Função para adicionar palavras-chave
  const adicionarPalavrasChave = () => {
    if (!inputPalavrasChave.trim()) return

    // Dividir por vírgula ou espaço e filtrar vazias
    const novasPalavras = inputPalavrasChave
      .split(/[,\s]+/)
      .map(palavra => palavra.trim())
      .filter(palavra => palavra.length > 0)
      .filter(palavra => !palavrasChave.includes(palavra)) // Evitar duplicatas

    if (novasPalavras.length > 0) {
      console.log('➕ Adicionando palavras-chave:', novasPalavras)
      setPalavrasChave(prev => {
        const novasChaves = [...prev, ...novasPalavras]
        console.log('📝 Total de palavras-chave:', novasChaves)
        return novasChaves
      })
      setInputPalavrasChave('')
      // Resetar página ao adicionar palavras-chave
      setPagina(0)
    }
  }

  // Função para remover palavra-chave
  const removerPalavraChave = (palavra: string) => {
    console.log('🗑️ Removendo palavra-chave:', palavra)
    setPalavrasChave(prev => {
      const novasChaves = prev.filter(p => p !== palavra)
      console.log('📝 Palavras-chave restantes:', novasChaves)
      return novasChaves
    })
    // Sempre resetar página ao remover palavra-chave
    setPagina(0)
  }

  // Função para limpar todas as palavras-chave
  const limparPalavrasChave = () => {
    console.log('🧹 Limpando todas as palavras-chave e resetando para página 0')
    setPalavrasChave([])
    setInputPalavrasChave('')
    setPagina(0) // Resetar página para voltar à paginação do banco
  }

  // Função para lidar com Enter no input
  const handleKeyPressInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      adicionarPalavrasChave()
    }
  }

  const carregarPortalPadrao = async () => {
    try {
      console.log('🔄 Carregando portal padrão...')
      
      // Primeiro, carregar portais disponíveis
      await carregarPortais()
      
      // Depois, tentar carregar o portal padrão configurado
      const { data: portalPadrao, error } = await getConfiguracao('portal_padrao')
      
      if (portalPadrao) {
        console.log('✅ Portal padrão encontrado na configuração:', portalPadrao)
        setFiltroPortal(portalPadrao)
      } else {
        console.log('⚠️ Nenhum portal padrão configurado, usando "todos"')
        setFiltroPortal('todos')
      }
      
      // Carregar licitações imediatamente após definir o portal
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
      console.log('🔄 Carregando portais disponíveis...')
      const { data, error } = await getPortaisUnicos(filtroInteresse)
      if (error) {
        console.warn('Erro ao carregar portais:', error)
        return
      }
      
      console.log('✅ Portais encontrados:', data?.length || 0)
      setPortaisDisponiveis(data || [])
      
    } catch (error) {
      console.warn('Erro ao carregar portais:', error)
      setPortaisDisponiveis([])
    }
  }

  const carregarLicitacoes = async (options?: { forceRefresh?: boolean }) => {
    try {
      console.log('🔄 INÍCIO carregarLicitacoes')
      setIsLoading(true)
      setError(null)
      
      const temFiltroAtivo = palavrasChave.length > 0
      
      console.log('=== CARREGANDO LICITAÇÕES ===')
      console.log('Estado atual dos filtros:', { 
        interesse: filtroInteresse, 
        portal: filtroPortal,
        portalParaFiltro: (filtroPortal !== 'todos' && filtroPortal !== 'carregando') ? filtroPortal : undefined,
        isCarregando: filtroPortal === 'carregando',
        palavrasChaveAtivas: palavrasChave,
        estrategia: temFiltroAtivo ? 'TODOS_REGISTROS' : 'PAGINACAO_BANCO'
      })
      
      // Se ainda está carregando o portal, não fazer a consulta
      if (filtroPortal === 'carregando') {
        console.log('⏳ Portal ainda carregando, pulando consulta')
        setIsLoading(false)
        return
      }
      
      let data: Licitacao[]
      let total: number
      
      console.log('📊 Iniciando consulta ao banco de dados...')
      
      if (temFiltroAtivo) {
        // ESTRATÉGIA 1: Com filtro de palavras-chave - carregar TODOS os registros
        console.log('📊 Carregando TODOS os registros para filtro de palavras-chave...')
        const result = await getAllLicitacoes(filtroInteresse, {
          portal: (filtroPortal !== 'todos' && filtroPortal !== 'carregando') ? filtroPortal : undefined
        })
        data = result.data
        total = result.total
        console.log(`✅ Carregados ${data.length} registros completos para filtro`)
      } else {
        // ESTRATÉGIA 2: Sem filtro de palavras-chave - usar paginação no banco
        console.log('📄 Usando paginação no banco (sem filtro de palavras-chave)...')
        console.log('Parâmetros da consulta:', {
          pagina,
          itensPorPagina,
          filtroInteresse,
          portal: (filtroPortal !== 'todos' && filtroPortal !== 'carregando') ? filtroPortal : undefined
        })
        
        const result = await getLicitacoes(pagina, itensPorPagina, filtroInteresse, {
          portal: (filtroPortal !== 'todos' && filtroPortal !== 'carregando') ? filtroPortal : undefined
        })
        data = result.data
        total = result.total
        console.log(`✅ Carregados ${data.length} registros com paginação, total: ${total}`)
      }
      
      console.log('📋 Dados recebidos do banco:', {
        length: data?.length || 0,
        total,
        primeirosIds: data?.slice(0, 3).map(l => l.id) || [],
        hasData: data && data.length > 0
      })
      
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma licitação encontrada')
        setLicitacoes([])
        setLicitacoesFiltradas([])
        setTotalRegistros(0)
        return
      }

      // Sempre definir os dados completos
      console.log('💾 Definindo dados no estado...')
      setLicitacoes(data)
      setTotalRegistros(total)
      
      // Se não há filtro de palavras-chave ativo, inicializar filtradas igual aos dados originais
      if (!temFiltroAtivo) {
        setLicitacoesFiltradas(data)
        console.log('🔄 Sem filtro ativo - inicializando licitacoesFiltradas:', data.length)
        console.log('📋 IDs das licitações carregadas:', data.map(l => l.id))
      }
      // Se há filtro ativo, o useEffect do filtro será executado automaticamente
      
      console.log(`📊 Estado final: ${data.length} licitações carregadas, total: ${total}, página: ${pagina}`)
      
    } catch (error) {
      console.error('❌ Erro detalhado em carregarLicitacoes:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar licitações. Por favor, tente novamente.')
      setLicitacoes([])
      setLicitacoesFiltradas([])
      setTotalRegistros(0)
    } finally {
      console.log('🏁 FIM carregarLicitacoes - setIsLoading(false)')
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
      
      // Sempre recarregar dados para manter integridade do filtro
      console.log('♻️ Recarregando dados após alteração de interesse...')
      await carregarLicitacoes()
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
      
      // Sempre recarregar dados para manter integridade do filtro
      console.log('♻️ Recarregando dados após edição de licitação...')
      await carregarLicitacoes()
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setError(error instanceof Error ? error.message : 'Erro ao atualizar licitação. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }



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
                      <SelectValue placeholder={filtroPortal === 'carregando' ? 'Carregando...' : 'Selecione um portal'} />
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

              {/* Filtro por Palavras-chave */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filtrar por Palavras-chave no Objeto:
                </label>
                
                {/* Input para adicionar palavras-chave */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Digite palavras-chave separadas por vírgula ou espaço..."
                        value={inputPalavrasChave}
                        onChange={(e) => setInputPalavrasChave(e.target.value)}
                        onKeyPress={handleKeyPressInput}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={adicionarPalavrasChave}
                      disabled={!inputPalavrasChave.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                  
                  {palavrasChave.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={limparPalavrasChave}
                      className="text-destructive hover:text-destructive"
                    >
                      <X size={16} className="mr-1" />
                      Limpar Tudo
                    </Button>
                  )}
                </div>

                {/* Tags das palavras-chave ativas */}
                {palavrasChave.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center">
                      Filtrando por:
                    </span>
                    {palavrasChave.map((palavra, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md border border-primary/20"
                      >
                        <span>{palavra}</span>
                        <button
                          onClick={() => removerPalavraChave(palavra)}
                          className="hover:bg-primary/20 rounded p-0.5"
                          title={`Remover "${palavra}"`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
          ) : licitacoesFiltradas.length === 0 && palavrasChave.length > 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="p-4 rounded-full bg-muted mb-2">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                Nenhuma licitação corresponde às palavras-chave selecionadas: {palavrasChave.join(', ')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={limparPalavrasChave}
                className="mt-4"
              >
                <X size={16} className="mr-1" />
                Limpar filtros de palavras-chave
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {licitacoesPaginadas.map((licitacao) => (
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
                  {palavrasChave.length > 0 ? (
                    <>
                      Mostrando {licitacoesPaginadas.length} de {licitacoesFiltradas.length} registros filtrados (página {pagina + 1})
                      <span className="block md:inline md:ml-2">
                        • Filtrado por: {palavrasChave.join(', ')}
                      </span>
                    </>
                  ) : (
                    <>
                      Mostrando {licitacoes.length} de {totalRegistros} registros
                    </>
                  )}
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
                    Página {pagina + 1} de {Math.ceil((palavrasChave.length > 0 ? licitacoesFiltradas.length : totalRegistros) / itensPorPagina) || 1}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina(p => p + 1)}
                    disabled={pagina >= Math.ceil((palavrasChave.length > 0 ? licitacoesFiltradas.length : totalRegistros) / itensPorPagina) - 1}
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
