import { Licitacao } from '@/types/database.types'
import { Calendar, Edit, ExternalLink, Globe, MapPin, Tag, Timer, Clock, ThumbsDown, ThumbsUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LicitacaoCardProps {
  licitacao: Licitacao
  onEdit: (licitacao: Licitacao) => void
  onSemInteresse: (licitacao: Licitacao) => void
  onComInteresse: (licitacao: Licitacao) => void
}

export function LicitacaoCard({ licitacao, onEdit, onSemInteresse, onComInteresse }: LicitacaoCardProps) {
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString)
      return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch (error) {
      return dataString
    }
  }
  
  const formatarDataSimples = (dataString: string) => {
    try {
      const data = new Date(dataString)
      return format(data, 'dd/MM/yyyy', { locale: ptBR })
    } catch (error) {
      return dataString
    }
  }

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getStatusText = (status: 'P' | 'S' | 'N') => {
    switch (status) {
      case 'P':
        return 'Pendente'
      case 'S':
        return 'Com Interesse'
      case 'N':
        return 'Sem Interesse'
      default:
        return status
    }
  }

  const getStatusClass = (status: 'P' | 'S' | 'N') => {
    switch (status) {
      case 'P':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30'
      case 'S':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30'
      case 'N':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  return (
    <div className="border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow bg-card text-card-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
            <h3 className="text-lg md:text-xl font-semibold mb-2 flex-1">{licitacao.titulo}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(licitacao.interece as 'P' | 'S' | 'N')}`}>
              {getStatusText(licitacao.interece as 'P' | 'S' | 'N')}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{licitacao.municipio || ''}, {licitacao.uf || ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{licitacao.abertura_com_hora || formatarData(licitacao.abertura_datetime)}</span>
            </div>
            {licitacao.tipo && (
              <div className="flex items-center gap-1">
                <Tag size={14} />
                <span>{licitacao.tipo}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {licitacao.orgao}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {licitacao.valor_max && (
            <div className="flex flex-col items-end">
              <div className="text-xs uppercase text-muted-foreground">Valor máximo</div>
              <div className="text-base font-semibold">{formatarValor(licitacao.valor_max)}</div>
            </div>
          )}
          
          {licitacao.data_leilao && licitacao.interece === 'S' && (
            <div className="flex flex-col items-end">
              <div className="text-xs uppercase text-muted-foreground">Data do leilão</div>
              <div className="text-sm font-medium flex items-center gap-1">
                <Clock size={12} />
                {formatarDataSimples(licitacao.data_leilao)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border border-border/30">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
          <span className="inline-block w-1 h-4 bg-primary rounded-full mr-1"></span>
          Objeto da Licitação
        </h4>
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{licitacao.objeto}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {licitacao.link && (
            <a 
              href={licitacao.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/30"
            >
              <Globe size={16} />
              <span>Link Oficial</span>
            </a>
          )}
          {licitacao.link_externo && (
            <a 
              href={licitacao.link_externo} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/30"
            >
              <ExternalLink size={16} />
              <span>Link Externo</span>
            </a>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Licitações pendentes: mostrar ambos os botões */}
          {licitacao.interece === 'P' && (
            <>
              <button
                onClick={() => onSemInteresse(licitacao)}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/30 w-full sm:w-auto"
              >
                <ThumbsDown size={16} />
                <span>Sem Interesse</span>
              </button>
              
              <button
                onClick={() => onComInteresse(licitacao)}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800/30 w-full sm:w-auto"
              >
                <ThumbsUp size={16} />
                <span>Com Interesse</span>
              </button>
            </>
          )}
          
          {/* Licitações com interesse: permitir editar interesse ou marcar sem interesse */}
          {licitacao.interece === 'S' && (
            <>
              <button
                onClick={() => onSemInteresse(licitacao)}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/30 w-full sm:w-auto"
              >
                <ThumbsDown size={16} />
                <span>Sem Interesse</span>
              </button>
              
              <button
                onClick={() => onComInteresse(licitacao)}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800/30 w-full sm:w-auto"
              >
                <Edit size={16} />
                <span>Editar Interesse</span>
              </button>
            </>
          )}
          
          {/* Licitações sem interesse: permitir marcar com interesse */}
          {licitacao.interece === 'N' && (
            <button
              onClick={() => onComInteresse(licitacao)}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800/30 w-full sm:w-auto"
            >
              <ThumbsUp size={16} />
              <span>Com Interesse</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Timer size={12} />
          <span>Inserido em: {licitacao.data_insercao ? formatarData(licitacao.data_insercao) : '-'}</span>
        </div>
        <div>ID: {licitacao.id_licitacao || licitacao.id}</div>
      </div>
    </div>
  )
} 