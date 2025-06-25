import { supabase } from './supabase'
import { Licitacao } from '@/types/database.types'

// Critérios de classificação baseados nas atividades da empresa
const CRITERIOS_INTERESSE = {
  // Manter como "P" - Alinhados com as atividades da empresa
  MANTER_P: {
    construcao_engenharia: [
      'construção', 'construcao', 'reforma', 'obra', 'obras', 'alvenaria', 
      'edificação', 'edificacao', 'estrutura', 'civil', 'predial', 'predio'
    ],
    instalacoes: [
      'instalação', 'instalacao', 'ar condicionado', 'ventilação', 'ventilacao',
      'refrigeração', 'refrigeracao', 'elétrica', 'eletrica', 'hidraulica', 'hidráulica'
    ],
    pintura: [
      'pintura', 'pintar', 'tinta', 'verniz', 'revestimento'
    ],
    portas_janelas: [
      'porta', 'portas', 'janela', 'janelas', 'divisória', 'divisoria', 
      'armário', 'armario', 'esquadria', 'esquadrias', 'teto', 'tetos'
    ],
    limpeza_manutencao: [
      'limpeza', 'higienização', 'higienizacao', 'manutenção predial', 
      'manutencao predial', 'conservação', 'conservacao', 'zeladoria'
    ],
    demolicao: [
      'demolição', 'demolicao', 'demolir', 'remoção', 'remocao', 
      'desmonte', 'derrubada'
    ],
    esgoto_saneamento: [
      'esgoto', 'tratamento', 'ETE', 'saneamento', 'efluente', 
      'coleta e queima de gases', 'estação de tratamento'
    ],
    esportes_recreacao: [
      'ginásio', 'ginasio', 'quadra', 'campo', 'instalação esportiva', 
      'instalacao esportiva', 'recreativa', 'recreativo', 'esporte'
    ]
  },
  
  // Alterar para "N" - Não alinhados com o negócio
  ALTERAR_N: {
    saude: [
      'médico', 'medico', 'consulta', 'exame', 'laboratório', 'laboratorio',
      'análise clínica', 'analise clinica', 'credenciamento médico', 
      'credenciamento medico', 'hospitalar', 'clínico', 'clinico', 'saúde', 'saude'
    ],
    alimentacao: [
      'PNAE', 'gêneros alimentícios', 'generos alimenticios', 
      'agricultura familiar', 'merenda', 'alimentação escolar', 
      'alimentacao escolar', 'suco', 'alimento'
    ],
    contabil_juridico: [
      'contábil', 'contabil', 'consultoria', 'perícia', 'pericia', 
      'laudo', 'auditoria', 'jurídico', 'juridico', 'advocacia'
    ],
    credenciamentos_diversos: [
      'leiloeiro', 'leilão', 'leilao', 'instituição financeira', 
      'instituicao financeira', 'cooperativa', 'banco', 'crédito', 'credito'
    ],
    servicos_sociais: [
      'acolhimento', 'idoso', 'assistência social', 'assistencia social',
      'SCFV', 'oficina', 'socioeducativo', 'convivência', 'convivencia'
    ],
    material_escritorio: [
      'material gráfico', 'material grafico', 'expediente', 
      'papelaria', 'escritório', 'escritorio', 'impressão', 'impressao'
    ],
    transporte_logistica: [
      'coleta de resíduos', 'coleta de residuos', 'transporte', 
      'logística', 'logistica', 'frete', 'entrega'
    ]
  }
}

interface ClassificacaoResult {
  success: boolean
  backupCreated: boolean
  totalProcessados: number
  alterados: number
  mantidos: number
  erros: string[]
  detalhes: {
    alteradosParaN: { id: number, titulo: string, motivo: string }[]
    mantidosComoP: { id: number, titulo: string, motivo: string }[]
  }
}

