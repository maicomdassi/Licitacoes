'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Settings, Loader2 } from 'lucide-react'

export default function SetupAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    profiles?: any[]
    error?: string
  } | null>(null)

  const executeSetup = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao executar setup',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Setup do Sistema de Admin</CardTitle>
            <CardDescription>
              Configure a tabela de perfis e defina maicomdassi@gmail.com como administrador
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">O que este setup fará:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Verificar se a tabela `profiles` existe</li>
                <li>• Configurar políticas de segurança (RLS)</li>
                <li>• Definir maicomdassi@gmail.com como administrador</li>
                <li>• Criar estrutura para gerenciamento de usuários</li>
              </ul>
            </div>

            <Button 
              onClick={executeSetup} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executando Setup...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Executar Setup
                </>
              )}
            </Button>

            {result && (
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
                    <strong>{result.success ? 'Sucesso!' : 'Erro!'}</strong> {result.message}
                    {result.error && (
                      <div className="mt-2 text-xs font-mono bg-background p-2 rounded">
                        {result.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {result?.profiles && result.profiles.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Perfis encontrados:</h3>
                <div className="bg-muted p-3 rounded text-sm">
                  <pre>{JSON.stringify(result.profiles, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Após o setup, você pode acessar{' '}
                <a href="/" className="text-primary hover:underline">
                  a página inicial
                </a>{' '}
                para ver a sidebar de administração.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 