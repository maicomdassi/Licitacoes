import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAPILicitacoesClient } from '@/lib/api-licitacoes'
import { formatarDataBrasil, criarDataBrasil, getOntemBrasil } from '@/lib/timezone-brasil'

export async function POST(request: NextRequest) {
  try {
    const { novaDataUltimaConsulta } = await request.json()

    // Validações
    if (!novaDataUltimaConsulta) {
      return NextResponse.json({
        error: 'Data é obrigatória'
      }, { status: 400 })
    }

    // Validar formato da data
    const regexData = /^\d{4}-\d{2}-\d{2}$/
    if (!regexData.test(novaDataUltimaConsulta)) {
      return NextResponse.json({
        error: 'Formato de data inválido. Use YYYY-MM-DD'
      }, { status: 400 })
    }

    // Validar se a data não é futura demais (não pode ser depois de ontem)
    const dataInformada = criarDataBrasil(novaDataUltimaConsulta)
    const ontem = getOntemBrasil()
    
    if (dataInformada > ontem) {
      return NextResponse.json({
        error: `Data não pode ser posterior a ${formatarDataBrasil(ontem)} (ontem no horário do Brasil)`
      }, { status: 400 })
    }

    // Obter IP atual para manter consistência
    const apiClient = getAPILicitacoesClient()
    const ipAtual = await apiClient.obterIPAtual()

    // Inserir novo registro de controle com a data especificada
    const { error: insertError } = await supabase
      .from('controle_consultas')
      .insert({
        ip_utilizado: ipAtual,
        ultima_data_consultada: novaDataUltimaConsulta,
        status_ultima_consulta: 'ajuste_manual',
        total_inseridas: 0,
        data_consulta: new Date().toISOString(),
        observacoes: `Data ajustada manualmente via interface admin para ${novaDataUltimaConsulta}`
      })

    if (insertError) {
      console.error('Erro ao inserir controle:', insertError)
      return NextResponse.json({
        error: 'Erro ao salvar nova data no banco de dados'
      }, { status: 500 })
    }

    // Verificar se foi salvo corretamente
    const { data: verificacao, error: verificacaoError } = await supabase
      .from('controle_consultas')
      .select('ultima_data_consultada, ip_utilizado, data_consulta')
      .order('data_consulta', { ascending: false })
      .limit(1)
      .single()

    if (verificacaoError) {
      console.error('Erro ao verificar dados salvos:', verificacaoError)
      return NextResponse.json({
        error: 'Erro ao verificar dados salvos'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Data alterada com sucesso para ${novaDataUltimaConsulta}`,
      dados: {
        novaDataUltimaConsulta: verificacao.ultima_data_consultada,
        ipUtilizado: verificacao.ip_utilizado,
        dataAlteracao: verificacao.data_consulta,
        proximaColeta: `A próxima coleta começará em ${formatarDataBrasil(new Date(new Date(novaDataUltimaConsulta).getTime() + 24 * 60 * 60 * 1000))}`
      }
    })

  } catch (error) {
    console.error('Erro ao alterar data:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 