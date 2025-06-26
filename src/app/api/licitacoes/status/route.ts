import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAPILicitacoesClient } from '@/lib/api-licitacoes'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obtendo status da coleta de licitações...')

    // Obter IP atual
    const apiClient = getAPILicitacoesClient()
    const ipAtual = await apiClient.obterIPAtual()

    // Verificar se API está configurada
    const apiConfigurada = apiClient.isConfigured()

    // Obter última consulta
    const { data: ultimaConsulta } = await supabase
      .from('controle_consultas')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    // Obter total de licitações
    const { count: totalLicitacoes } = await supabase
      .from('licitacoes')
      .select('*', { count: 'exact', head: true })

    // Testar status da API externa
    let statusAPI: 'online' | 'offline' | 'verificando' = 'verificando'
    if (apiConfigurada) {
      try {
        const testeAPI = await apiClient.testarAPI()
        statusAPI = testeAPI.sucesso ? 'online' : 'offline'
      } catch (error) {
        console.warn('Erro ao testar API externa:', error)
        statusAPI = 'offline'
      }
    } else {
      statusAPI = 'offline'
    }

    const status = {
      ipAtual,
      ultimaDataConsultada: ultimaConsulta?.ultima_data_consultada || null,
      ultimoIPUsado: ultimaConsulta?.ip_utilizado || null,
      statusUltimaConsulta: ultimaConsulta?.status_ultima_consulta || 'nunca',
      totalInseridaUltimaConsulta: ultimaConsulta?.total_inseridas || 0,
      totalLicitacoes: totalLicitacoes || 0,
      statusAPI,
      dataUltimaVerificacao: new Date().toISOString(),
      apiConfigurada,
      configuracoes: {
        uf: process.env.UF_PESQUISA || 'RS',
        modalidades: process.env.MODALIDADES || '1,2,4,5,6,11',
        tokenConfigurado: apiConfigurada
      }
    }

    console.log('✅ Status obtido com sucesso')
    
    return NextResponse.json(status)

  } catch (error) {
    console.error('❌ Erro ao obter status:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 