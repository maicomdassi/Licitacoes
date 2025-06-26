// Cliente para API externa de licitações
// Migrado da aplicação Python

interface LicitacaoAPI {
  id_licitacao: string
  titulo: string
  municipio_IBGE: string
  uf: string
  orgao: string
  abertura_datetime: string
  objeto: string
  link: string
  linkExterno: string
  municipio: string
  abertura: string
  aberturaComHora: string
  id_tipo: string
  tipo: string
  // Campos dinâmicos podem aparecer
  [key: string]: any
}

interface RespostaAPI {
  licitacoes: LicitacaoAPI[]
  totalLicitacoes: number
  licitacoesPorPagina: number
  totalErros: number
  erros: string[]
}

interface CampoDetectado {
  nome: string
  nomeOriginalAPI: string
  tipo: 'string' | 'number' | 'date' | 'boolean'
  frequencia: number
  exemplos: any[]
  tamanhoMax?: number
}

export class APILicitacoesClient {
  private baseUrl = 'https://alertalicitacao.com.br/api/v1/licitacoesAbertas/'
  private token: string
  private uf: string
  private modalidades: string

  constructor() {
    this.token = process.env.ALERTA_LICITACAO_TOKEN || ''
    this.uf = process.env.UF_PESQUISA || 'RS'
    this.modalidades = process.env.MODALIDADES || '1,2,4,5,6,11'
  }

  /**
   * Verifica se as configurações estão válidas
   */
  isConfigured(): boolean {
    return !!this.token && this.token.length > 0
  }

  /**
   * Obtém o IP atual do cliente
   */
  async obterIPAtual(): Promise<string> {
    try {
      // Usar serviço para obter IP público
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const data = await response.json()
      return data.ip || 'Desconhecido'
    } catch (error) {
      console.warn('Erro ao obter IP:', error)
      return 'Desconhecido'
    }
  }

