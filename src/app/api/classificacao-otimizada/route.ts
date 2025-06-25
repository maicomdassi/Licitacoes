import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Função para normalizar texto (remover acentos e converter para minúsculas)
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
    .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais exceto espaços
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
    .trim()
}

// Critérios de classificação baseados nas atividades da empresa de construção civil
const CRITERIOS_INTERESSE = {
  // Palavras relacionadas à CONSTRUÇÃO CIVIL - se encontradas, MANTER como "P" (participar)
  MANTER_P: [
    // Construção/Engenharia Civil
    'construcao civil', 'obra civil', 'obras civis', 'engenharia civil',
    'reforma predial', 'reforma de edificio', 'reforma estrutural',
    'alvenaria', 'alvenaria estrutural', 'alvenaria de vedacao',
    'edificacao', 'estrutura civil', 'fundacao', 'sapata',
    'viga', 'pilar', 'laje', 'escada', 'rampa',
    'parede', 'muro', 'cerca', 'gradil', 'portao',
    'calçada', 'piso', 'contrapiso', 'revestimento de parede',
    'reboco', 'emboço', 'chapisco', 'argamassa',
    'concreto', 'concreto armado', 'ferro', 'aco', 'vergalhao',
    'cimento', 'cal', 'areia', 'brita', 'pedra',
    'tijolo', 'bloco', 'telha', 'cobertura', 'telhado',
    
    // Instalações Elétricas e Hidráulicas
    'instalacao eletrica', 'sistema eletrico', 'rede eletrica',
    'instalacao hidraulica', 'sistema hidraulico', 'encanamento',
    'tubulacao', 'tubulacao hidraulica', 'tubulacao eletrica',
    'fiacao eletrica', 'cabo eletrico', 'fio eletrico',
    'quadro eletrico', 'disjuntor', 'interruptor', 'tomada',
    'luminaria', 'lampada', 'spot', 'refletor',
    'caixa dagua', 'reservatorio', 'bomba dagua',
    'registro', 'valvula', 'conexao hidraulica',
    'torneira', 'chuveiro', 'pia', 'vaso sanitario',
    
    // Climatização
    'ar condicionado', 'climatizacao', 'refrigeracao',
    'ventilacao predial', 'exaustor', 'ventilador',
    'refrigeracao industrial', 'sistema de climatizacao',
    
    // Pintura e Acabamentos
    'pintura predial', 'pintura civil', 'pintura de parede',
    'tinta para construcao', 'tinta para parede', 'tinta latex',
    'verniz', 'esmalte', 'primer', 'selador',
    'revestimento civil', 'ceramica', 'azulejo', 'porcelanato',
    'granito', 'marmore', 'pedra decorativa',
    
    // Esquadrias e Fechamentos
    'porta', 'portas', 'janela', 'janelas', 'portao',
    'divisoria predial', 'biombo', 'painel divisorio',
    'armario embutido', 'guarda roupa embutido',
    'esquadria', 'esquadrias', 'caixilho', 'batente',
    'vidro', 'vidro temperado', 'vidro laminado',
    'fechadura', 'macaneta', 'dobradica', 'ferragem',
    
    // Tetos e Forros
    'teto', 'tetos', 'forro', 'forro de gesso',
    'forro de pvc', 'sanca', 'moldura', 'rodateto',
    
    // Pisos e Pavimentação
    'piso', 'pavimentacao', 'piso ceramico', 'piso de concreto',
    'piso industrial', 'piso tatil', 'rodape',
    'soleira', 'degrau', 'escada', 'corrimao',
    
    // Limpeza e Manutenção Predial
    'limpeza predial', 'higienizacao predial', 'limpeza de edificio',
    'manutencao predial', 'conservacao predial', 'manutencao civil',
    'zeladoria', 'portaria', 'vigilancia predial',
    'manutencao de jardim', 'jardinagem', 'paisagismo',
    
    // Demolição e Remoção
    'demolicao', 'demolir', 'demolicao civil',
    'remocao civil', 'remocao de entulho', 'limpeza de terreno',
    'desmonte', 'derrubada', 'terraplenagem',
    
    // Saneamento e Infraestrutura
    'esgoto', 'rede de esgoto', 'tratamento de esgoto',
    'ete', 'estacao de tratamento', 'estacao elevatoria',
    'saneamento basico', 'rede de agua', 'abastecimento de agua',
    'drenagem', 'galeria pluvial', 'bueiro', 'boca de lobo',
    'efluente', 'coleta e queima de gases', 'biogas',
    
    // Instalações Esportivas
    'ginasio', 'ginasio esportivo', 'quadra esportiva',
    'campo esportivo', 'campo de futebol', 'pista de atletismo',
    'instalacao esportiva', 'equipamento esportivo',
    'arquibancada', 'vestiario', 'area de lazer',
    'playground', 'parque infantil', 'recreativa', 'recreativo'
  ]
}

interface LicitacaoParaAnalise {
  id: number
  titulo: string
  objeto: string
  interece: string
}

interface AnaliseResult {
  id: number
  titulo: string
  objeto: string
  acao: 'MANTER_P' | 'ALTERAR_N'
  motivo: string
  palavrasEncontradas: string[]
}

