import { NextRequest, NextResponse } from 'next/server'
import { supabase, getConfiguracao } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando restauração do portal padrão...')
    
    // 1. Buscar o portal padrão configurado
    const { data: portalPadrao, error: errorConfig } = await getConfiguracao('portal_padrao')
    
    if (errorConfig || !portalPadrao) {
      return NextResponse.json({
        success: false,
        error: 'Portal padrão não configurado',
        portalPadrao: null
      })
    }
    
    console.log('✅ Portal padrão configurado:', portalPadrao)
    
    // 2. Buscar licitações do portal padrão com interesse 'N'
    const { data: licitacoesPortalN, error: errorPortalN } = await supabase
      .from('licitacoes')
      .select('*')
      .ilike('link_externo', `%${portalPadrao}%`)
      .eq('interece', 'N')
    
    if (errorPortalN) {
      throw new Error(`Erro ao buscar licitações do portal padrão: ${errorPortalN.message}`)
    }
    
    console.log(`📊 Encontradas ${licitacoesPortalN?.length || 0} licitações do portal ${portalPadrao} com interesse 'N'`)
    
    if (!licitacoesPortalN || licitacoesPortalN.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma licitação do portal padrão precisa ser restaurada',
        portalPadrao,
        licitacoesAnalisadas: 0,
        licitacoesRestauradas: 0
      })
    }
    
    // 3. Para cada licitação 'N' do portal padrão, verificar se existe duplicata com interesse 'P'
    const licitacoesParaRestaurar = []
    
    for (const licitacaoN of licitacoesPortalN) {
      // Buscar possíveis duplicatas com interesse 'P' usando critérios de similaridade
      const { data: duplicatasP, error: errorDuplicatas } = await supabase
        .from('licitacoes')
        .select('*')
        .eq('interece', 'P')
        .neq('id', licitacaoN.id) // Excluir a própria licitação
      
      if (errorDuplicatas) {
        console.warn(`⚠️ Erro ao buscar duplicatas para licitação ${licitacaoN.id}:`, errorDuplicatas.message)
        continue
      }
      
      // Verificar se alguma das licitações 'P' é similar à licitação 'N' do portal padrão
      const temDuplicataP = duplicatasP?.some((licitacaoP: any) => {
        // Critério 1: Mesmo código
        if (licitacaoN.codigo && licitacaoP.codigo && licitacaoN.codigo === licitacaoP.codigo) {
          return true
        }
        
        // Critério 2: Título muito similar (mais de 80% de similaridade)
        if (licitacaoN.titulo && licitacaoP.titulo) {
          const similaridade = calcularSimilaridade(licitacaoN.titulo, licitacaoP.titulo)
          if (similaridade > 0.8) {
            return true
          }
        }
        
        // Critério 3: Objeto muito similar (mais de 85% de similaridade)
        if (licitacaoN.objeto && licitacaoP.objeto) {
          const similaridade = calcularSimilaridade(licitacaoN.objeto, licitacaoP.objeto)
          if (similaridade > 0.85) {
            return true
          }
        }
        
        return false
      })
      
      if (temDuplicataP) {
        licitacoesParaRestaurar.push(licitacaoN)
        console.log(`✅ Licitação ${licitacaoN.id} será restaurada - tem duplicata com interesse 'P'`)
      }
    }
    
    console.log(`📊 Total de licitações para restaurar: ${licitacoesParaRestaurar.length}`)
    
    // 4. Restaurar as licitações identificadas (marcar como 'P' - Pendente)
    let licitacoesRestauradas = 0
    
    if (licitacoesParaRestaurar.length > 0) {
      const idsParaRestaurar = licitacoesParaRestaurar.map(l => l.id)
      
      const { error: errorUpdate } = await supabase
        .from('licitacoes')
        .update({ 
          interece: 'P',
          updated_at: new Date().toISOString()
        })
        .in('id', idsParaRestaurar)
      
      if (errorUpdate) {
        throw new Error(`Erro ao restaurar licitações: ${errorUpdate.message}`)
      }
      
      licitacoesRestauradas = licitacoesParaRestaurar.length
      console.log(`✅ ${licitacoesRestauradas} licitações restauradas com sucesso`)
    }
    
    return NextResponse.json({
      success: true,
      message: `Restauração concluída com sucesso`,
      portalPadrao,
      licitacoesAnalisadas: licitacoesPortalN.length,
      licitacoesRestauradas,
      detalhes: licitacoesParaRestaurar.map(l => ({
        id: l.id,
        titulo: l.titulo?.substring(0, 100) + '...',
        codigo: l.codigo
      }))
    })
    
  } catch (error) {
    console.error('❌ Erro na restauração do portal padrão:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função auxiliar para calcular similaridade entre duas strings
function calcularSimilaridade(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  // Usar algoritmo de Levenshtein simplificado
  const maxLength = Math.max(s1.length, s2.length)
  if (maxLength === 0) return 1
  
  const distance = levenshteinDistance(s1, s2)
  return (maxLength - distance) / maxLength
}

// Implementação simplificada da distância de Levenshtein
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