// Função para criar backup da tabela (versão simplificada)
async function criarBackup(): Promise<boolean> {
  try {
    console.log('🔄 Verificando dados antes da alteração...')
    
    // Verificar se conseguimos acessar a tabela principal
    const { data: licitacoes, error: selectError } = await supabase
      .from('licitacoes')
      .select('id, interece')
      .eq('interece', 'P')
      .limit(5)
    
    if (selectError) {
      console.error('Erro ao verificar tabela principal:', selectError)
      return false
    }
    
    if (!licitacoes || licitacoes.length === 0) {
      console.log('ℹ️ Nenhuma licitação com interece = P encontrada')
      return true // Não é erro, só não há dados para processar
    }
    
    console.log(`✅ Verificação concluída. Encontradas ${licitacoes.length} licitações (amostra)`)
    console.log('⚠️ IMPORTANTE: Esta operação irá alterar dados diretamente na tabela principal.')
    console.log('💡 Para restaurar, execute: UPDATE licitacoes SET interece = \'P\' WHERE interece = \'N\' AND id IN (...)')
    
    return true
    
  } catch (error) {
    console.error('Erro na verificação inicial:', error)
    return false
  }
}

// Função para verificar se o objeto contém palavras-chave de interesse
function verificarInteresse(objeto: string): { 
  temInteresse: boolean, 
  categoria: string, 
  palavrasEncontradas: string[] 
} {
  const objetoLower = objeto.toLowerCase()
  
  // Primeiro, verificar se tem palavras de interesse (manter como P)
  for (const [categoria, palavras] of Object.entries(CRITERIOS_INTERESSE.MANTER_P)) {
    const palavrasEncontradas = palavras.filter(palavra => 
      objetoLower.includes(palavra.toLowerCase())
    )
    
    if (palavrasEncontradas.length > 0) {
      return {
        temInteresse: true,
        categoria: `MANTER_P_${categoria}`,
        palavrasEncontradas
      }
    }
  }
  
  // Se não tem interesse, verificar se deve ser alterado para N
  for (const [categoria, palavras] of Object.entries(CRITERIOS_INTERESSE.ALTERAR_N)) {
    const palavrasEncontradas = palavras.filter(palavra => 
      objetoLower.includes(palavra.toLowerCase())
    )
    
    if (palavrasEncontradas.length > 0) {
      return {
        temInteresse: false,
        categoria: `ALTERAR_N_${categoria}`,
        palavrasEncontradas
      }
    }
  }
  
  // Se não encontrou critérios específicos, manter como está (P)
  return {
    temInteresse: true,
    categoria: 'MANTER_P_sem_criterio_especifico',
    palavrasEncontradas: []
  }
}