  /**
   * Faz requisição para a API externa
   */
  async fazerRequisicao(
    dataInsercao?: Date,
    pagina: number = 1,
    licitacoesPorPagina: number = 100
  ): Promise<RespostaAPI | null> {
    if (!this.isConfigured()) {
      throw new Error('Token da API não configurado. Configure ALERTA_LICITACAO_TOKEN')
    }
    
    const headers = {
      'Token': this.token,
      'User-Agent': 'NextJS-LicitacaoBot/1.0',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }

    const params = new URLSearchParams({
      uf: this.uf,
      modalidade: this.modalidades,
      pagina: pagina.toString(),
      licitacoesPorPagina: licitacoesPorPagina.toString()
    })

    // Adiciona filtro de data se especificado
    if (dataInsercao) {
      params.append('data_insercao', dataInsercao.toISOString().split('T')[0])
    }

    try {
      console.log(`🔗 Requisição API: página ${pagina}${dataInsercao ? ` | data: ${dataInsercao.toISOString().split('T')[0]}` : ''}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
        cache: 'no-store'
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const dados = await response.json() as RespostaAPI

      // Verifica erros específicos de IP ou limitação
      if (dados.totalErros > 0) {
        const erros = dados.erros || []
        
        for (const erro of erros) {
          const erroStr = String(erro).toLowerCase()
          
          if (this.isErroDeIP(erroStr) || this.isErroDeIPEspecifico(erro)) {
            console.error('🚨 Erro de IP/Acesso detectado:', erro)
            throw new Error(`IP não autorizado: ${this.extrairMensagemIP(erro)}`)
          }
        }
        
        console.warn('⚠️ Outros erros encontrados:', erros)
        throw new Error(`Erros na API: ${this.formatarErros(erros)}`)
      }

      console.log(`✅ Sucesso: ${dados.licitacoes?.length || 0} licitações recebidas`)
      return dados

    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      return null
    }
  }

  /**
   * Testa se a API está acessível
   */
  async testarAPI(): Promise<{ sucesso: boolean; erro?: string; detalhes?: any }> {
    if (!this.isConfigured()) {
      return { 
        sucesso: false, 
        erro: 'Token da API não configurado. Configure ALERTA_LICITACAO_TOKEN no arquivo .env.local' 
      }
    }

    try {
      const dados = await this.fazerRequisicao(undefined, 1, 1)
      
      if (!dados) {
        return { sucesso: false, erro: 'Sem resposta da API' }
      }

      return { 
        sucesso: true, 
        detalhes: {
          totalLicitacoes: dados.totalLicitacoes,
          uf: this.uf,
          modalidades: this.modalidades
        }
      }
    } catch (error) {
      return { 
        sucesso: false, 
        erro: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  /**
   * Analisa estrutura dinâmica dos dados da API
   */
  analisarEstruturaDados(licitacoes: LicitacaoAPI[]): CampoDetectado[] {
    const camposDetectados = new Map<string, CampoDetectado>()

    for (const licitacao of licitacoes) {
      for (const [campoAPI, valor] of Object.entries(licitacao)) {
        if (valor !== null && valor !== undefined && valor !== '') {
          const nomeCampoBanco = this.mapearCampoAPI(campoAPI)

          if (!camposDetectados.has(nomeCampoBanco)) {
            camposDetectados.set(nomeCampoBanco, {
              nome: nomeCampoBanco,
              nomeOriginalAPI: campoAPI,
              tipo: this.detectarTipo(valor),
              frequencia: 0,
              exemplos: []
            })
          }

          const campoInfo = camposDetectados.get(nomeCampoBanco)!
          campoInfo.frequencia++

          if (campoInfo.exemplos.length < 3) {
            campoInfo.exemplos.push(valor)
          }

          if (typeof valor === 'string' && valor.length > (campoInfo.tamanhoMax || 0)) {
            campoInfo.tamanhoMax = valor.length
          }
        }
      }
    }

    return Array.from(camposDetectados.values())
  }

  /**
   * Detecta campos novos que não conhecemos
   */
  detectarCamposNovos(camposDetectados: CampoDetectado[]): CampoDetectado[] {
    const CAMPOS_CONHECIDOS = [
      'id_licitacao', 'titulo', 'municipio_ibge', 'uf', 'orgao',
      'abertura_datetime', 'objeto', 'link', 'link_externo', 'municipio',
      'abertura', 'abertura_com_hora', 'id_tipo', 'tipo'
    ]

    const CAMPOS_INTERNOS = [
      'id', 'created_at', 'updated_at', 'data_insercao', 'interece', 'valor_max'
    ]

    return camposDetectados.filter(campo => {
      return !CAMPOS_CONHECIDOS.includes(campo.nome) &&
             !CAMPOS_INTERNOS.includes(campo.nome) &&
             campo.frequencia > 0
    })
  }

  /**
   * Processa uma licitação individual para salvamento
   */
  processarLicitacao(licitacao: LicitacaoAPI, dataInsercao: Date): any {
    const dadosProcessados: any = {}

    // Processa campos da API (mapeando nomes se necessário)
    for (const [campoAPI, valor] of Object.entries(licitacao)) {
      if (valor !== null && valor !== undefined && valor !== '') {
        const nomeCampoBanco = this.mapearCampoAPI(campoAPI)
        dadosProcessados[nomeCampoBanco] = this.processarValorPorTipo(valor, nomeCampoBanco)
      }
    }

    // Adiciona campos internos do sistema
    dadosProcessados.data_insercao = dataInsercao.toISOString()

    return dadosProcessados
  }

  // Métodos auxiliares privados

  private isErroDeIP(erroStr: string): boolean {
    const palavrasChave = ['ip', 'bloqueado', 'limitado', 'acesso negado', 'forbidden', 'rate limit']
    return palavrasChave.some(palavra => erroStr.includes(palavra))
  }

  private isErroDeIPEspecifico(erro: any): boolean {
    if (typeof erro === 'object' && erro !== null) {
      return erro.codigo === 'IP01' || 
             (erro.descricao && erro.descricao.toLowerCase().includes('ip'))
    }
    return false
  }

  private extrairMensagemIP(erro: any): string {
    if (typeof erro === 'object' && erro !== null && erro.descricao) {
      return erro.descricao
    }
    return String(erro)
  }

  private formatarErros(erros: any[]): string {
    return erros.map(erro => {
      if (typeof erro === 'object' && erro !== null) {
        return erro.descricao || erro.message || JSON.stringify(erro)
      }
      return String(erro)
    }).join(', ')
  }

  private mapearCampoAPI(nomeAPI: string): string {
    const mapeamento: Record<string, string> = {
      'municipio_IBGE': 'municipio_ibge',
      'linkExterno': 'link_externo',
      'aberturaComHora': 'abertura_com_hora'
    }
    return mapeamento[nomeAPI] || nomeAPI
  }

  private detectarTipo(valor: any): 'string' | 'number' | 'date' | 'boolean' {
    if (typeof valor === 'boolean') return 'boolean'
    if (typeof valor === 'number') return 'number'
    if (typeof valor === 'string') {
      // Tenta detectar datas
      if (this.isDataString(valor)) return 'date'
      // Tenta detectar números
      if (this.isNumeroString(valor)) return 'number'
    }
    return 'string'
  }

  private processarValorPorTipo(valor: any, nomeCampo: string): any {
    // Processa datas
    if (nomeCampo.includes('data') || nomeCampo.includes('date') || nomeCampo.includes('abertura_datetime')) {
      const data = this.tentarConverterData(valor)
      return data ? data.toISOString() : valor
    }

    // Processa valores monetários
    if (nomeCampo.includes('valor') || nomeCampo.includes('preco') || nomeCampo.includes('estimado')) {
      const numero = this.tentarConverterNumero(valor)
      return numero !== null ? numero : valor
    }

    return valor
  }

  private isDataString(valor: string): boolean {
    const padroes = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/
    ]
    return padroes.some(padrao => padrao.test(valor))
  }

  private isNumeroString(valor: string): boolean {
    const numero = parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'))
    return !isNaN(numero)
  }

  private tentarConverterData(valor: any): Date | null {
    if (!valor) return null
    
    try {
      // Tenta vários formatos
      if (typeof valor === 'string') {
        // ISO format
        if (valor.match(/^\d{4}-\d{2}-\d{2}/)) {
          return new Date(valor)
        }
        // Brazilian format
        if (valor.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          const [dia, mes, ano] = valor.split('/')
          return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
        }
      }
      
      return new Date(valor)
    } catch {
      return null
    }
  }

  private tentarConverterNumero(valor: any): number | null {
    if (typeof valor === 'number') return valor
    
    if (typeof valor === 'string') {
      const numero = parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'))
      return isNaN(numero) ? null : numero
    }
    
    return null
  }
}

// Instância singleton
let apiClient: APILicitacoesClient | null = null

export function getAPILicitacoesClient(): APILicitacoesClient {
  if (!apiClient) {
    apiClient = new APILicitacoesClient()
  }
  return apiClient
} 