'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSimple() {
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testarFiltroPortal = async () => {
    setLoading(true)
    try {
      console.log('=== TESTE DIRETO NO SUPABASE ===')
      
      // Teste 1: Buscar todos os registros
      console.log('1. Buscando todos os registros...')
      const { data: todos, error: erroTodos } = await supabase
        .from('licitacoes')
        .select('id, titulo, link_externo')
        .limit(5)
      
      if (erroTodos) throw erroTodos
      
      // Teste 2: Buscar apenas compras.rs.gov.br
      console.log('2. Buscando apenas compras.rs.gov.br...')
      const { data: filtrados, error: erroFiltrados } = await supabase
        .from('licitacoes')
        .select('id, titulo, link_externo')
        .ilike('link_externo', '%compras.rs.gov.br%')
        .limit(5)
      
      if (erroFiltrados) throw erroFiltrados
      
      // Teste 3: Verificar se existe algum registro com compras.rs.gov.br
      console.log('3. Verificando existência de compras.rs.gov.br...')
      const { data: existe, error: erroExiste } = await supabase
        .from('licitacoes')
        .select('id', { count: 'exact' })
        .ilike('link_externo', '%compras.rs.gov.br%')
      
      if (erroExiste) throw erroExiste
      
      setResultado({
        todos: {
          total: todos?.length || 0,
          exemplos: todos?.map((item: any) => ({
            id: item.id,
            titulo: item.titulo.substring(0, 30) + '...',
            link: item.link_externo
          })) || []
        },
        filtrados: {
          total: filtrados?.length || 0,
          exemplos: filtrados?.map((item: any) => ({
            id: item.id,
            titulo: item.titulo.substring(0, 30) + '...',
            link: item.link_externo
          })) || []
        },
        existeComprasRS: existe?.length || 0
      })
      
    } catch (error) {
      console.error('Erro no teste:', error)
      setResultado({ erro: error instanceof Error ? error.message : 'Erro desconhecido' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste Direto - Filtro Portal</h1>
      
      <button 
        onClick={testarFiltroPortal}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testando...' : 'Testar Filtro Portal'}
      </button>
      
      {resultado && (
        <div className="mt-6 space-y-4">
          {resultado.erro ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Erro:</strong> {resultado.erro}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-bold text-lg mb-2">Todos os Registros (5 primeiros)</h3>
                <p><strong>Total encontrado:</strong> {resultado.todos.total}</p>
                <div className="mt-2">
                  {resultado.todos.exemplos.map((item: any, index: number) => (
                    <div key={index} className="text-sm border-b py-1">
                      <div><strong>ID:</strong> {item.id}</div>
                      <div><strong>Título:</strong> {item.titulo}</div>
                      <div><strong>Link:</strong> {item.link}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-100 p-4 rounded">
                <h3 className="font-bold text-lg mb-2">Filtrados por compras.rs.gov.br</h3>
                <p><strong>Total encontrado:</strong> {resultado.filtrados.total}</p>
                <p><strong>Registros que contêm compras.rs.gov.br:</strong> {resultado.existeComprasRS}</p>
                <div className="mt-2">
                  {resultado.filtrados.exemplos.length > 0 ? (
                    resultado.filtrados.exemplos.map((item: any, index: number) => (
                      <div key={index} className="text-sm border-b py-1">
                        <div><strong>ID:</strong> {item.id}</div>
                        <div><strong>Título:</strong> {item.titulo}</div>
                        <div><strong>Link:</strong> {item.link}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-red-600">Nenhum registro encontrado com compras.rs.gov.br</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 