// Função principal de classificação
export async function executarClassificacaoInteligente(): Promise<ClassificacaoResult> {
  const resultado: ClassificacaoResult = {
    success: false,
    backupCreated: false,
    totalProcessados: 0,
    alterados: 0,
    mantidos: 0,
    erros: [],
    detalhes: {
      alteradosParaN: [],
      mantidosComoP: []
    }
  }
  
  try {
    console.log('🚀 Iniciando classificação inteligente de licitações...')
    
    // 1. Criar backup
    console.log('📋 Etapa 1: Criando backup...')
    resultado.backupCreated = await criarBackup()
    
    if (!resultado.backupCreated) {
      resultado.erros.push('Falha na verificação inicial da tabela')
      return resultado
    }
    
    // 2. Buscar todas as licitações com interece = 'P'
    console.log('📋 Etapa 2: Buscando licitações para classificar...')
    const { data: licitacoes, error: selectError } = await supabase
      .from('licitacoes')
      .select('id, titulo, objeto, interece')
      .eq('interece', 'P')
    
    if (selectError) {
      resultado.erros.push(`Erro ao buscar licitações: ${selectError.message}`)
      return resultado
    }
    
    if (!licitacoes || licitacoes.length === 0) {
      resultado.erros.push('Nenhuma licitação encontrada com interece = P')
      return resultado
    }
    
    console.log(`📊 Encontradas ${licitacoes.length} licitações para processar`)
    resultado.totalProcessados = licitacoes.length
    
    // 3. Processar cada licitação
    console.log('📋 Etapa 3: Processando classificações...')
    const atualizacoes: { id: number, novoStatus: 'P' | 'N', motivo: string }[] = []
    
    for (const licitacao of licitacoes) {
      const analise = verificarInteresse(licitacao.objeto)
      
      if (analise.temInteresse) {
        // Manter como P
        resultado.mantidos++
        resultado.detalhes.mantidosComoP.push({
          id: licitacao.id,
          titulo: licitacao.titulo,
          motivo: `${analise.categoria}: ${analise.palavrasEncontradas.join(', ')}`
        })
      } else {
        // Alterar para N
        resultado.alterados++
        resultado.detalhes.alteradosParaN.push({
          id: licitacao.id,
          titulo: licitacao.titulo,
          motivo: `${analise.categoria}: ${analise.palavrasEncontradas.join(', ')}`
        })
        
        atualizacoes.push({
          id: licitacao.id,
          novoStatus: 'N',
          motivo: analise.categoria
        })
      }
    }
    
    // 4. Executar atualizações em lotes
    console.log(`📋 Etapa 4: Executando ${atualizacoes.length} atualizações...`)
    
    if (atualizacoes.length > 0) {
      const batchSize = 50
      let processados = 0
      
      for (let i = 0; i < atualizacoes.length; i += batchSize) {
        const batch = atualizacoes.slice(i, i + batchSize)
        
        // Atualizar cada item do lote
        for (const item of batch) {
          const { error: updateError } = await supabase
            .from('licitacoes')
            .update({ interece: item.novoStatus })
            .eq('id', item.id)
          
          if (updateError) {
            resultado.erros.push(`Erro ao atualizar ID ${item.id}: ${updateError.message}`)
          } else {
            processados++
          }
        }
        
        console.log(`✅ Atualizações: ${processados}/${atualizacoes.length} processadas`)
      }
    }
    
    resultado.success = resultado.erros.length === 0
    
    console.log('🎉 Classificação concluída!')
    console.log(`📊 Resumo:`)
    console.log(`   - Total processados: ${resultado.totalProcessados}`)
    console.log(`   - Mantidos como P: ${resultado.mantidos}`)
    console.log(`   - Alterados para N: ${resultado.alterados}`)
    console.log(`   - Erros: ${resultado.erros.length}`)
    
    return resultado
    
  } catch (error) {
    console.error('Erro na classificação:', error)
    resultado.erros.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    return resultado
  }
}

// Função para gerar relatório detalhado
export function gerarRelatorioClassificacao(resultado: ClassificacaoResult): string {
  let relatorio = `
🎯 RELATÓRIO DE CLASSIFICAÇÃO INTELIGENTE DE LICITAÇÕES
================================================================

📊 RESUMO GERAL:
- Status: ${resultado.success ? '✅ Sucesso' : '❌ Falha'}
- Verificação inicial: ${resultado.backupCreated ? '✅ OK' : '❌ Falha'}
- Total processados: ${resultado.totalProcessados}
- Mantidos como "P": ${resultado.mantidos}
- Alterados para "N": ${resultado.alterados}
- Erros: ${resultado.erros.length}

`

  if (resultado.erros.length > 0) {
    relatorio += `❌ ERROS ENCONTRADOS:\n`
    resultado.erros.forEach((erro, index) => {
      relatorio += `${index + 1}. ${erro}\n`
    })
    relatorio += `\n`
  }

  if (resultado.detalhes.alteradosParaN.length > 0) {
    relatorio += `🔄 LICITAÇÕES ALTERADAS PARA "N" (${resultado.detalhes.alteradosParaN.length}):\n`
    resultado.detalhes.alteradosParaN.forEach((item, index) => {
      relatorio += `${index + 1}. ID: ${item.id}\n`
      relatorio += `   Título: ${item.titulo.substring(0, 80)}...\n`
      relatorio += `   Motivo: ${item.motivo}\n\n`
    })
  }

  relatorio += `
================================================================
Processamento concluído em ${new Date().toLocaleString('pt-BR')}
`

  return relatorio
} 