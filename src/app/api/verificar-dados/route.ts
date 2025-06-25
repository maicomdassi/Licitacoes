import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando dados na tabela licitacoes...')
    
    // Verificar total de registros
    const { data: total, error: totalError } = await supabase
      .from('licitacoes')
      .select('id', { count: 'exact' })
    
    if (totalError) {
      throw new Error(`Erro ao contar total: ${totalError.message}`)
    }
    
    // Verificar distribuição por interece
    const { data: distribuicao, error: distError } = await supabase
      .from('licitacoes')
      .select('interece')
    
    if (distError) {
      throw new Error(`Erro ao verificar distribuição: ${distError.message}`)
    }
    
    // Contar por categoria
    const contagem = {
      P: distribuicao?.filter((item: any) => item.interece === 'P').length || 0,
      S: distribuicao?.filter((item: any) => item.interece === 'S').length || 0,
      N: distribuicao?.filter((item: any) => item.interece === 'N').length || 0,
      outros: distribuicao?.filter((item: any) => !['P', 'S', 'N'].includes(item.interece)).length || 0
    }
    
    // Pegar alguns exemplos de cada categoria
    const exemploP = await supabase
      .from('licitacoes')
      .select('id, titulo, objeto, interece')
      .eq('interece', 'P')
      .limit(3)
    
    const exemploS = await supabase
      .from('licitacoes')
      .select('id, titulo, objeto, interece')
      .eq('interece', 'S')
      .limit(3)
    
    const exemploN = await supabase
      .from('licitacoes')
      .select('id, titulo, objeto, interece')
      .eq('interece', 'N')
      .limit(3)
    
    return NextResponse.json({
      success: true,
      totalRegistros: distribuicao?.length || 0,
      distribuicao: contagem,
      exemplos: {
        P: exemploP.data || [],
        S: exemploS.data || [],
        N: exemploN.data || []
      }
    })
    
  } catch (error) {
    console.error('Erro na verificação de dados:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 