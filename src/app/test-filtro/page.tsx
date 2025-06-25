'use client'

import { useState } from 'react'
import { getLicitacoes } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestFiltro() {
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [portal, setPortal] = useState('compras.rs.gov.br')

  const testarFiltro = async () => {
    setLoading(true)
    try {
      console.log('=== TESTE DE FILTRO ===')
      console.log('Portal a ser filtrado:', portal)
      console.log('Parâmetros enviados:', {
        pagina: 0,
        limite: 5,
        interesse: 'P',
        portal: portal
      })
      
      const { data, total } = await getLicitacoes(0, 5, 'P', {
        portal: portal
      })
      
      console.log('Resultado recebido:', { total, registros: data.length })
      
      setResultado({
        portal: portal,
        total: total,
        registros: data.length,
        filtroAplicado: portal !== 'todos',
        exemplos: data.slice(0, 5).map(item => ({
          id: item.id,
          titulo: item.titulo.substring(0, 50) + '...',
          link_externo: item.link_externo,
          contem_portal: item.link_externo?.toLowerCase().includes(portal.toLowerCase())
        }))
      })
    } catch (error) {
      console.error('Erro no teste:', error)
      setResultado({ erro: error instanceof Error ? error.message : 'Erro desconhecido' })
    } finally {
      setLoading(false)
    }
  }

  const testarSemFiltro = async () => {
    setLoading(true)
    try {
      console.log('Testando sem filtro de portal')
      
      const { data, total } = await getLicitacoes(0, 5, 'P')
      
      setResultado({
        portal: 'TODOS',
        total: total,
        registros: data.length,
        exemplos: data.slice(0, 3).map(item => ({
          id: item.id,
          titulo: item.titulo,
          link_externo: item.link_externo
        }))
      })
    } catch (error) {
      console.error('Erro no teste:', error)
      setResultado({ erro: error instanceof Error ? error.message : 'Erro desconhecido' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Filtro de Portal</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="portal">Portal para testar:</Label>
          <Input
            id="portal"
            value={portal}
            onChange={(e) => setPortal(e.target.value)}
            placeholder="compras.rs.gov.br"
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={testarFiltro} disabled={loading}>
            {loading ? 'Testando...' : 'Testar com Filtro'}
          </Button>
          <Button onClick={testarSemFiltro} disabled={loading} variant="outline">
            {loading ? 'Testando...' : 'Testar sem Filtro'}
          </Button>
        </div>
      </div>

      {resultado && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-bold mb-2">Resultado:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 