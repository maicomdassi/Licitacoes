import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const criterio = searchParams.get('criterio') || 'id_licitacao' // id_licitacao, titulo, objeto
    
    console.log(`🔍 Detectando registros duplicados por ${criterio}...`)
    
    // Buscar todos os registros para análise
    const { data: todosRegistros, error } = await supabase
      .from('licitacoes')
      .select('id, titulo, objeto, link_externo, interece, created_at, id_licitacao')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Erro ao buscar registros: ${error.message}`)
    }

    if (!todosRegistros || todosRegistros.length === 0) {
      return NextResponse.json({
        success: true,
        duplicados: [],
        totalAnalisados: 0,
        totalDuplicados: 0,
        criterio
      })
    }

    // Função para normalizar texto (uppercase e remover acentos)
    const normalizarTexto = (texto: string): string => {
      return texto
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' ') // Remove espaços extras
        .trim()
    }

    // Agrupar baseado no critério selecionado
    const grupos: { [key: string]: any[] } = {}
    
    todosRegistros.forEach((registro: any) => {
      let chave = ''
      
      switch (criterio) {
        case 'id_licitacao':
          chave = registro.id_licitacao?.toString().trim() || ''
          break
        case 'titulo':
          chave = normalizarTexto(registro.titulo || '')
          break
        case 'objeto':
          chave = normalizarTexto(registro.objeto || '')
          break
        default:
          chave = registro.id_licitacao?.toString().trim() || ''
      }
      
      if (chave && chave.length > 5) { // Só considerar chaves válidas com mais de 5 caracteres
        if (!grupos[chave]) {
          grupos[chave] = []
        }
        grupos[chave].push(registro)
      }
    })

    // Filtrar apenas grupos com mais de 1 registro (duplicados)
    const duplicados = Object.entries(grupos)
      .filter(([_, registros]) => registros.length > 1)
      .map(([chaveNormalizada, registros]) => ({
        chaveNormalizada: chaveNormalizada,
        criterio: criterio,
        quantidade: registros.length,
        registros: registros.map((r: any) => ({
          id: r.id,
          titulo: r.titulo,
          objeto: r.objeto?.substring(0, 100) + '...',
          link_externo: r.link_externo,
          interece: r.interece,
          created_at: r.created_at,
          id_licitacao: r.id_licitacao
        })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Ordenar por data (mais antigo primeiro)
      }))
      .sort((a, b) => b.quantidade - a.quantidade) // Ordenar por quantidade de duplicados

    const totalDuplicados = duplicados.reduce((acc, grupo) => acc + grupo.quantidade, 0)

    console.log(`✅ Análise concluída: ${duplicados.length} grupos de duplicados encontrados (baseado em ${criterio})`)

    return NextResponse.json({
      success: true,
      duplicados,
      totalAnalisados: todosRegistros.length,
      totalDuplicados,
      totalGrupos: duplicados.length,
      criterio
    })

  } catch (error) {
    console.error('❌ Erro na detecção de duplicados:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'IDs dos registros são obrigatórios'
      }, { status: 400 })
    }

    console.log(`🗑️ Excluindo ${ids.length} registros duplicados:`, ids)

    const { error } = await supabase
      .from('licitacoes')
      .delete()
      .in('id', ids)

    if (error) {
      throw new Error(`Erro ao excluir registros: ${error.message}`)
    }

    console.log(`✅ ${ids.length} registros excluídos com sucesso`)

    return NextResponse.json({
      success: true,
      excluidos: ids.length
    })

  } catch (error) {
    console.error('❌ Erro na exclusão de duplicados:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 