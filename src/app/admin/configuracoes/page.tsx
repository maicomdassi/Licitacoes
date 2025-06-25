'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import AdminRoute from '@/components/auth/AdminRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getPortaisUnicos, getConfiguracao, setConfiguracao } from '@/lib/supabase'
import { Settings, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [portalPadrao, setPortalPadrao] = useState<string>('')
  const [portaisDisponiveis, setPortaisDisponiveis] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Carregar configuração atual e portais disponíveis em paralelo
      const [configResult, portaisResult] = await Promise.all([
        getConfiguracao('portal_padrao'),
        getPortaisUnicos() // Todos os portais disponíveis
      ])

      if (configResult.data) {
        setPortalPadrao(configResult.data)
      } else {
        setPortalPadrao('compras.rs.gov.br') // valor padrão
      }

      if (portaisResult.data) {
        setPortaisDisponiveis(portaisResult.data)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' })
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async () => {
    if (!portalPadrao) {
      setMessage({ type: 'error', text: 'Selecione um portal padrão' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { success, error } = await setConfiguracao(
        'portal_padrao',
        portalPadrao,
        'Portal padrão selecionado nos filtros de licitações'
      )

      if (success) {
        setMessage({ type: 'success', text: 'Configuração salva com sucesso!' })
      } else {
        setMessage({ type: 'error', text: error || 'Erro ao salvar configuração' })
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar configuração' })
    } finally {
      setSaving(false)
    }
  }

  const handlePortalCustomizado = (valor: string) => {
    setPortalPadrao(valor)
    setMessage(null)
  }

  return (
    <AdminRoute>
      <AppLayout>
        <div className="py-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Settings size={20} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Configurações do Sistema
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie as configurações globais do sistema de licitações.
            </p>
          </div>

          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                  {message.text}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuração do Portal Padrão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={18} />
                  Portal Padrão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="portal-select">Selecionar Portal Padrão</Label>
                      <Select value={portalPadrao} onValueChange={setPortalPadrao}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um portal..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="compras.rs.gov.br">compras.rs.gov.br (Recomendado)</SelectItem>
                          {portaisDisponiveis
                            .filter(portal => portal !== 'compras.rs.gov.br')
                            .map((portal) => (
                              <SelectItem key={portal} value={portal}>
                                {portal}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Este portal será selecionado automaticamente quando os usuários acessarem o sistema.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portal-customizado">Ou digite um portal customizado</Label>
                      <Input
                        id="portal-customizado"
                        placeholder="exemplo.gov.br"
                        value={portalPadrao}
                        onChange={(e) => handlePortalCustomizado(e.target.value)}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Digite o domínio de um portal específico (sem www. ou http://).
                      </p>
                    </div>

                    <Button 
                      onClick={handleSalvar} 
                      disabled={saving || !portalPadrao}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Salvar Configuração
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Portal Padrão</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Define qual portal será selecionado automaticamente no filtro da página principal.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Valor Atual</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {loading ? 'Carregando...' : portalPadrao || 'Nenhum portal configurado'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Portais Disponíveis</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {loading ? 'Carregando...' : `${portaisDisponiveis.length} portais encontrados no sistema`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AdminRoute>
  )
} 