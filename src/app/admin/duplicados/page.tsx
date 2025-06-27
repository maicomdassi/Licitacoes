'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AdminRoute from '@/components/auth/AdminRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Loader2, Search, Zap, Shield } from 'lucide-react'

export default function DuplicadosPage() {
  const [loading, setLoading] = useState(false)
  const [loadingInteligente, setLoadingInteligente] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [resultInteligente, setResultInteligente] = useState<any>(null)

  const detectarDuplicados = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/detectar-duplicados', {
        method: 'POST',
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  const detectarDuplicadosInteligente = async () => {
    setLoadingInteligente(true)
    setResultInteligente(null)
    
    try {
      const response = await fetch('/api/detectar-duplicados-inteligente', {
        method: 'POST',
      })
      
      const data = await response.json()
      setResultInteligente(data)
    } catch (error) {
      setResultInteligente({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoadingInteligente(false)
    }
  }

  return (
    <AdminRoute>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Detecção de Duplicados</h1>
              <p className="text-muted-foreground">
                Identifique e remova licitações duplicadas do sistema
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detecção Tradicional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Detecção Tradicional
                </CardTitle>
                <CardDescription>
                  Método básico de detecção de duplicados por similaridade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={detectarDuplicados}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Detectar Duplicados
                </Button>

                {result && (
                  <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription>
                      {result.success ? (
                        <div className="space-y-2">
                          <p className="font-medium text-green-800">✅ Detecção concluída!</p>
                          <p className="text-green-700">
                            {result.duplicatasEncontradas || 0} duplicadas encontradas
                          </p>
                          <p className="text-green-700">
                            {result.licitacoesProcessadas || 0} licitações processadas
                          </p>
                        </div>
                      ) : (
                        <p className="text-red-800">❌ {result.error}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Detecção Inteligente */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Zap className="h-5 w-5" />
                  Detecção Inteligente
                  <Shield className="h-4 w-4 text-green-600" />
                </CardTitle>
                <CardDescription>
                  Método avançado que preserva o portal padrão configurado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <p className="font-medium">🛡️ Proteções:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                                         <li>Nunca marca portal padrão como &quot;Sem Interesse&quot;</li>
                     <li>Prioriza portais governamentais (.gov.br)</li>
                     <li>Critérios mais precisos (sem título similar)</li>
                  </ul>
                </div>

                <Button 
                  onClick={detectarDuplicadosInteligente}
                  disabled={loadingInteligente}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loadingInteligente && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Detectar Duplicados (Inteligente)
                </Button>

                {resultInteligente && (
                  <Alert className={resultInteligente.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <AlertDescription>
                      {resultInteligente.success ? (
                        <div className="space-y-2">
                          <p className="font-medium text-green-800">✅ Detecção inteligente concluída!</p>
                          <div className="text-green-700 space-y-1">
                            <p>Portal padrão: <span className="font-medium">{resultInteligente.portalPadrao}</span></p>
                            <p>Licitações analisadas: <span className="font-medium">{resultInteligente.licitacoesAnalisadas}</span></p>
                            <p>Grupos de duplicatas: <span className="font-medium">{resultInteligente.gruposDuplicatas}</span></p>
                                                         <p>Marcadas como &quot;N&quot;: <span className="font-medium">{resultInteligente.totalMarcadasComoN}</span></p>
                          </div>
                          
                          {resultInteligente.relatorio && resultInteligente.relatorio.length > 0 && (
                            <details className="mt-3">
                              <summary className="cursor-pointer font-medium text-green-800">
                                Ver detalhes dos grupos ({resultInteligente.relatorio.length} grupos)
                              </summary>
                              <div className="mt-2 max-h-40 overflow-y-auto">
                                {resultInteligente.relatorio.map((grupo: any, index: number) => (
                                  <div key={index} className="border-l-2 border-green-300 pl-3 mb-2 text-xs">
                                    <p className="font-medium">{grupo.criterio}</p>
                                    <p>Escolhida: ID {grupo.licitacaoEscolhida.id} ({grupo.licitacaoEscolhida.portal})</p>
                                    <p>Descartadas: {grupo.licitacoesDescartadas.map((l: any) => l.id).join(', ')}</p>
                                    {grupo.temPortalPadrao && (
                                      <p className="text-blue-600 font-medium">🎯 Portal padrão preservado</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      ) : (
                        <p className="text-red-800">❌ {resultInteligente.error}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Informações importantes */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">⚠️ Informações Importantes</CardTitle>
            </CardHeader>
            <CardContent className="text-amber-700 space-y-2">
                             <p>• <strong>Detecção Tradicional:</strong> Pode marcar licitações do portal padrão como &quot;Sem Interesse&quot;</p>
               <p>• <strong>Detecção Inteligente:</strong> Preserva sempre o portal padrão configurado</p>
              <p>• <strong>Critérios usados:</strong> Código idêntico, objeto similar (&gt;90%), datas próximas + objeto similar (&gt;85%)</p>
              <p>• <strong>Recomendação:</strong> Use sempre a detecção inteligente para manter a configuração do portal padrão</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AdminRoute>
  )
} 