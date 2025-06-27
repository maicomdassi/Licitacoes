'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function VerificarPortal() {
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const verificarPortal = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/verificar-urls-invalidas')
      const data = await response.json()
      
      if (data.success) {
        const portaisValidos = data.portaisValidos.lista || []
        const temComprasRS = portaisValidos.includes('compras.rs.gov.br')
        
        setResultado({
          totalPortais: data.portaisValidos.count,
          portaisExemplo: portaisValidos.slice(0, 10),
          temComprasRS: temComprasRS,
          message: temComprasRS 
            ? '✅ Portal compras.rs.gov.br encontrado nos dados!' 
            : '❌ Portal compras.rs.gov.br NÃO encontrado nos dados'
        })
      } else {
        setResultado({ erro: data.error })
      }
    } catch (error) {
      console.error('Erro:', error)
      setResultado({ erro: 'Erro ao verificar portal' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verificarPortal()
  }, [])

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Verificar Portal compras.rs.gov.br</h1>
      
      <Button onClick={verificarPortal} disabled={loading} className="mb-6">
        {loading ? 'Verificando...' : 'Verificar Novamente'}
      </Button>

      {resultado && (
        <div className="space-y-4">
          {resultado.erro ? (
            <div className="p-4 bg-red-100 border border-red-300 rounded">
              <strong>Erro:</strong> {resultado.erro}
            </div>
          ) : (
            <>
              <div className={`p-4 border rounded ${resultado.temComprasRS ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-yellow-300'}`}>
                <h3 className="font-bold text-lg mb-2">{resultado.message}</h3>
                <p>Total de portais válidos encontrados: {resultado.totalPortais}</p>
              </div>
              
              <div className="p-4 bg-muted rounded">
                <h3 className="font-bold mb-2">Exemplos de portais encontrados:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {resultado.portaisExemplo.map((portal: string, index: number) => (
                    <li key={index} className={portal === 'compras.rs.gov.br' ? 'font-bold text-green-600' : ''}>
                      {portal}
                    </li>
                  ))}
                </ul>
              </div>
              
              {!resultado.temComprasRS && (
                <div className="p-4 bg-blue-100 border border-blue-300 rounded">
                  <h3 className="font-bold mb-2">💡 Sugestão:</h3>
                  <p>O portal &apos;compras.rs.gov.br&apos; não foi encontrado nos dados atuais. 
                     Isso pode explicar por que o filtro não está funcionando. 
                     Considere usar um dos portais listados acima como padrão.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
} 