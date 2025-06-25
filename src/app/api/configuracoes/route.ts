import { NextRequest, NextResponse } from 'next/server'
import { getAllConfiguracoes, getConfiguracao, setConfiguracao } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chave = searchParams.get('chave')

    if (chave) {
      // Buscar configuração específica
      const { data, error } = await getConfiguracao(chave)
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: error
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: { chave, valor: data }
      })
    } else {
      // Buscar todas as configurações
      const { data, error } = await getAllConfiguracoes()
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: error
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: data
      })
    }
  } catch (error) {
    console.error('Erro na API de configurações:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chave, valor, descricao } = body

    if (!chave || !valor) {
      return NextResponse.json({
        success: false,
        error: 'Chave e valor são obrigatórios'
      }, { status: 400 })
    }

    const { success, error } = await setConfiguracao(chave, valor, descricao)
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso'
    })

  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 