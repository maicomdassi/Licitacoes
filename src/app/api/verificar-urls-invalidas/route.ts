import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando URLs inválidas...')
    
    // Buscar todos os links externos
    const { data: licitacoes, error } = await supabase
      .from('licitacoes')
      .select('id, link_externo')
      .not('link_externo', 'is', null)
      .limit(1000)
    
    if (error) {
      throw new Error(`Erro ao buscar licitações: ${error.message}`)
    }

    const urlsInvalidas: any[] = []
    const portaisInvalidos: any[] = []
    const portaisValidos = new Set<string>()

    licitacoes?.forEach((licitacao: any) => {
      if (licitacao.link_externo) {
        try {
          const url = new URL(licitacao.link_externo)
          const portal = url.hostname.replace('www.', '')
          
          // Verificar se o portal é válido
          if (!portal || 
              portal.length === 0 || 
              portal === 'https' || 
              portal === 'http' || 
              !portal.includes('.') ||
              portal.length <= 3) {
            portaisInvalidos.push({
              id: licitacao.id,
              link_externo: licitacao.link_externo,
              portal_extraido: portal,
              motivo: getMotivoInvalido(portal)
            })
          } else {
            portaisValidos.add(portal)
          }
        } catch (e) {
          urlsInvalidas.push({
            id: licitacao.id,
            link_externo: licitacao.link_externo,
            erro: e instanceof Error ? e.message : 'URL malformada'
          })
        }
      }
    })

    function getMotivoInvalido(portal: string): string {
      if (!portal || portal.length === 0) return 'Portal vazio'
      if (portal === 'https' || portal === 'http') return 'Apenas protocolo'
      if (!portal.includes('.')) return 'Sem domínio válido'
      if (portal.length <= 3) return 'Portal muito curto'
      return 'Motivo desconhecido'
    }

    console.log(`✅ Análise concluída:`)
    console.log(`- URLs inválidas: ${urlsInvalidas.length}`)
    console.log(`- Portais inválidos: ${portaisInvalidos.length}`)
    console.log(`- Portais válidos: ${portaisValidos.size}`)

    return NextResponse.json({
      success: true,
      totalAnalisadas: licitacoes?.length || 0,
      urlsInvalidas: {
        count: urlsInvalidas.length,
        exemplos: urlsInvalidas.slice(0, 10)
      },
      portaisInvalidos: {
        count: portaisInvalidos.length,
        exemplos: portaisInvalidos.slice(0, 10)
      },
      portaisValidos: {
        count: portaisValidos.size,
        lista: Array.from(portaisValidos).sort().slice(0, 20)
      }
    })

  } catch (error) {
    console.error('❌ Erro ao verificar URLs:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 