'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Settings, Loader2 } from 'lucide-react'

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [configResult, setConfigResult] = useState<any>(null)

  const setupAdmin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/force-admin', {
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

  const setupConfiguracoes = async () => {
    setConfigLoading(true)
    setConfigResult(null)
    
    try {
      const response = await fetch('/api/setup-configuracoes', {
        method: 'POST',
      })
      
      const data = await response.json()
      setConfigResult(data)
    } catch (error) {
      setConfigResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setConfigLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Setup do Sistema</h1>
        <p className="text-muted-foreground">
          Configure as tabelas e dados iniciais necessários para o funcionamento do sistema
        </p>
      </div>

      {/* Setup Admin */}
      <Card>
        <CardHeader>
          <CardTitle>1. Setup de Administrador</CardTitle>
          <CardDescription>
            Força o usuário atual como administrador do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={setupAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Configurando...' : 'Configurar Admin'}
          </Button>
          
          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {result.success ? (
                  <div className="text-green-800">
                    ✅ {result.message}
                  </div>
                ) : (
                  <div className="text-red-800">
                    ❌ {result.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>2. Setup da Tabela de Configurações</CardTitle>
          <CardDescription>
            Cria a tabela de configurações do sistema e insere os valores padrão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={setupConfiguracoes} 
            disabled={configLoading}
            className="w-full"
            variant="secondary"
          >
            {configLoading ? 'Criando Tabela...' : 'Criar Tabela de Configurações'}
          </Button>
          
          {configResult && (
            <Alert className={configResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {configResult.success ? (
                  <div className="text-green-800">
                    ✅ {configResult.message}
                  </div>
                ) : (
                  <div className="text-red-800 space-y-2">
                    <div>❌ {configResult.error}</div>
                    {configResult.sqlToExecute && (
                      <div className="mt-4">
                        <div className="font-medium mb-2">Execute este SQL no Supabase:</div>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                          {configResult.sqlToExecute}
                        </pre>
                      </div>
                    )}
                    {configResult.instructions && (
                      <div className="mt-4">
                        <div className="font-medium mb-2">Instruções:</div>
                        <div className="text-sm">
                          {configResult.instructions.map((instruction: string, index: number) => (
                            <div key={index}>{instruction}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Execute o setup de administrador primeiro</p>
            <p>2. Crie a tabela de configurações</p>
            <p>3. Acesse o sistema normalmente</p>
            <p>4. Configure o portal padrão nas configurações se necessário</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 