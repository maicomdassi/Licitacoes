import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Licitacao } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LicitacoesTableProps {
  licitacoes: Licitacao[]
  onEdit: (licitacao: Licitacao) => void
}

export function LicitacoesTable({ licitacoes, onEdit }: LicitacoesTableProps) {
  const formatarData = (data: string) => {
    try {
      // Se a data já está no formato brasileiro (dd/MM/yyyy), retornar como está
      if (data.includes('/')) {
        return data;
      }
      // Caso contrário, tentar formatar
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR })
    } catch (e) {
      return data || '-'
    }
  }

  const formatarValor = (valor?: number) => {
    if (!valor) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getStatusText = (status: 'P' | 'S' | 'N') => {
    switch (status) {
      case 'P':
        return 'Participando'
      case 'S':
        return 'Com Interesse'
      case 'N':
        return 'Sem Interesse'
      default:
        return 'Não definido'
    }
  }

  const getStatusColor = (status: 'P' | 'S' | 'N') => {
    switch (status) {
      case 'P':
        return 'text-yellow-600 bg-yellow-50'
      case 'S':
        return 'text-green-600 bg-green-50'
      case 'N':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Município</TableHead>
            <TableHead>UF</TableHead>
            <TableHead>Órgão</TableHead>
            <TableHead>Objeto</TableHead>
            <TableHead>Data Abertura</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor Máximo</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licitacoes.map((licitacao) => (
            <TableRow key={licitacao.id}>
              <TableCell className="font-mono text-xs">
                {licitacao.id_licitacao || licitacao.id}
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={licitacao.titulo}>
                {licitacao.titulo}
              </TableCell>
              <TableCell className="max-w-[120px] truncate" title={licitacao.municipio}>
                {licitacao.municipio}
              </TableCell>
              <TableCell>{licitacao.uf}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={licitacao.orgao}>
                {licitacao.orgao}
              </TableCell>
              <TableCell className="max-w-[300px] truncate" title={licitacao.objeto}>
                {licitacao.objeto}
              </TableCell>
              <TableCell>{licitacao.abertura_com_hora || formatarData(licitacao.abertura_datetime)}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {licitacao.tipo}
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(licitacao.interece)}`}>
                  {getStatusText(licitacao.interece)}
                </span>
              </TableCell>
              <TableCell>
                {formatarValor(licitacao.valor_max)}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(licitacao)}
                >
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 