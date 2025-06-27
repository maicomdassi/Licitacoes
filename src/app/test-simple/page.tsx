'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSimplePage() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    testarConexao()
  }, [])

  const testarConexao = async () => {
    try {
      console.log('🔍 Testando conexão com Supabase...')
      
      // Teste 1: Verificar se existe a tabela licitacoes
      console.log('📊 Verificando tabela licitacoes...')
      const { data: testData, error: testError } = await supabase
        .from('licitacoes')
        .select('id, titulo, interece, link_externo')
        .limit(5)

      if (testError) {
        console.error('❌ Erro ao acessar tabela:', testError)
        setError(`Erro ao acessar tabela: ${testError.message}`)
        return
      }

      console.log('✅ Dados encontrados:', testData?.length || 0)
      setDados(testData || [])

      // Teste 2: Contar registros por status
      console.log('📈 Contando registros por status...')
      const statsResult = await Promise.all([
        supabase.from('licitacoes').select('id', { count: 'exact' }).eq('interece', 'P'),
        supabase.from('licitacoes').select('id', { count: 'exact' }).eq('interece', 'S'),
        supabase.from('licitacoes').select('id', { count: 'exact' }).eq('interece', 'N'),
        supabase.from('licitacoes').select('id', { count: 'exact' })
      ])

      const [pendentes, interesse, semInteresse, total] = statsResult

      setStats({
        pendentes: pendentes.count || 0,
        interesse: interesse.count || 0,
        semInteresse: semInteresse.count || 0,
        total: total.count || 0
      })

      console.log('📊 Estatísticas:', {
        pendentes: pendentes.count,
        interesse: interesse.count,
        semInteresse: semInteresse.count,
        total: total.count
      })

    } catch (err) {
      console.error('💥 Erro geral:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste de Conexão - Carregando...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Erro de Conexão</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
        <button 
          onClick={testarConexao}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Conexão com Supabase</h1>
      
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-800">Total</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <div className="text-sm text-yellow-800">Pendentes</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.interesse}</div>
            <div className="text-sm text-green-800">Com Interesse</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.semInteresse}</div>
            <div className="text-sm text-red-800">Sem Interesse</div>
          </div>
        </div>
      )}

      {/* Primeiros registros */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Primeiros 5 registros encontrados:</h2>
        {dados.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800">Nenhum registro encontrado na tabela licitacoes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dados.map((item, index) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">ID: {item.id}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.interece === 'P' ? 'bg-yellow-100 text-yellow-800' :
                        item.interece === 'S' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.interece === 'P' ? 'Pendente' : 
                         item.interece === 'S' ? 'Com Interesse' : 'Sem Interesse'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      {item.titulo || 'Sem título'}
                    </h3>
                    {item.link_externo && (
                      <p className="text-sm text-gray-600">
                        Portal: {new URL(item.link_externo).hostname}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={testarConexao}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Atualizar Dados
      </button>
    </div>
  )
} 