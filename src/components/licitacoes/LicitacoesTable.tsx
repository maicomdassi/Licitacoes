import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Licitacao } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLink, Calendar, MapPin, Building2, FileText, DollarSign } from 'lucide-react'

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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'S':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'N':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Layout Mobile (Cards)
  const MobileLayout = () => (
    <div className="block md:hidden space-y-4">
      {licitacoes.map((licitacao) => (
        <Card key={licitacao.id} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium text-gray-900 leading-tight">
                {licitacao.titulo}
              </CardTitle>
              <Badge className={`ml-2 text-xs px-2 py-1 ${getStatusColor(licitacao.interece)}`}>
                {getStatusText(licitacao.interece)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* ID e Tipo */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <FileText className="w-4 h-4 mr-1" />
                ID: {licitacao.id_licitacao || licitacao.id}
              </span>
              <Badge variant="outline" className="text-xs">
                {licitacao.tipo}
              </Badge>
            </div>

            {/* Localização */}
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{licitacao.municipio} - {licitacao.uf}</span>
            </div>

            {/* Órgão */}
            <div className="flex items-start text-sm text-gray-600">
              <Building2 className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              <span className="break-words leading-tight">{licitacao.orgao}</span>
            </div>

            {/* OBJETO - Campo principal com visibilidade completa */}
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Objeto da Licitação
              </div>
              <div className="text-sm text-gray-900 leading-relaxed break-words whitespace-normal">
                {licitacao.objeto}
              </div>
            </div>

            {/* Data de Abertura */}
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>Abertura: {licitacao.abertura_com_hora || formatarData(licitacao.abertura_datetime)}</span>
            </div>

            {/* Valor Máximo */}
            {licitacao.valor_max && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>Valor Máximo: {formatarValor(licitacao.valor_max)}</span>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(licitacao)}
                className="flex-1"
              >
                Editar Status
              </Button>
              {licitacao.link_externo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(licitacao.link_externo, '_blank')}
                  className="px-3"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Layout Desktop (Tabela)
  const DesktopLayout = () => (
    <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead className="min-w-[200px]">Título</TableHead>
            <TableHead className="w-[120px]">Município</TableHead>
            <TableHead className="w-[60px]">UF</TableHead>
            <TableHead className="min-w-[150px]">Órgão</TableHead>
            <TableHead className="min-w-[300px]">Objeto</TableHead>
            <TableHead className="w-[130px]">Data Abertura</TableHead>
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[130px]">Valor Máximo</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licitacoes.map((licitacao) => (
            <TableRow key={licitacao.id}>
              <TableCell className="font-mono text-xs">
                {licitacao.id_licitacao || licitacao.id}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="truncate" title={licitacao.titulo}>
                  {licitacao.titulo}
                </div>
              </TableCell>
              <TableCell className="max-w-[120px]">
                <div className="truncate" title={licitacao.municipio}>
                  {licitacao.municipio}
                </div>
              </TableCell>
              <TableCell>{licitacao.uf}</TableCell>
              <TableCell className="max-w-[150px]">
                <div className="truncate" title={licitacao.orgao}>
                  {licitacao.orgao}
                </div>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <div className="break-words leading-tight" title={licitacao.objeto}>
                  {licitacao.objeto}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {licitacao.abertura_com_hora || formatarData(licitacao.abertura_datetime)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {licitacao.tipo}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${getStatusColor(licitacao.interece)}`}>
                  {getStatusText(licitacao.interece)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {formatarValor(licitacao.valor_max)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(licitacao)}
                  >
                    Editar
                  </Button>
                  {licitacao.link_externo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(licitacao.link_externo, '_blank')}
                      className="px-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="w-full">
      <MobileLayout />
      <DesktopLayout />
    </div>
  )
} 