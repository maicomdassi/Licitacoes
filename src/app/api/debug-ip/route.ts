import { NextResponse } from 'next/server'

export async function GET() {
  const servicos = [
    { nome: 'ipify', url: 'https://api.ipify.org?format=json' },
    { nome: 'httpbin', url: 'https://httpbin.org/ip' },
    { nome: 'ipecho', url: 'https://ipecho.net/plain' },
    { nome: 'myip', url: 'https://api.myip.com' }
  ]
  
  const resultados = []
  
  for (const servico of servicos) {
    try {
      console.log(`🔍 Testando serviço: ${servico.nome}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(servico.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NextJS-LicitacaoBot/1.0'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.text()
        let ip = 'N/A'
        
        try {
          const jsonData = JSON.parse(data)
          ip = jsonData.ip || jsonData.origin || data
        } catch {
          ip = data.trim()
        }
        
        resultados.push({
          servico: servico.nome,
          status: 'sucesso',
          ip: ip,
          tempo: `${Date.now()}ms`
        })
        
        console.log(`✅ ${servico.nome}: ${ip}`)
      } else {
        resultados.push({
          servico: servico.nome,
          status: 'erro',
          erro: `HTTP ${response.status}`
        })
        console.log(`❌ ${servico.nome}: HTTP ${response.status}`)
      }
    } catch (error) {
      resultados.push({
        servico: servico.nome,
        status: 'erro',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      console.log(`❌ ${servico.nome}: ${error}`)
    }
  }
  
  // Tenta também obter IP dos headers da requisição
  const headerIP = {
    xForwardedFor: '',
    xRealIP: '',
    xClientIP: '',
    cfConnectingIP: ''
  }
  
  // Note: Em desenvolvimento local, estes headers não estarão disponíveis
  
  const resumo = {
    timestamp: new Date().toISOString(),
    totalServicos: servicos.length,
    sucessos: resultados.filter(r => r.status === 'sucesso').length,
    erros: resultados.filter(r => r.status === 'erro').length,
    ipsEncontrados: [...new Set(resultados.filter(r => r.status === 'sucesso').map(r => r.ip))],
    resultados,
    headersRequisicao: headerIP,
    ambiente: process.env.NODE_ENV
  }
  
  console.log('📊 Resumo do diagnóstico de IP:', resumo)
  
  return NextResponse.json(resumo)
} 