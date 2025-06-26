import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAPILicitacoesClient } from '@/lib/api-licitacoes'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando busca de TODAS as licitações abertas...')

    const apiClient = getAPILicitacoesClient()
    const ipAtual = await apiClient.obterIPAtual()
    
    console.log(`🌐 IP atual: ${ipAtual}`)

    let totalInseridas = 0
    let paginaAtual = 1
    let totalPaginas = 1

    do {
      console.log(`📄 Processando página ${paginaAtual}/${totalPaginas}`)
      
      // Buscar sem filtro de data (todas as licitações abertas)
      const dados = await apiClient.fazerRequisicao(undefined, paginaAtual, 100)
      
      if (!dados || !dados.licitacoes) {
        console.warn(`⚠️ Sem dados na página ${paginaAtual}`)
        break
      }

      // Calcular total de páginas na primeira requisição
      if (paginaAtual === 1 && dados.totalLicitacoes > 0) {
        totalPaginas = Math.ceil(dados.totalLicitacoes / dados.licitacoesPorPagina)
        console.log(`📊 Total de ${dados.totalLicitacoes} licitações em ${totalPaginas} páginas`)
      }

      // Detectar e expandir campos novos
      const camposDetectados = apiClient.analisarEstruturaDados(dados.licitacoes)
      const camposNovos = apiClient.detectarCamposNovos(camposDetectados)
      
      if (camposNovos.length > 0) {
        console.log(`🔍 Detectados ${camposNovos.length} campos novos:`, camposNovos.map(c => c.nome))
        
        for (const campo of camposNovos) {
          await expandirTabelaLicitacoes(campo)
        }
      }

      // Processar licitações
      const licitacoesProcessadas = dados.licitacoes.map(licitacao => 
        apiClient.processarLicitacao(licitacao, new Date())
      )

      if (licitacoesProcessadas.length > 0) {
        const { error } = await supabase
          .from('licitacoes')
          .upsert(licitacoesProcessadas, { 
            onConflict: 'id_licitacao',
            ignoreDuplicates: true 
          })

        if (error) {
          console.error('❌ Erro ao inserir licitações:', error)
          throw error
        }

        totalInseridas += licitacoesProcessadas.length
        console.log(`✅ Inseridas ${licitacoesProcessadas.length} licitações (total: ${totalInseridas})`)
      }

      paginaAtual++
      
      // Pausa entre requisições para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000))

    } while (paginaAtual <= totalPaginas)

    // Salvar controle da consulta
    await salvarControleConsulta(ipAtual, new Date().toISOString().split('T')[0], 'sucesso', totalInseridas)

    console.log(`🎉 Busca completa finalizada: ${totalInseridas} licitações processadas`)

    return NextResponse.json({
      success: true,
      totalInseridas,
      totalPaginas,
      ipUtilizado: ipAtual,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na busca completa:', error)
    
    // Tentar salvar erro no controle
    try {
      const apiClient = getAPILicitacoesClient()
      const ipAtual = await apiClient.obterIPAtual()
      await salvarControleConsulta(ipAtual, new Date().toISOString().split('T')[0], 'erro', 0)
    } catch (saveError) {
      console.error('❌ Erro ao salvar controle de erro:', saveError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Função auxiliar para expandir tabela
async function expandirTabelaLicitacoes(campo: any) {
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
      console.warn(`⚠️ Erro ao adicionar campo ${campo.nome}:`, error.message)
    } else {
      console.log(`✅ Campo ${campo.nome} (${tipoSQL}) adicionado à tabela`)
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao expandir tabela:`, error)
  }
}

// Função auxiliar para salvar controle
async function salvarControleConsulta(
  ip: string, 
  ultimaData: string, 
  status: string, 
  totalInseridas: number
) {
  try {
    const { error } = await supabase
      .from('controle_consultas')
      .insert({
        ip_utilizado: ip,
        ultima_data_consultada: ultimaData,
        status_ultima_consulta: status,
        total_inseridas: totalInseridas,
        data_consulta: new Date().toISOString()
      })

    if (error) {
      console.warn('⚠️ Erro ao salvar controle:', error.message)
    } else {
      console.log(`💾 Controle salvo: ${ultimaData} | ${status} | ${totalInseridas} inseridas`)
    }
  } catch (error) {
    console.warn('⚠️ Erro ao salvar controle:', error)
  }
} 