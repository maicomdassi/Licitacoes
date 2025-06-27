import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface LicitacaoAnalise {
  id: number
  titulo: string
  objeto: string
  link_externo: string
  interece: 'P' | 'S' | 'N'
  created_at: string
  id_licitacao: string
}

interface GrupoDuplicatas {
  codigo: string
  quantidade: number
  similaridade: number
  registros: LicitacaoAnalise[]
  mantido: LicitacaoAnalise
  anulados: LicitacaoAnalise[]
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando detecção inteligente de duplicados (apenas registros pendentes)...')
    
    // Buscar apenas registros pendentes para análise
    const { data: todosRegistros, error } = await supabase
      .from('licitacoes')
      .select('id, titulo, objeto, link_externo, interece, created_at, id_licitacao')
      .eq('interece', 'P') // Apenas registros pendentes
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Erro ao buscar registros: ${error.message}`)
    }

    if (!todosRegistros || todosRegistros.length === 0) {
      return NextResponse.json({
        success: true,
        grupos: [],
        totalAnalisados: 0,
        totalDuplicados: 0,
        totalGrupos: 0
      })
    }

    // Função para normalizar texto
    const normalizarTexto = (texto: string): string => {
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, ' ') // Remove pontuação
        .replace(/\s+/g, ' ') // Remove espaços extras
        .trim()
    }

    // Função para extrair código numérico do título (formato: XXXX/YYYY)
    const extrairCodigo = (titulo: string): string | null => {
      const regex = /(\d{3,4}\/\d{4})/
      const match = titulo.match(regex)
      return match ? match[1] : null
    }

    // Função para calcular similaridade entre dois textos
    const calcularSimilaridade = (texto1: string, texto2: string): number => {
      const palavras1 = normalizarTexto(texto1).split(' ').filter(p => p.length > 2)
      const palavras2 = normalizarTexto(texto2).split(' ').filter(p => p.length > 2)
      
      if (palavras1.length === 0 || palavras2.length === 0) return 0
      
      const intersecao = palavras1.filter(p => palavras2.includes(p))
      const uniao = [...new Set([...palavras1, ...palavras2])]
      
      return (intersecao.length / uniao.length) * 100
    }

    // Função para determinar qual item manter (sempre o mais antigo, já que todos são pendentes)
    const definirItemParaManter = (registros: LicitacaoAnalise[]): LicitacaoAnalise => {
      // Entre os registros pendentes, manter sempre o mais antigo
      return registros.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
    }

    // Etapa 1: Agrupar por código extraído do título
    const gruposPorCodigo: { [codigo: string]: LicitacaoAnalise[] } = {}
    
    todosRegistros.forEach((registro: any) => {
      const codigo = extrairCodigo(registro.titulo || '')
      if (codigo) {
        if (!gruposPorCodigo[codigo]) {
          gruposPorCodigo[codigo] = []
        }
        gruposPorCodigo[codigo].push(registro)
      }
    })

    console.log(`📊 Encontrados ${Object.keys(gruposPorCodigo).length} códigos únicos`)

    // Etapa 2: Analisar similaridade dentro de cada grupo
    const gruposDuplicatas: GrupoDuplicatas[] = []
    
    for (const [codigo, registros] of Object.entries(gruposPorCodigo)) {
      if (registros.length < 2) continue // Pular grupos com apenas 1 item
      
      console.log(`🔍 Analisando grupo ${codigo} com ${registros.length} registros`)
      
      // Comparar todos os pares no grupo
      const duplicatasConfirmadas: LicitacaoAnalise[] = []
      const jaAnalisados = new Set<number>()
      
      for (let i = 0; i < registros.length; i++) {
        if (jaAnalisados.has(registros[i].id)) continue
        
        const grupoSimilar = [registros[i]]
        jaAnalisados.add(registros[i].id)
        
        for (let j = i + 1; j < registros.length; j++) {
          if (jaAnalisados.has(registros[j].id)) continue
          
          const similaridade = calcularSimilaridade(registros[i].objeto, registros[j].objeto)
          
          console.log(`📝 Comparando registros ${registros[i].id} vs ${registros[j].id}: ${similaridade.toFixed(1)}% similares`)
          
          if (similaridade >= 90) {
            grupoSimilar.push(registros[j])
            jaAnalisados.add(registros[j].id)
          }
        }
        
        // Se encontrou duplicatas similares (2+ itens)
        if (grupoSimilar.length >= 2) {
          const mantido = definirItemParaManter(grupoSimilar)
          const anulados = grupoSimilar.filter(r => r.id !== mantido.id)
          const similaridadeMedia = grupoSimilar.length > 1 ? 
            grupoSimilar.slice(1).reduce((acc, r) => acc + calcularSimilaridade(mantido.objeto, r.objeto), 0) / (grupoSimilar.length - 1) : 
            100
          
          gruposDuplicatas.push({
            codigo,
            quantidade: grupoSimilar.length,
            similaridade: Math.round(similaridadeMedia),
            registros: grupoSimilar,
            mantido,
            anulados
          })
          
          console.log(`✅ Grupo duplicata confirmado: ${codigo} (${grupoSimilar.length} itens, ${similaridadeMedia.toFixed(1)}% similares)`)
        }
      }
    }

    // Ordenar por quantidade de duplicados
    gruposDuplicatas.sort((a, b) => b.quantidade - a.quantidade)

    const totalDuplicados = gruposDuplicatas.reduce((acc, grupo) => acc + grupo.quantidade, 0)
    const totalAnulados = gruposDuplicatas.reduce((acc, grupo) => acc + grupo.anulados.length, 0)

    console.log(`✅ Análise concluída: ${gruposDuplicatas.length} grupos de duplicados encontrados`)
    console.log(`📊 Total: ${totalDuplicados} registros analisados, ${totalAnulados} serão anulados`)

    return NextResponse.json({
      success: true,
      grupos: gruposDuplicatas,
      totalAnalisados: todosRegistros.length,
      totalDuplicados,
      totalGrupos: gruposDuplicatas.length,
      totalAnulados,
      criterio: 'codigo_similaridade'
    })

  } catch (error) {
    console.error('❌ Erro na detecção inteligente de duplicados:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idsParaAnular } = await request.json()
    
    if (!idsParaAnular || !Array.isArray(idsParaAnular) || idsParaAnular.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'IDs dos registros para anular são obrigatórios'
      }, { status: 400 })
    }

    console.log(`🔄 Anulando ${idsParaAnular.length} registros duplicados (marcando como sem interesse):`, idsParaAnular)

    // Marcar como "sem interesse" em vez de excluir
    const { error } = await supabase
      .from('licitacoes')
      .update({ interece: 'N' })
      .in('id', idsParaAnular)

    if (error) {
      throw new Error(`Erro ao anular registros: ${error.message}`)
    }

    console.log(`✅ ${idsParaAnular.length} registros anulados com sucesso (marcados como sem interesse)`)

    return NextResponse.json({
      success: true,
      anulados: idsParaAnular.length
    })

  } catch (error) {
    console.error('❌ Erro na anulação de duplicados:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 