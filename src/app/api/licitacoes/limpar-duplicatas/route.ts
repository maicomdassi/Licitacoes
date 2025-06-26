import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpeza de duplicatas...')

    // Primeira fase: Identificar duplicatas por id_licitacao
    console.log('🔍 Fase 1: Identificando duplicatas por id_licitacao...')
    
    const { data: duplicatasPorId, error: errorId } = await supabase.rpc('identificar_duplicatas_por_id')
    
    if (errorId) {
      console.error('❌ Erro ao identificar duplicatas por ID:', errorId)
      throw errorId
    }

    let removidasPorId = 0
    if (duplicatasPorId && duplicatasPorId.length > 0) {
      console.log(`📊 Encontradas ${duplicatasPorId.length} licitações com id_licitacao duplicado`)
      
      // Remover duplicatas mantendo apenas a mais recente
      for (const duplicata of duplicatasPorId) {
        const { error: deleteError } = await supabase
          .from('licitacoes')
          .delete()
          .eq('id_licitacao', duplicata.id_licitacao)
          .neq('id', duplicata.id_mais_recente) // Manter apenas o mais recente

        if (!deleteError) {
          removidasPorId++
        }
      }
      
      console.log(`✅ Removidas ${removidasPorId} duplicatas por id_licitacao`)
    } else {
      console.log('✅ Nenhuma duplicata por id_licitacao encontrada')
    }

    // Segunda fase: Identificar duplicatas por conteúdo similar
    console.log('🔍 Fase 2: Identificando duplicatas por conteúdo similar...')
    
    const { data: duplicatasPorConteudo, error: errorConteudo } = await supabase.rpc('identificar_duplicatas_por_conteudo')
    
    if (errorConteudo) {
      console.error('❌ Erro ao identificar duplicatas por conteúdo:', errorConteudo)
      throw errorConteudo
    }

    let removidasPorConteudo = 0
    if (duplicatasPorConteudo && duplicatasPorConteudo.length > 0) {
      console.log(`📊 Encontradas ${duplicatasPorConteudo.length} licitações com conteúdo similar`)
      
      // Remover duplicatas mantendo apenas a mais recente
      for (const duplicata of duplicatasPorConteudo) {
        const { error: deleteError } = await supabase
          .from('licitacoes')
          .delete()
          .eq('id', duplicata.id_para_remover)

        if (!deleteError) {
          removidasPorConteudo++
        }
      }
      
      console.log(`✅ Removidas ${removidasPorConteudo} duplicatas por conteúdo`)
    } else {
      console.log('✅ Nenhuma duplicata por conteúdo encontrada')
    }

    // Terceira fase: Limpeza de registros inválidos
    console.log('🔍 Fase 3: Removendo registros inválidos...')
    
    const { count: removidasInvalidas, error: errorInvalidas } = await supabase
      .from('licitacoes')
      .delete()
      .or('titulo.is.null,titulo.eq.,objeto.is.null,objeto.eq.')
      .select('*', { count: 'exact', head: true })

    if (errorInvalidas) {
      console.warn('⚠️ Erro ao remover registros inválidos:', errorInvalidas)
    } else {
      console.log(`✅ Removidos ${removidasInvalidas || 0} registros inválidos`)
    }

    const totalRemovidas = removidasPorId + removidasPorConteudo + (removidasInvalidas || 0)

    // Atualizar estatísticas
    const { count: totalRestante } = await supabase
      .from('licitacoes')
      .select('*', { count: 'exact', head: true })

    console.log(`🎉 Limpeza concluída!`)
    console.log(`📊 Resumo:`)
    console.log(`   • Duplicatas por ID removidas: ${removidasPorId}`)
    console.log(`   • Duplicatas por conteúdo removidas: ${removidasPorConteudo}`)
    console.log(`   • Registros inválidos removidos: ${removidasInvalidas || 0}`)
    console.log(`   • Total removido: ${totalRemovidas}`)
    console.log(`   • Licitações restantes: ${totalRestante || 0}`)

    return NextResponse.json({
      success: true,
      removidas: totalRemovidas,
      detalhes: {
        removidasPorId,
        removidasPorConteudo,
        removidasInvalidas: removidasInvalidas || 0,
        totalRestante: totalRestante || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na limpeza de duplicatas:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Função para criar as stored procedures necessárias no Supabase
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Criando stored procedures para limpeza de duplicatas...')

    // Procedure para identificar duplicatas por id_licitacao
    const procedureId = `
      CREATE OR REPLACE FUNCTION identificar_duplicatas_por_id()
      RETURNS TABLE(id_licitacao VARCHAR, id_mais_recente BIGINT, total_duplicatas BIGINT)
      LANGUAGE sql
      AS $$
        SELECT 
          l.id_licitacao,
          MAX(l.id) as id_mais_recente,
          COUNT(*) as total_duplicatas
        FROM licitacoes l
        WHERE l.id_licitacao IS NOT NULL 
          AND l.id_licitacao != ''
        GROUP BY l.id_licitacao
        HAVING COUNT(*) > 1
        ORDER BY total_duplicatas DESC;
      $$;
    `

    // Procedure para identificar duplicatas por conteúdo
    const procedureConteudo = `
      CREATE OR REPLACE FUNCTION identificar_duplicatas_por_conteudo()
      RETURNS TABLE(id_para_remover BIGINT, titulo VARCHAR, orgao VARCHAR, total_similares BIGINT)
      LANGUAGE sql
      AS $$
        WITH duplicatas AS (
          SELECT 
            titulo,
            orgao,
            municipio,
            COUNT(*) as total,
            MIN(id) as id_manter,
            ARRAY_AGG(id ORDER BY created_at DESC) as todos_ids
          FROM licitacoes
          WHERE titulo IS NOT NULL 
            AND titulo != ''
            AND orgao IS NOT NULL
            AND orgao != ''
          GROUP BY titulo, orgao, municipio
          HAVING COUNT(*) > 1
        )
        SELECT 
          UNNEST(todos_ids[2:]) as id_para_remover,
          titulo,
          orgao,
          total as total_similares
        FROM duplicatas
        ORDER BY total_similares DESC;
      $$;
    `

    // Executar procedures
    const { error: errorId } = await supabase.rpc('executar_sql', {
      sql_query: procedureId
    })

    if (errorId) {
      console.error('❌ Erro ao criar procedure de ID:', errorId)
      throw errorId
    }

    const { error: errorConteudo } = await supabase.rpc('executar_sql', {
      sql_query: procedureConteudo
    })

    if (errorConteudo) {
      console.error('❌ Erro ao criar procedure de conteúdo:', errorConteudo)
      throw errorConteudo
    }

    console.log('✅ Stored procedures criadas com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Stored procedures para limpeza de duplicatas criadas',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro ao criar procedures:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 