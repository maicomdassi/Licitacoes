import { NextRequest, NextResponse } from 'next/server'
import { executarClassificacaoInteligente, gerarRelatorioClassificacao } from '@/lib/classificacao-inteligente'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando classificação inteligente via API...')
    
    const resultado = await executarClassificacaoInteligente()
    const relatorio = gerarRelatorioClassificacao(resultado)
    
    return NextResponse.json({
      success: resultado.success,
      resultado,
      relatorio
    })
    
  } catch (error) {
    console.error('Erro na API de classificação:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      resultado: {
        success: false,
        backupCreated: false,
        totalProcessados: 0,
        alterados: 0,
        mantidos: 0,
        erros: [error instanceof Error ? error.message : 'Erro desconhecido'],
        detalhes: {
          alteradosParaN: [],
          mantidosComoP: []
        }
      }
    }, { status: 500 })
  }
} 