import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Critérios simplificados para teste rápido
const CRITERIOS_TESTE = {
  ALTERAR_N: [
    'médico', 'medico', 'consulta', 'PNAE', 'merenda', 'alimentação escolar',
    'contábil', 'contabil', 'leiloeiro', 'leilão', 'acolhimento',
    'material gráfico', 'material grafico', 'transporte', 'coleta de resíduos'
  ],
  MANTER_P: [
    'construção', 'construcao', 'reforma', 'obra', 'obras', 'instalação',
    'instalacao', 'pintura', 'porta', 'janela', 'limpeza', 'demolição',
    'demolicao', 'esgoto', 'ginásio', 'ginasio', 'quadra'
  ]
}

function analisarLicitacao(objeto: string): { alterar: boolean, motivo: string } {
  const objetoLower = objeto.toLowerCase()
  
  // Verificar se deve alterar para N
  for (const palavra of CRITERIOS_TESTE.ALTERAR_N) {
    if (objetoLower.includes(palavra.toLowerCase())) {
      return { alterar: true, motivo: `Encontrado: ${palavra}` }
    }
  }
  
  // Verificar se tem critérios para manter como P
  for (const palavra of CRITERIOS_TESTE.MANTER_P) {
    if (objetoLower.includes(palavra.toLowerCase())) {
      return { alterar: false, motivo: `Mantido por: ${palavra}` }
    }
  }
  
  // Se não encontrou critérios, manter como P
  return { alterar: false, motivo: 'Sem critérios específicos - mantido' }
}

export async function POST(request: NextRequest) {
  try {
    const { lote = 100 } = await request.json()
    
    console.log(`🚀 Iniciando classificação por lotes (${lote} registros)...`)
    
    // 1. Buscar licitações para processar
    const { data: licitacoes, error: selectError } = await supabase
      .from('licitacoes')
      .select('id, titulo, objeto, interece')
      .eq('interece', 'P')
      .limit(lote)
    
    if (selectError) {
      throw new Error(`Erro ao buscar licitações: ${selectError.message}`)
    }
    
    if (!licitacoes || licitacoes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma licitação com interece = P encontrada para processar',
        processados: 0,
        alterados: 0
      })
    }
    
    console.log(`📊 Processando ${licitacoes.length} licitações...`)
    
    // 2. Analisar e preparar atualizações
    const atualizacoes: { id: number, titulo: string, motivo: string }[] = []
    
    for (const licitacao of licitacoes) {
      const analise = analisarLicitacao(licitacao.objeto)
      
      if (analise.alterar) {
        atualizacoes.push({
          id: licitacao.id,
          titulo: licitacao.titulo,
          motivo: analise.motivo
        })
      }
    }
    
    console.log(`🔄 Identificadas ${atualizacoes.length} licitações para alterar...`)
    
    // 3. Executar atualizações
    let processados = 0
    const erros: string[] = []
    
    for (const item of atualizacoes) {
      const { error: updateError } = await supabase
        .from('licitacoes')
        .update({ interece: 'N' })
        .eq('id', item.id)
      
      if (updateError) {
        erros.push(`Erro ID ${item.id}: ${updateError.message}`)
      } else {
        processados++
      }
    }
    
    const resultado = {
      success: erros.length === 0,
      loteProcessado: licitacoes.length,
      identificadosParaAlteracao: atualizacoes.length,
      alteradosComSucesso: processados,
      erros: erros.length,
      detalhesAlterados: atualizacoes.slice(0, 10), // Primeiros 10 para não sobrecarregar
      proximoLote: licitacoes.length === lote // Se processou o lote completo, há mais dados
    }
    
    console.log('✅ Lote processado:', resultado)
    
    return NextResponse.json(resultado)
    
  } catch (error) {
    console.error('Erro no processamento por lotes:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 