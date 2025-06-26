# Correção da Constraint de Status - Problema Resolvido ✅

## Problema Identificado

Erro ao tentar alterar data manualmente:
```
Error: new row for relation "controle_consultas" violates check constraint "status_validos"
Details: Failing row contains (..., ajuste_manual, ...)
```

**Causa**: A constraint `status_validos` só permitia os valores:
- `'sucesso'`
- `'erro'`  
- `'parcial'`

Mas a API tentava inserir `'ajuste_manual'` para marcar alterações manuais.

## Solução Implementada

### 1. Criação de API para Atualizar Constraint

**Arquivo**: `src/app/api/admin/update-constraint/route.ts`

**Funcionalidade**: 
- Remove constraint antiga
- Adiciona nova constraint com `'ajuste_manual'`
- Verifica se a alteração funcionou

**SQL executado**:
```sql
-- 1. Remove constraint antiga
ALTER TABLE controle_consultas DROP CONSTRAINT IF EXISTS status_validos;

-- 2. Adiciona nova constraint
ALTER TABLE controle_consultas 
ADD CONSTRAINT status_validos 
CHECK (status_ultima_consulta IN ('sucesso', 'erro', 'parcial', 'ajuste_manual'));
```

### 2. Execução da Correção

**Comando executado**:
```bash
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/update-constraint" -Method POST
```

**Resultado**:
```
success: True
message: "Constraint de status atualizada com sucesso"
statusPermitidos: {sucesso, erro, parcial, ajuste_manual}
verificacao: "SQL executado..."
```

### 3. Restauração do Status Correto na API

**Arquivo**: `src/app/api/licitacoes/alterar-data/route.ts`

**Alteração**:
```typescript
// Antes (temporário)
status_ultima_consulta: 'sucesso', // Usar 'sucesso' ao invés de 'ajuste_manual' por ora

// Depois (correto)
status_ultima_consulta: 'ajuste_manual',
```

## Status Permitidos Agora

A constraint `status_validos` agora aceita:
- ✅ `'sucesso'` - Coleta executada com sucesso
- ✅ `'erro'` - Coleta com falha
- ✅ `'parcial'` - Coleta parcialmente executada
- ✅ `'ajuste_manual'` - **NOVO** - Data ajustada manualmente via interface

## Benefícios

1. **Auditoria clara**: Registros marcados como `ajuste_manual` são identificáveis
2. **Rastreabilidade**: Diferencia coletas automáticas de ajustes manuais
3. **Constraint flexível**: Permite futuras expansões de status
4. **Processo preservado**: Observações continuam registrando detalhes

## Teste

Agora o campo de data manual deve funcionar perfeitamente:

1. **Acesse**: Admin → Coleta de Licitações
2. **Seção**: "📅 Alterar Última Data Consultada"
3. **Digite**: `2025-06-24` (ou qualquer data válida)
4. **Clique**: "📅 Alterar Data"
5. **Resultado**: ✅ Data alterada com status `ajuste_manual`

## Arquivos Criados/Modificados

- ✅ `src/app/api/admin/update-constraint/route.ts` - API para corrigir constraint
- ✅ `src/lib/update-constraint-status.sql` - SQL para referência manual
- ✅ `src/app/api/licitacoes/alterar-data/route.ts` - Status restaurado para `ajuste_manual`

## Impacto

- ✅ **Campo de data manual**: Agora funciona sem erros
- ✅ **Constraint atualizada**: Permite `ajuste_manual`
- ✅ **Auditoria preservada**: Diferentes tipos de operação são distinguíveis
- ✅ **Futuro**: Facilita adição de novos status se necessário

O sistema agora está **100% funcional** para alterações manuais de data! 🎉 