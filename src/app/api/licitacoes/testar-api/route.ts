import { NextResponse } from 'next/server'
import { getAPILicitacoesClient } from '@/lib/api-licitacoes'

export async function GET() {
  console.log('🧪 Testando conectividade com API externa...')
  
  try {
    const client = getAPILicitacoesClient()
    
    // Tenta primeira requisição
    console.log('📡 Tentativa 1: Requisição padrão...')
    let resultado = await client.testarAPI()
    
    // Se falhou por IP, aguarda um pouco e tenta novamente
    if (!resultado.sucesso && resultado.erro?.includes('IP não autorizado')) {
      console.log('⏳ Aguardando 3 segundos para nova tentativa...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      console.log('📡 Tentativa 2: Nova requisição após aguardar...')
      resultado = await client.testarAPI()
    }
    
    // Informações adicionais de diagnóstico
    const diagnostico = {
      timestamp: new Date().toISOString(),
      ipAtual: await client.obterIPAtual(),
      tokenConfigurado: client.isConfigured(),
      urlAPI: 'https://alertalicitacao.com.br/api/v1/licitacoesAbertas/',
      userAgent: 'NextJS-LicitacaoBot/1.0'
    }
    
    if (resultado.sucesso) {
      return NextResponse.json({ 
        success: true, 
        message: 'API externa funcionando corretamente!',
        dados: resultado.detalhes,
        diagnostico
      })
    } else {
      // Categoriza o tipo de erro
      let tipoErro = 'ERRO_GERAL'
      let instrucoes = 'Verifique a configuração da API'
      
      if (resultado.erro?.includes('Token da API não configurado')) {
        tipoErro = 'TOKEN_NAO_CONFIGURADO'
        instrucoes = 'Configure a variável ALERTA_LICITACAO_TOKEN no arquivo .env.local'
      } else if (resultado.erro?.includes('IP não autorizado')) {
        tipoErro = 'IP_NAO_AUTORIZADO'
        instrucoes = `Acesse https://alertalicitacao.com.br e autorize o IP ${diagnostico.ipAtual} para seu token`
      } else if (resultado.erro?.includes('Sem resposta da API')) {
        tipoErro = 'API_OFFLINE'
        instrucoes = 'A API externa pode estar temporariamente fora do ar. Tente novamente em alguns minutos.'
      }
      
      return NextResponse.json({ 
        success: false, 
        error: resultado.erro,
        tipoErro,
        instrucoes,
        diagnostico
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('💥 Erro crítico no teste da API:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno no servidor',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 