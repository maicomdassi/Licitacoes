import { useState, useEffect } from 'react'
import { Licitacao } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check, DollarSign, X, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

interface LicitacaoFormProps {
  licitacao: Licitacao
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function LicitacaoForm({ licitacao, onSubmit, onCancel }: LicitacaoFormProps) {
  const [valorMax, setValorMax] = useState<number | undefined>(licitacao.valor_max)
  const [dataLeilao, setDataLeilao] = useState<string>('')
  const [errors, setErrors] = useState<{
    valor_max?: string;
  }>({})
  
  // Inicializar data se existir
  useEffect(() => {
    if (licitacao.data_leilao) {
      const data = new Date(licitacao.data_leilao)
      const dataFormatada = data.toISOString().split('T')[0] // YYYY-MM-DD
      setDataLeilao(dataFormatada)
    }
  }, [licitacao.data_leilao])
  
  // Validar campos
  useEffect(() => {
    validateFields()
  }, [valorMax])
  
  const validateFields = () => {
    const newErrors: {
      valor_max?: string;
    } = {}
    
    if (!valorMax) {
      newErrors.valor_max = 'Valor máximo é obrigatório'
    }
    
    setErrors(newErrors)
  }
  
  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('Data alterada:', value)
    setDataLeilao(value)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos antes de enviar
    validateFields()
    
    // Se houver erros, não enviar o formulário
    if (!valorMax) {
      return
    }
    
    console.log('Submetendo formulário:', { valorMax, dataLeilao })
    
    // Converter valor para número se estiver preenchido
    const valorMaxNumerico = valorMax !== undefined ? Number(valorMax) : undefined
    
    // Formatar a data para string ISO se estiver preenchida
    const dataLeilaoString = dataLeilao ? new Date(dataLeilao + 'T00:00:00').toISOString() : undefined
    
    onSubmit({
      interece: 'S', // Sempre 'S' para interesse
      valor_max: valorMaxNumerico,
      data_leilao: dataLeilaoString
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800/30">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Marcando licitação com interesse
          </h3>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            Preencha o valor máximo (obrigatório) e a data do leilão (opcional)
          </p>
        </div>
        
        <div>
          <Label htmlFor="valor_max" className={cn(
            "text-sm font-medium mb-1.5 block flex items-center gap-1",
            !valorMax && "text-destructive"
          )}>
            <span className="text-destructive">*</span>
            Valor Máximo (R$)
          </Label>
          <div className="relative">
            <DollarSign className={cn(
              "absolute left-3 top-2.5 h-4 w-4",
              !valorMax ? "text-destructive" : "text-muted-foreground"
            )} />
            <Input
              id="valor_max"
              type="number"
              value={valorMax || ''}
              onChange={(e) => setValorMax(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Valor máximo da licitação"
              className={cn(
                "pl-9",
                !valorMax && "border-destructive focus-visible:ring-destructive"
              )}
              step="0.01"
              min="0"
              required
              autoFocus
            />
          </div>
          {errors.valor_max && (
            <div className="text-destructive text-sm flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              <span>{errors.valor_max}</span>
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="data_leilao" className="text-sm font-medium mb-1.5 block">
            Data do Leilão (opcional)
          </Label>
          <Input
            id="data_leilao"
            type="date"
            value={dataLeilao}
            onChange={handleDataChange}
            className="w-full"
            min="2020-01-01"
            max="2030-12-31"
          />
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground mt-1">
              Debug: {dataLeilao ? `Data selecionada: ${dataLeilao}` : 'Nenhuma data selecionada'}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="gap-2"
        >
          <X size={16} />
          <span>Cancelar</span>
        </Button>
        <Button 
          type="submit"
          className="gap-2 bg-green-600 hover:bg-green-700"
          disabled={!valorMax}
        >
          <Check size={16} />
          <span>Confirmar Interesse</span>
        </Button>
      </div>
    </form>
  )
} 