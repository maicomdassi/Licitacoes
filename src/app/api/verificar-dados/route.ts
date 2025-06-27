import { NextRequest, NextResponse } from 'next/server'
import { supabase, getConfiguracao } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Verificando dados no banco...')

    // Contar licitações por status
    const [pendentes, interesse, semInteresse, total] = await Promise.all([
      supabase.from('licitacoes').select('id', { count: 'exact' }).eq('interece', 'P'),
      supabase.from('licitacoes').select('id', { count: 'exact' }).eq('interece', 'S'), 
      supabase.from('licitacoes').select('id', { count: 'exact' }).eq('interece', 'N'),
      supabase.from('licitacoes').select('id', { count: 'exact' })
    ])

    // Buscar alguns exemplos de cada status
    const [exemplosPendentes, exemplosInteresse, exemplosSemInteresse] = await Promise.all([
      supabase.from('licitacoes').select('id, titulo, interece').eq('interece', 'P').limit(3),
      supabase.from('licitacoes').select('id, titulo, interece').eq('interece', 'S').limit(3),
      supabase.from('licitacoes').select('id, titulo, interece').eq('interece', 'N').limit(3)
    ])

    // Verificar portal padrão configurado
    const { data: portalPadrao } = await getConfiguracao('portal_padrao')

    const resultado = {
      estatisticas: {
        total: total.count || 0,
        pendentes: pendentes.count || 0,
        comInteresse: interesse.count || 0,
        semInteresse: semInteresse.count || 0
      },
      exemplos: {
        pendentes: exemplosPendentes.data || [],
        comInteresse: exemplosInteresse.data || [],
        semInteresse: exemplosSemInteresse.data || []
      },
      configuracao: {
        portalPadrao: portalPadrao || 'Não configurado'
      },
      erros: {
        pendentes: pendentes.error?.message,
        interesse: interesse.error?.message,
        semInteresse: semInteresse.error?.message,
        total: total.error?.message
      }
    }

    console.log('📊 Resultado da verificação:', resultado)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 