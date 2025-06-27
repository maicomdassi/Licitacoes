import { NextRequest, NextResponse } from 'next/server'
import { supabase, getConfiguracao } from '@/lib/supabase'

interface Licitacao {
  id: number
  codigo?: string
  titulo?: string
  objeto?: string
  link_externo?: string
  data_publicacao?: string
  data_leilao?: string
  interece: 'P' | 'S' | 'N'
  created_at?: string
}

interface GrupoDuplicatas {
  licitacoes: Licitacao[]
  criterio: string
  portalPadrao?: Licitacao
  licitacaoEscolhida: Licitacao
  licitacoesParaMarcarN: Licitacao[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando detecção inteligente de duplicados...')
    
    // 1. Buscar o portal padrão configurado
    const { data: portalPadrao, error: errorConfig } = await getConfiguracao('portal_padrao')
    
    if (errorConfig) {
      console.warn('⚠️ Erro ao buscar portal padrão:', errorConfig)
    }
    
    console.log('✅ Portal padrão configurado:', portalPadrao || 'Não configurado')
    
    // 2. Buscar todas as licitações pendentes
    const { data: licitacoes, error: errorLicitacoes } = await supabase
      .from('licitacoes')
      .select('*')
      .eq('interece', 'P')
      .order('created_at', { ascending: true })
    
    if (errorLicitacoes) {
      throw new Error(`Erro ao buscar licitações: ${errorLicitacoes.message}`)
    }
    
    console.log(`📊 Encontradas ${licitacoes?.length || 0} licitações pendentes para análise`)
    
    if (!licitacoes || licitacoes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma licitação pendente para analisar',
        gruposDuplicatas: 0,
        licitacoesProcessadas: 0
      })
    }
    
    // 3. Agrupar licitações por critérios de duplicação
    const gruposDuplicatas: GrupoDuplicatas[] = []
    const licitacoesProcessadas = new Set<number>()
    
    for (let i = 0; i < licitacoes.length; i++) {
      const licitacao1 = licitacoes[i]
      
      // Pular se já foi processada
      if (licitacoesProcessadas.has(licitacao1.id)) {
        continue
      }
      
      const duplicatas: Licitacao[] = [licitacao1]
      let criterio = ''
      
      // Buscar duplicatas desta licitação
      for (let j = i + 1; j < licitacoes.length; j++) {
        const licitacao2 = licitacoes[j]
        
        // Pular se já foi processada
        if (licitacoesProcessadas.has(licitacao2.id)) {
          continue
        }
        
        const { isDuplicata, criterioUsado } = verificarDuplicata(licitacao1, licitacao2)
        
        if (isDuplicata) {
          duplicatas.push(licitacao2)
          criterio = criterioUsado
          licitacoesProcessadas.add(licitacao2.id)
        }
      }
      
      // Se encontrou duplicatas, criar grupo
      if (duplicatas.length > 1) {
        const grupo = criarGrupoDuplicatas(duplicatas, criterio, portalPadrao || undefined)
        gruposDuplicatas.push(grupo)
        
        // Marcar todas as licitações do grupo como processadas
        duplicatas.forEach(l => licitacoesProcessadas.add(l.id))
        
        console.log(`🔍 Grupo de ${duplicatas.length} duplicatas encontrado (${criterio})`)
        console.log(`   Escolhida: ID ${grupo.licitacaoEscolhida.id} (${extrairPortal(grupo.licitacaoEscolhida.link_externo)})`)
        console.log(`   Para marcar N: ${grupo.licitacoesParaMarcarN.map(l => l.id).join(', ')}`)
      } else {
        licitacoesProcessadas.add(licitacao1.id)
      }
    }
    
    console.log(`📊 Encontrados ${gruposDuplicatas.length} grupos de duplicatas`)
    
    // 4. Aplicar as marcações
    let totalMarcadasComoN = 0
    
    for (const grupo of gruposDuplicatas) {
      if (grupo.licitacoesParaMarcarN.length > 0) {
        const idsParaMarcarN = grupo.licitacoesParaMarcarN.map(l => l.id)
        
        const { error: errorUpdate } = await supabase
          .from('licitacoes')
          .update({ 
            interece: 'N',
            updated_at: new Date().toISOString()
          })
          .in('id', idsParaMarcarN)
        
        if (errorUpdate) {
          console.error(`❌ Erro ao marcar licitações como N:`, errorUpdate.message)
        } else {
          totalMarcadasComoN += idsParaMarcarN.length
          console.log(`✅ ${idsParaMarcarN.length} licitações marcadas como 'N'`)
        }
      }
    }
    
    // 5. Gerar relatório detalhado
    const relatorio = gruposDuplicatas.map(grupo => ({
      criterio: grupo.criterio,
      totalDuplicatas: grupo.licitacoes.length,
      licitacaoEscolhida: {
        id: grupo.licitacaoEscolhida.id,
        portal: extrairPortal(grupo.licitacaoEscolhida.link_externo),
        codigo: grupo.licitacaoEscolhida.codigo,
        objeto: grupo.licitacaoEscolhida.objeto?.substring(0, 100) + '...'
      },
      licitacoesDescartadas: grupo.licitacoesParaMarcarN.map(l => ({
        id: l.id,
        portal: extrairPortal(l.link_externo),
        codigo: l.codigo
      })),
      temPortalPadrao: !!grupo.portalPadrao,
      portalPadraoEscolhido: grupo.portalPadrao?.id === grupo.licitacaoEscolhida.id
    }))
    
    return NextResponse.json({
      success: true,
      message: `Detecção concluída com sucesso`,
      portalPadrao: portalPadrao || 'Não configurado',
      licitacoesAnalisadas: licitacoes.length,
      gruposDuplicatas: gruposDuplicatas.length,
      totalMarcadasComoN,
      relatorio
    })
    
  } catch (error) {
    console.error('❌ Erro na detecção inteligente de duplicados:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função para verificar se duas licitações são duplicatas
function verificarDuplicata(licitacao1: Licitacao, licitacao2: Licitacao): { isDuplicata: boolean, criterioUsado: string } {
  // Critério 1: Código idêntico (mais confiável)
  if (licitacao1.codigo && licitacao2.codigo && 
      licitacao1.codigo.trim() === licitacao2.codigo.trim()) {
    return { isDuplicata: true, criterioUsado: 'Código idêntico' }
  }
  
  // Critério 2: Objeto muito similar (>90%)
  if (licitacao1.objeto && licitacao2.objeto) {
    const similaridadeObjeto = calcularSimilaridade(licitacao1.objeto, licitacao2.objeto)
    if (similaridadeObjeto > 0.90) {
      return { isDuplicata: true, criterioUsado: `Objeto similar (${Math.round(similaridadeObjeto * 100)}%)` }
    }
  }
  
  // Critério 3: Datas próximas (±7 dias) + objeto similar (>85%)
  if (licitacao1.data_leilao && licitacao2.data_leilao && 
      licitacao1.objeto && licitacao2.objeto) {
    
    const data1 = new Date(licitacao1.data_leilao)
    const data2 = new Date(licitacao2.data_leilao)
    const diferencaDias = Math.abs((data1.getTime() - data2.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diferencaDias <= 7) {
      const similaridadeObjeto = calcularSimilaridade(licitacao1.objeto, licitacao2.objeto)
      if (similaridadeObjeto > 0.85) {
        return { 
          isDuplicata: true, 
          criterioUsado: `Datas próximas (${Math.round(diferencaDias)} dias) + objeto similar (${Math.round(similaridadeObjeto * 100)}%)` 
        }
      }
    }
  }
  
  return { isDuplicata: false, criterioUsado: '' }
}

// Função para criar grupo de duplicatas e decidir qual manter
function criarGrupoDuplicatas(licitacoes: Licitacao[], criterio: string, portalPadrao?: string): GrupoDuplicatas {
  // Identificar se alguma licitação é do portal padrão
  const licitacaoPortalPadrao = portalPadrao ? 
    licitacoes.find(l => l.link_externo?.includes(portalPadrao)) : undefined
  
  let licitacaoEscolhida: Licitacao
  
  if (licitacaoPortalPadrao) {
    // REGRA 1: Se existe licitação do portal padrão, sempre escolher ela
    licitacaoEscolhida = licitacaoPortalPadrao
    console.log(`🎯 Portal padrão encontrado no grupo - ID ${licitacaoEscolhida.id}`)
  } else {
    // REGRA 2: Priorizar portais governamentais (.gov.br)
    const licitacoesGov = licitacoes.filter(l => l.link_externo?.includes('.gov.br'))
    
    if (licitacoesGov.length > 0) {
      // Escolher a mais antiga entre os portais .gov.br
      licitacaoEscolhida = licitacoesGov.reduce((mais_antiga, atual) => {
        const dataAtual = new Date(atual.created_at || atual.data_publicacao || '1900-01-01')
        const dataMaisAntiga = new Date(mais_antiga.created_at || mais_antiga.data_publicacao || '1900-01-01')
        return dataAtual < dataMaisAntiga ? atual : mais_antiga
      })
      console.log(`🏛️ Portal governamental escolhido - ID ${licitacaoEscolhida.id}`)
    } else {
      // REGRA 3: Escolher a mais antiga entre todas
      licitacaoEscolhida = licitacoes.reduce((mais_antiga, atual) => {
        const dataAtual = new Date(atual.created_at || atual.data_publicacao || '1900-01-01')
        const dataMaisAntiga = new Date(mais_antiga.created_at || mais_antiga.data_publicacao || '1900-01-01')
        return dataAtual < dataMaisAntiga ? atual : mais_antiga
      })
      console.log(`📅 Licitação mais antiga escolhida - ID ${licitacaoEscolhida.id}`)
    }
  }
  
  // Todas as outras serão marcadas como 'N'
  const licitacoesParaMarcarN = licitacoes.filter(l => l.id !== licitacaoEscolhida.id)
  
  return {
    licitacoes,
    criterio,
    portalPadrao: licitacaoPortalPadrao,
    licitacaoEscolhida,
    licitacoesParaMarcarN
  }
}

// Função auxiliar para extrair portal do link
function extrairPortal(linkExterno?: string): string {
  if (!linkExterno) return 'Portal não identificado'
  
  try {
    const url = new URL(linkExterno)
    return url.hostname.replace('www.', '')
  } catch {
    return 'URL inválida'
  }
}

// Função auxiliar para calcular similaridade entre duas strings
function calcularSimilaridade(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  // Usar algoritmo de Levenshtein
  const maxLength = Math.max(s1.length, s2.length)
  if (maxLength === 0) return 1
  
  const distance = levenshteinDistance(s1, s2)
  return (maxLength - distance) / maxLength
}

// Implementação da distância de Levenshtein
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
} 