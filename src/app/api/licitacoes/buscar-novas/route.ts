import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAPILicitacoesClient } from '@/lib/api-licitacoes'
import { getDataBrasil, getOntemBrasil, formatarDataBrasil, criarDataBrasil, getInfoTimezone } from '@/lib/timezone-brasil'

export async function POST(request: NextRequest) {
  console.log('🔍 Iniciando busca de novas licitações...')

  // Configurar streaming de resposta
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const enviarLog = (mensagem: string) => {
        const data = `data: ${mensagem}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      try {
        enviarLog('🔄 Inicializando sistema de coleta...')
        
        const apiClient = getAPILicitacoesClient()
        const ipAtual = await apiClient.obterIPAtual()
        
        // Debug de timezone
        const infoTz = getInfoTimezone()
        enviarLog(`🌐 IP atual detectado: ${ipAtual}`)
        enviarLog(`🕒 Timezone - Brasil: ${infoTz.dataAtualBrasil} | UTC: ${infoTz.dataUTC.split('T')[0]}`)
        enviarLog(`🇧🇷 Hoje no Brasil: ${infoTz.dataAtualBrasil} | Ontem: ${infoTz.ontemBrasil}`)

        // Obter última data consultada
        const { data: ultimaConsulta } = await supabase
          .from('controle_consultas')
          .select('*')
          .order('id', { ascending: false })
          .limit(1)
          .single()

        let dataInicio: Date
        if (ultimaConsulta?.ultima_data_consultada) {
          dataInicio = criarDataBrasil(ultimaConsulta.ultima_data_consultada)
          dataInicio.setDate(dataInicio.getDate() + 1) // Próximo dia
          enviarLog(`📅 Continuando de: ${formatarDataBrasil(dataInicio)}`)
        } else {
          dataInicio = getDataBrasil()
          dataInicio.setDate(dataInicio.getDate() - 30) // Últimos 30 dias na primeira execução
          enviarLog(`📅 Primeira execução - buscando últimos 30 dias`)
        }

        // Data fim é sempre ontem no horário do Brasil (não consulta o dia corrente)
        const dataFim = getOntemBrasil()
        
        enviarLog(`📅 Data limite: ${formatarDataBrasil(dataFim)} (não consulta o dia atual - ${formatarDataBrasil(getDataBrasil())})`)
        
        // Validação: se data de início for maior que data fim, não há nada a processar
        if (dataInicio > dataFim) {
          enviarLog(`✅ Sistema atualizado! Última consulta: ${ultimaConsulta?.ultima_data_consultada || 'N/A'}`)
          enviarLog(`ℹ️ Não há dados novos para processar até ${formatarDataBrasil(dataFim)}`)
          controller.close()
          return
        }
        
        const totalDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        enviarLog(`📊 Processando ${totalDias} dias de dados`)

        let totalInseridas = 0
        let diasProcessados = 0
        let ultimaDataSalva = formatarDataBrasil(dataInicio)

        // Processar dia por dia (até o dia anterior ao atual no horário do Brasil)
        for (let dataAtual = new Date(dataInicio); dataAtual <= dataFim; dataAtual.setDate(dataAtual.getDate() + 1)) {
          const dataStr = formatarDataBrasil(dataAtual)
          enviarLog(`📅 Processando dia: ${dataStr}`)

          try {
            let paginaAtual = 1
            let totalPaginas = 1
            let licitacoesDoDia = 0

            do {
              enviarLog(`📄 Página ${paginaAtual}/${totalPaginas}`)
              
              const dados = await apiClient.fazerRequisicao(dataAtual, paginaAtual, 100)
              
              if (!dados || !dados.licitacoes) {
                enviarLog(`⚠️ Sem dados na página ${paginaAtual}`)
                break
              }

              // Calcular total de páginas
              if (paginaAtual === 1 && dados.totalLicitacoes > 0) {
                totalPaginas = Math.ceil(dados.totalLicitacoes / dados.licitacoesPorPagina)
                enviarLog(`📊 Total de ${dados.totalLicitacoes} licitações em ${totalPaginas} páginas`)
              }

              // Detectar campos dinâmicos
              const camposDetectados = apiClient.analisarEstruturaDados(dados.licitacoes)
              const camposNovos = apiClient.detectarCamposNovos(camposDetectados)
              
              if (camposNovos.length > 0) {
                enviarLog(`🔍 Detectados ${camposNovos.length} campos novos: ${camposNovos.map(c => c.nome).join(', ')}`)
                
                // Expandir tabela se necessário
                for (const campo of camposNovos) {
                  await expandirTabelaLicitacoes(campo, enviarLog)
                }
              }

              // Processar e inserir licitações
              const licitacoesProcessadas = dados.licitacoes.map(licitacao => 
                apiClient.processarLicitacao(licitacao, dataAtual)
              )

              if (licitacoesProcessadas.length > 0) {
                const { error } = await supabase
                  .from('licitacoes')
                  .upsert(licitacoesProcessadas, { 
                    onConflict: 'id_licitacao',
                    ignoreDuplicates: true 
                  })

                if (error) {
                  enviarLog(`❌ Erro ao inserir dados: ${error.message}`)
                  throw error
                }

                licitacoesDoDia += licitacoesProcessadas.length
                enviarLog(`✅ Inseridas ${licitacoesProcessadas.length} licitações`)
              }

              paginaAtual++
              
              // Pequena pausa entre requisições
              await new Promise(resolve => setTimeout(resolve, 500))

            } while (paginaAtual <= totalPaginas)

            totalInseridas += licitacoesDoDia
            diasProcessados++
            ultimaDataSalva = dataStr

            // Salvar progresso após cada dia
            await salvarControleConsulta(ipAtual, dataStr, 'sucesso', licitacoesDoDia, enviarLog)
            
            const progresso = (diasProcessados / totalDias) * 100
            enviarLog(`📈 Progresso: ${diasProcessados}/${totalDias} dias (${progresso.toFixed(1)}%) - ${licitacoesDoDia} licitações do dia`)

          } catch (error) {
            enviarLog(`❌ Erro no dia ${dataStr}: ${error}`)
            
            // Salvar erro mas continuar
            await salvarControleConsulta(ipAtual, ultimaDataSalva, 'erro', totalInseridas, enviarLog)
            
            // Parar processamento em caso de erro
            break
          }
        }

        enviarLog(`🎉 Processamento concluído!`)
        enviarLog(`📊 Resumo final:`)
        enviarLog(`   • Dias processados: ${diasProcessados}/${totalDias}`)
        enviarLog(`   • Total de licitações inseridas: ${totalInseridas}`)
        enviarLog(`   • Última data salva: ${ultimaDataSalva}`)
        enviarLog(`   • IP utilizado: ${ipAtual}`)

      } catch (error) {
        enviarLog(`❌ Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Função auxiliar para expandir tabela
async function expandirTabelaLicitacoes(campo: any, enviarLog: (msg: string) => void) {
  try {
    let tipoSQL = 'TEXT'
    
    switch (campo.tipo) {
      case 'number':
        tipoSQL = 'NUMERIC'
        break
      case 'date':
        tipoSQL = 'TIMESTAMP'
        break
      case 'boolean':
        tipoSQL = 'BOOLEAN'
        break
      default:
        tipoSQL = campo.tamanhoMax && campo.tamanhoMax > 255 ? 'TEXT' : 'VARCHAR(500)'
    }

    const { error } = await supabase.rpc('executar_sql', {
      sql_query: `ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS "${campo.nome}" ${tipoSQL};`
    })

    if (error) {
      enviarLog(`⚠️ Erro ao adicionar campo ${campo.nome}: ${error.message}`)
    } else {
      enviarLog(`✅ Campo ${campo.nome} (${tipoSQL}) adicionado à tabela`)
    }
  } catch (error) {
    enviarLog(`⚠️ Erro ao expandir tabela: ${error}`)
  }
}

// Função auxiliar para salvar controle
async function salvarControleConsulta(
  ip: string, 
  ultimaData: string, 
  status: string, 
  totalInseridas: number,
  enviarLog: (msg: string) => void
) {
  try {
    const { error } = await supabase
      .from('controle_consultas')
      .insert({
        ip_utilizado: ip,
        ultima_data_consultada: ultimaData,
        status_ultima_consulta: status,
        total_inseridas: totalInseridas,
        data_consulta: getDataBrasil().toISOString()
      })

    if (error) {
      enviarLog(`⚠️ Erro ao salvar controle: ${error.message}`)
    } else {
      enviarLog(`💾 Controle salvo: ${ultimaData} | ${status} | ${totalInseridas} inseridas`)
    }
  } catch (error) {
    enviarLog(`⚠️ Erro ao salvar controle: ${error}`)
  }
} 