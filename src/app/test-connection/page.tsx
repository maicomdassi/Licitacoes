'use client'

import { useState, useEffect } from 'react'
import { supabase, testConnection } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [supabaseInfo, setSupabaseInfo] = useState({
    url: '',
    key: ''
  })
  
  useEffect(() => {
    async function checkConnection() {
      try {
        // Obter informações do cliente Supabase
        const url = (supabase as any).supabaseUrl || 'URL não disponível'
        const key = (supabase as any).supabaseKey 
          ? `${(supabase as any).supabaseKey.substring(0, 10)}...` 
          : 'Chave não disponível'
        
        setSupabaseInfo({
          url,
          key
        })
        
        console.log('Testando conexão com Supabase...');
        
        // Teste direto com fetch para verificar se o domínio está acessível
        try {
          const response = await fetch(`${url}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              'apikey': (supabase as any).supabaseKey || ''
            }
          });
          console.log('Resposta do teste HTTP:', response.status, response.statusText);
        } catch (fetchError) {
          console.error('Erro ao acessar diretamente:', fetchError);
          setErrorDetails((prev: any) => ({...prev, fetchError}));
        }
        
        // Testar a conexão via SDK
        console.log('Chamando função testConnection()...');
        const result = await testConnection();
        console.log('Resultado do teste de conexão:', result);
        
        if (result.success) {
          setStatus('success')
        } else {
          setStatus('error')
          setErrorMessage(result.error || 'Erro desconhecido')
          setErrorDetails(result)
        }
      } catch (error) {
        console.error('Erro detalhado:', error);
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido')
        setErrorDetails({
          error,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined,
          toString: error instanceof Error ? error.toString() : String(error),
          fullError: JSON.stringify(error, (key, value) => 
            typeof value === 'function' ? value.toString() : value, 2)
        })
      }
    }
    
    checkConnection()
  }, [])
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Conexão com Supabase</h1>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-semibold mb-2">Configuração</h2>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <span className="font-medium">URL: </span>
            <span className="font-mono">{supabaseInfo.url}</span>
          </div>
          <div>
            <span className="font-medium">Chave: </span>
            <span className="font-mono">{supabaseInfo.key}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Status da Conexão</h2>
        
        {status === 'loading' && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
            <span>Testando conexão...</span>
          </div>
        )}
        
        {status === 'success' && (
          <div className="p-4 bg-green-100 text-green-800 rounded-md">
            <p className="font-semibold">✅ Conexão estabelecida com sucesso!</p>
            {errorDetails?.data && (
              <div className="mt-2">
                <p>Dados recebidos:</p>
                <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
                  {JSON.stringify(errorDetails.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {status === 'error' && (
          <div className="p-4 bg-red-100 text-red-800 rounded-md">
            <p className="font-semibold">❌ Erro ao conectar: {errorMessage}</p>
            {errorDetails && (
              <div className="mt-2">
                <details className="cursor-pointer">
                  <summary className="font-medium">Ver detalhes do erro</summary>
                  <div className="mt-2 p-2 bg-white rounded overflow-auto max-h-80">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(errorDetails, (key, value) => 
                        typeof value === 'function' ? value.toString() : value, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Testes Adicionais</h2>
        <div className="flex space-x-2">
          <button 
            onClick={async () => {
              try {
                const url = new URL(supabaseInfo.url);
                const hostname = url.hostname;
                console.log(`Testando DNS para ${hostname}...`);
                
                // Usando um serviço de DNS público para verificar o domínio
                const response = await fetch(`https://dns.google/resolve?name=${hostname}`);
                const data = await response.json();
                
                alert(`Resultado do teste DNS: ${JSON.stringify(data, null, 2)}`);
              } catch (error) {
                alert(`Erro ao testar DNS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Testar DNS
          </button>
          
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                  alert(`Erro na autenticação: ${error.message}`);
                } else {
                  alert(`Status da autenticação: ${data.session ? 'Autenticado' : 'Não autenticado'}`);
                }
              } catch (error) {
                alert(`Erro ao verificar autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Testar Autenticação
          </button>
          
          <button
            onClick={async () => {
              try {
                // Tentar criar a tabela licitacoes
                const { error } = await supabase.rpc('create_licitacoes_table');
                
                if (error) {
                  alert(`Erro ao criar tabela: ${error.message}`);
                } else {
                  alert('Tabela licitacoes criada com sucesso!');
                  window.location.reload();
                }
              } catch (error) {
                alert(`Erro ao criar tabela: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              }
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Criar Tabela
          </button>
        </div>
      </div>
      
      <div className="mt-8 mb-6">
        <h2 className="text-lg font-semibold mb-2">Teste de Autenticação</h2>
        <div className="p-4 border rounded-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border rounded"
              placeholder="seu@email.com"
              id="test-email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border rounded"
              placeholder="********"
              id="test-password"
            />
          </div>
          <button 
            onClick={async () => {
              try {
                const email = (document.getElementById('test-email') as HTMLInputElement)?.value;
                const password = (document.getElementById('test-password') as HTMLInputElement)?.value;
                
                if (!email || !password) {
                  alert('Por favor, preencha email e senha');
                  return;
                }
                
                console.log(`Tentando login com ${email}...`);
                const { data, error } = await supabase.auth.signInWithPassword({
                  email,
                  password
                });
                
                if (error) {
                  console.error('Erro de autenticação:', error);
                  alert(`Erro de login: ${error.message}`);
                } else {
                  console.log('Login bem-sucedido:', data);
                  alert(`Login bem-sucedido! Usuário: ${data.user?.email}`);
                  window.location.reload();
                }
              } catch (error) {
                console.error('Exceção durante login:', error);
                alert(`Erro durante login: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              }
            }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Testar Login
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Resolução de Problemas</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Verifique se a URL do Supabase está correta</li>
          <li>Verifique se a chave API do Supabase está correta</li>
          <li>Verifique se o projeto Supabase está online</li>
          <li>Verifique se há problemas de DNS ou rede</li>
          <li>Verifique se há bloqueios de firewall ou proxy</li>
          <li>Verifique se a tabela 'licitacoes' existe no banco de dados</li>
          <li>Verifique se as políticas de RLS estão configuradas corretamente</li>
          <li>Tente acessar diretamente <a href={supabaseInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">a URL do Supabase</a> para ver se o serviço está respondendo</li>
        </ul>
      </div>
    </div>
  )
} 