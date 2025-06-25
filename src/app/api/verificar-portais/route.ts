import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando portais disponíveis...')
    
    // Verificar se existe compras.rs.gov.br
    const { data: comprasRS, error: erroComprasRS } = await supabase
      .from('licitacoes')
      .select('id, titulo, link_externo')
      .ilike('link_externo', '%compras.rs.gov.br%')
      .limit(5)
    
    if (erroComprasRS) {
      throw new Error(`Erro ao buscar compras.rs.gov.br: ${erroComprasRS.message}`)
    }
    
    // Buscar todos os portais únicos (limitado a 20 para análise)
    const { data: todosRegistros, error: erroTodos } = await supabase
      .from('licitacoes')
      .select('link_externo')
      .limit(1000)
    
    if (erroTodos) {
      throw new Error(`Erro ao buscar todos os portais: ${erroTodos.message}`)
    }
    
    // Extrair portais únicos
    const portaisUnicos = new Set<string>()
    todosRegistros?.forEach((item: any) => {
      if (item.link_externo) {
        try {
          const url = new URL(item.link_externo)
          const domain = url.hostname.toLowerCase()
          if (domain && domain.includes('.')) {
            portaisUnicos.add(domain)
          }
        } catch {
          // Ignorar URLs inválidas
        }
      }
    })
    
    const listaPortais = Array.from(portaisUnicos).slice(0, 20)
    const temComprasRS = listaPortais.some(portal => portal.includes('compras.rs.gov.br'))
    
    return NextResponse.json({
      success: true,
      comprasRSEncontrado: comprasRS?.length || 0,
      temComprasRSNaLista: temComprasRS,
      exemplosComprasRS: comprasRS?.slice(0, 3).map((item: any) => ({
        id: item.id,
        titulo: item.titulo.substring(0, 50) + '...',
        link: item.link_externo
      })) || [],
      portaisUnicos: listaPortais,
      totalPortaisAnalisados: portaisUnicos.size,
      totalRegistrosAnalisados: todosRegistros?.length || 0
    })
    
  } catch (error) {
    console.error('Erro na verificação de portais:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 