function analisarLicitacao(licitacao: LicitacaoParaAnalise): AnaliseResult {
  const objetoNormalizado = normalizarTexto(licitacao.objeto)
  
  // NOVA LÓGICA: Verificar se contém palavras relacionadas à construção civil
  const palavrasEncontradas: string[] = []
  for (const palavra of CRITERIOS_INTERESSE.MANTER_P) {
    const palavraNormalizada = normalizarTexto(palavra)
    if (objetoNormalizado.includes(palavraNormalizada)) {
      palavrasEncontradas.push(palavra)
    }
  }
  
  // Se ENCONTROU palavras dos critérios de construção civil = MANTER como P
  if (palavrasEncontradas.length > 0) {
    return {
      id: licitacao.id,
      titulo: licitacao.titulo,
      objeto: licitacao.objeto,
      acao: 'MANTER_P',
      motivo: 'Contém atividades relacionadas à construção civil',
      palavrasEncontradas: palavrasEncontradas
    }
  }
  
  // Se NÃO ENCONTROU nenhuma palavra dos critérios = ALTERAR para N
  return {
    id: licitacao.id,
    titulo: licitacao.titulo,
    objeto: licitacao.objeto,
    acao: 'ALTERAR_N',
    motivo: 'Não contém atividades relacionadas à construção civil',
    palavrasEncontradas: []
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ler o body apenas UMA vez para evitar erro "Body is unusable"
    const body = await request.json()
    const { etapa = 'analisar', idsParaAlterar = [] } = body
    
    console.log(`🚀 Iniciando classificação otimizada - Etapa: ${etapa}`)
    
    if (etapa === 'analisar') {
      // ETAPA 1: BUSCAR TODAS as licitações com interece = 'P'
      console.log('📊 Buscando TODAS as licitações com interece = P...')
      
      const { data: licitacoes, error: selectError } = await supabase
        .from('licitacoes')
        .select('id, titulo, objeto, interece')
        .eq('interece', 'P')
        .order('id', { ascending: true })
      
      if (selectError) {
        throw new Error(`Erro ao buscar licitações: ${selectError.message}`)
      }
      
      if (!licitacoes || licitacoes.length === 0) {
        return NextResponse.json({
          success: true,
          etapa: 'concluido',
          message: 'Nenhuma licitação com interece = P encontrada',
          total: 0,
          paraAlterar: 0,
          paraManter: 0
        })
      }
      
      console.log(`✅ Encontradas ${licitacoes.length} licitações para analisar`)
      
      // ETAPA 2: ANALISAR EM MEMÓRIA
      console.log('🧠 Analisando critérios em memória...')
      
      const analises: AnaliseResult[] = []
      const paraAlterar: AnaliseResult[] = []
      const paraManter: AnaliseResult[] = []
      
      for (const licitacao of licitacoes) {
        const analise = analisarLicitacao(licitacao)
        analises.push(analise)
        
        if (analise.acao === 'ALTERAR_N') {
          paraAlterar.push(analise)
        } else {
          paraManter.push(analise)
        }
      }
      
      console.log(`📊 Análise concluída:`)
      console.log(`   - Total analisadas: ${licitacoes.length}`)
      console.log(`   - Para ALTERAR (P→N): ${paraAlterar.length}`)
      console.log(`   - Para MANTER (P): ${paraManter.length}`)
      
      return NextResponse.json({
        success: true,
        etapa: 'analise_concluida',
        resumo: {
          totalAnalisadas: licitacoes.length,
          paraAlterar: paraAlterar.length,
          paraManter: paraManter.length,
          percentualAlteracao: Math.round((paraAlterar.length / licitacoes.length) * 100)
        },
        exemplosParaAlterar: paraAlterar.slice(0, 10).map(item => ({
          id: item.id,
          titulo: item.titulo.substring(0, 80),
          motivo: item.motivo,
          palavrasEncontradas: item.palavrasEncontradas
        })),
        // Salvar IDs para a próxima etapa
        idsParaAlterar: paraAlterar.map(item => item.id)
      })
    }
    
    if (etapa === 'executar') {
      // ETAPA 3: EXECUTAR AS ATUALIZAÇÕES
      if (!Array.isArray(idsParaAlterar) || idsParaAlterar.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Nenhuma licitação para atualizar',
          atualizadas: 0
        })
      }
      
      console.log(`🔄 Executando atualizações para ${idsParaAlterar.length} licitações...`)
      
      // Atualizar em lotes para melhor performance
      const batchSize = 50
      let totalAtualizadas = 0
      const erros: string[] = []
      
      for (let i = 0; i < idsParaAlterar.length; i += batchSize) {
        const batch = idsParaAlterar.slice(i, i + batchSize)
        
        const { error: updateError } = await supabase
          .from('licitacoes')
          .update({ interece: 'N' })
          .in('id', batch)
        
        if (updateError) {
          erros.push(`Erro no lote ${i}-${i + batchSize}: ${updateError.message}`)
        } else {
          totalAtualizadas += batch.length
        }
      }
      
      console.log(`✅ Atualizações concluídas: ${totalAtualizadas} licitações`)
      
      return NextResponse.json({
        success: erros.length === 0,
        etapa: 'concluido',
        atualizadas: totalAtualizadas,
        erros: erros,
        message: erros.length === 0 
          ? `${totalAtualizadas} licitações atualizadas com sucesso!`
          : `${totalAtualizadas} licitações atualizadas com ${erros.length} erros`
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Etapa inválida. Use "analisar" ou "executar"'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Erro na classificação otimizada:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 