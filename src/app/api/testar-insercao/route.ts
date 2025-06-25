import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando inserção de dados na tabela licitacoes...')
    
    // Dados de teste
    const dadoTeste = {
      id_licitacao: 'TESTE-001',
      titulo: 'Teste de Classificação Inteligente',
      municipio_ibge: '4300000',
      uf: 'RS',
      orgao: 'Órgão de Teste',
      abertura_datetime: new Date().toISOString(),
      objeto: 'Construção de escola pública - teste da classificação',
      link: 'https://exemplo.com/teste',
      municipio: 'Porto Alegre',
      abertura: new Date().toLocaleDateString('pt-BR'),
      abertura_com_hora: new Date().toLocaleString('pt-BR'),
      id_tipo: '1',
      tipo: 'Pregão Eletrônico',
      data_insercao: new Date().toLocaleDateString('pt-BR'),
      interece: 'P' as const
    }
    
    // Tentar inserir
    const { data, error } = await supabase
      .from('licitacoes')
      .insert([dadoTeste])
      .select()
    
    if (error) {
      throw new Error(`Erro ao inserir: ${error.message}`)
    }
    
    // Verificar se foi inserido
    const { data: verificacao, error: verificacaoError } = await supabase
      .from('licitacoes')
      .select('id, titulo, interece')
      .eq('id_licitacao', 'TESTE-001')
    
    return NextResponse.json({
      success: true,
      message: 'Dados de teste inseridos com sucesso!',
      dadosInseridos: data,
      verificacao: verificacao
    })
    
  } catch (error) {
    console.error('Erro no teste de inserção:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 