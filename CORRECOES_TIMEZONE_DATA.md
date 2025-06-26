# Correções de Timezone e Campo de Data Manual

## Problema Identificado

O sistema estava salvando datas futuras (26/06/2025) quando hoje é 25/06/2025, causado por:

1. **Timezone incorreto**: Sistema usando UTC ao invés do horário de Brasília (UTC-3)
2. **Falta de controle manual**: Não havia forma de corrigir datas incorretas sem resetar tudo

## Soluções Implementadas

### 1. Biblioteca de Timezone do Brasil

**Arquivo**: `src/lib/timezone-brasil.ts`

**Funções criadas**:
- `getDataAtualBrasil()`: Obtém data/hora atual no timezone do Brasil
- `getDataBrasil()`: Obtém apenas a data (00:00:00) no timezone do Brasil  
- `getOntemBrasil()`: Obtém a data de ontem no timezone do Brasil
- `formatarDataBrasil(data)`: Formata data para string YYYY-MM-DD
- `criarDataBrasil(string)`: Cria Date a partir de string no contexto do Brasil
- `getInfoTimezone()`: Debug de informações de timezone

### 2. Correções na API de Coleta

**Arquivo**: `src/app/api/licitacoes/buscar-novas/route.ts`

**Alterações**:
- ✅ Importa funções de timezone do Brasil
- ✅ Debug de timezone nos logs (mostra diferença UTC vs Brasil)
- ✅ Usa `getOntemBrasil()` como data limite (ao invés de UTC)
- ✅ Usa `criarDataBrasil()` para parsing de datas do banco
- ✅ Usa `formatarDataBrasil()` para todos os logs e displays
- ✅ Valida datas no contexto do Brasil

**Logs melhorados**:
```
🕒 Timezone - Brasil: 2025-06-25 | UTC: 2025-06-26
🇧🇷 Hoje no Brasil: 2025-06-25 | Ontem: 2025-06-24
📅 Data limite: 2025-06-24 (não consulta o dia atual - 2025-06-25)
```

### 3. Campo de Data Manual na Interface

**Arquivo**: `src/app/admin/coleta-licitacoes/page.tsx`

**Novo recurso**:
- ✅ Campo de input tipo `date` para especificar data manualmente
- ✅ Validação de formato (YYYY-MM-DD)
- ✅ Validação de data (não pode ser futura)
- ✅ Interface visual mostrando data atual vs nova data
- ✅ Explicação detalhada do impacto da alteração
- ✅ Estado de loading durante alteração

**Visual**:
```
📅 Alterar Última Data Consultada
┌─────────────────┬─────────────────┬─────────────────┐
│ Nova Data       │ Data Atual      │ Ação            │
│ [2025-06-24]    │ 2025-06-26      │ [📅 Alterar]    │
└─────────────────┴─────────────────┴─────────────────┘

💡 Como funciona:
• Esta data define o último dia que foi coletado com sucesso
• A próxima coleta começará do dia seguinte à data informada
• Por exemplo: se você informar 2025-06-20, a próxima coleta buscará desde 2025-06-21
• A coleta sempre para no dia anterior ao atual (nunca coleta o dia corrente)
```

### 4. API para Alterar Data

**Arquivo**: `src/app/api/licitacoes/alterar-data/route.ts`

**Funcionalidades**:
- ✅ Recebe nova data via POST JSON
- ✅ Valida formato YYYY-MM-DD
- ✅ Valida que data não é futura (máximo ontem)
- ✅ Insere registro na tabela `controle_consultas`
- ✅ Marca como `ajuste_manual` para auditoria
- ✅ Retorna informações da alteração e próxima coleta

**Validações**:
```typescript
// Não permite data futura
if (dataInformada > getOntemBrasil()) {
  return error("Data não pode ser posterior a 2025-06-24 (ontem no horário do Brasil)")
}
```

### 5. Endpoint de Debug

**Arquivo**: `src/app/api/debug-timezone/route.ts`

**Para desenvolvimento**: Permite verificar diferenças de timezone:
```json
{
  "timezone": {
    "sistema": "America/Sao_Paulo",
    "offsetLocal": 180,
    "offsetBrasil": -180
  },
  "datas": {
    "utc": "2025-06-26T02:24:27.866Z",
    "brasil": "2025-06-25T20:24:27.866Z", 
    "hojeFormatado": "2025-06-25",
    "ontemFormatado": "2025-06-24"
  }
}
```

## Resultado

### Antes ❌
- Data mostrada: 2025-06-26 (futura)
- Timezone: UTC (incorreto para Brasil)
- Correção: Só resetando tudo

### Depois ✅  
- Data correta: 2025-06-24 (ontem no Brasil)
- Timezone: UTC-3 (horário de Brasília)
- Correção: Campo manual para ajustar data específica

## Como Usar

1. **Corrigir data atual**: 
   - Digite a data desejada (ex: `2025-06-24`)
   - Clique em "📅 Alterar Data"
   - Sistema confirma alteração

2. **Próxima coleta**:
   - Se data informada: `2025-06-24`
   - Próxima coleta começa: `2025-06-25`
   - Para no dia: `2025-06-24` (ontem no Brasil)

3. **Verificar timezone**:
   - Logs mostram diferença UTC vs Brasil
   - Debug via `/api/debug-timezone`

## Impacto

- ✅ **Problema de data futura**: Resolvido
- ✅ **Timezone brasileiro**: Implementado
- ✅ **Controle manual**: Disponível
- ✅ **Validações**: Implementadas
- ✅ **Auditoria**: Registros marcados como `ajuste_manual`

A coleta agora funciona corretamente no timezone do Brasil e permite ajustes manuais precisos sem perder dados. 