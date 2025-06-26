import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔄 Atualizando constraint de status...')

    // 1. Remover constraint antiga
    const { error: dropError } = await supabase.rpc('executar_sql', {
      sql_query: 'ALTER TABLE controle_consultas DROP CONSTRAINT IF EXISTS status_validos;'
    })

    if (dropError) {
      console.error('Erro ao remover constraint:', dropError)
      return NextResponse.json({
        error: 'Erro ao remover constraint antiga',
        details: dropError.message
      }, { status: 500 })
    }

    // 2. Adicionar nova constraint
    const { error: addError } = await supabase.rpc('executar_sql', {
      sql_query: `ALTER TABLE controle_consultas 
                  ADD CONSTRAINT status_validos 
                  CHECK (status_ultima_consulta IN ('sucesso', 'erro', 'parcial', 'ajuste_manual'));`
    })

    if (addError) {
      console.error('Erro ao adicionar constraint:', addError)
      return NextResponse.json({
        error: 'Erro ao adicionar nova constraint',
        details: addError.message
      }, { status: 500 })
    }

    // 3. Verificar se funcionou
    const { data: verificacao, error: verifyError } = await supabase.rpc('executar_sql', {
      sql_query: `SELECT constraint_name, check_clause 
                  FROM information_schema.check_constraints 
                  WHERE constraint_name = 'status_validos';`
    })

    if (verifyError) {
      console.warn('Erro ao verificar constraint:', verifyError)
    }

    console.log('✅ Constraint atualizada com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Constraint de status atualizada com sucesso',
      statusPermitidos: ['sucesso', 'erro', 'parcial', 'ajuste_manual'],
      verificacao: verificacao || 'Não foi possível verificar'
    })

  } catch (error) {
    console.error('Erro ao atualizar constraint:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 