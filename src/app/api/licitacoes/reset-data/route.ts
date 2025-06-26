import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔄 Resetando última data consultada...')
    
    // Deleta todos os registros de controle para recomeçar
    const { error: deleteError } = await supabase
      .from('controle_consultas')
      .delete()
      .neq('id', 0) // Deleta todos os registros
    
    if (deleteError) {
      console.error('❌ Erro ao resetar:', deleteError)
      return NextResponse.json({
        success: false,
        error: deleteError.message
      }, { status: 500 })
    }
    
    console.log('✅ Data resetada com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Última data consultada resetada. Próxima execução buscará os últimos 30 dias.',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('💥 Erro ao resetar data:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 