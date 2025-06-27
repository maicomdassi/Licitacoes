# Sistema de Detecção Inteligente de Duplicados

## Visão Geral

O sistema de detecção inteligente de duplicados foi implementado para identificar automaticamente licitações duplicadas usando um algoritmo em duas etapas que combina análise de códigos numéricos com similaridade de texto.

## Como Funciona

### Etapa 0: Filtragem Inicial
- **Escopo**: Analisa **APENAS** registros com `interece = 'P'` (Pendentes)
- **Motivo**: Evita re-analisar registros já processados (`'S'` ou `'N'`)
- **Benefício**: Previne falsos positivos e duplicação desnecessária

### Etapa 1: Extração de Códigos
- **Padrão detectado**: Códigos no formato `XXXX/YYYY` (ex: "0686/2025", "1234/2024")
- **Localização**: Busca nos títulos das licitações pendentes
- **Exemplos**:
  - "Dispensa eletrônica com disputa 0686/2025" → Código: 0686/2025
  - "Contratação Direta 0686/2025" → Código: 0686/2025
  - "Pregão Eletrônico 1234/2024" → Código: 1234/2024

### Etapa 2: Análise de Similaridade
- **Critério**: Comparação palavra por palavra do campo "objeto"
- **Limiar**: ≥ 90% de similaridade
- **Algoritmo**: Interseção de palavras dividida pela união (Jaccard)
- **Normalização**: Remove acentos, pontuação e converte para minúsculas

### Etapa 3: Decisão de Prioridade
O sistema define automaticamente qual registro manter seguindo esta lógica:

1. **Regra única**: Entre registros pendentes duplicados, mantém sempre o **mais antigo**
2. **Ação**: Anula os demais registros marcando como "sem interesse" (`interece = 'N'`)
3. **Garantia**: Nunca analisa registros já processados, evitando conflitos

## Interface do Usuário

### Botão "Detecção Inteligente"
- **Localização**: Página Admin → Duplicados
- **Aparência**: Gradiente azul-roxo com ícone de alerta
- **Função**: Executa o algoritmo completo automaticamente

### Visualização dos Resultados

#### Estatísticas
- **Total Analisados**: Número de registros processados
- **Grupos de Duplicados**: Quantos códigos únicos têm duplicatas
- **Total de Duplicados**: Soma de todos os registros duplicados
- **Serão Anulados**: Quantos registros serão marcados como "sem interesse"

#### Lista de Grupos
- **Código**: Número/ano extraído (ex: 0686/2025)
- **Similaridade**: Percentual médio de semelhança
- **Mantido vs Anulados**: Contador visual de ações

#### Comparação Detalhada
- **Registro Mantido**: Destacado em verde com todos os detalhes
- **Registros Anulados**: Listados em vermelho com indicação da ação
- **Informações**: Título, objeto, data de criação e status atual

### Botão "Anular Duplicados"
- **Cor**: Gradiente laranja-vermelho
- **Ação**: Marca todos os duplicados identificados como "sem interesse"
- **Confirmação**: Solicita confirmação antes da execução
- **Feedback**: Mostra quantos registros foram processados

## Exemplos Práticos

### Caso 1: Licitações Pendentes Duplicadas
```
Título 1: "Dispensa eletrônica com disputa 0686/2025"
Objeto 1: "Contratação de empresa para fornecimento de materiais de escritório"
Status 1: Pendente (P)
Data 1: 2025-01-01

Título 2: "Contratação Direta 0686/2025"  
Objeto 2: "Contratação de empresa para fornecimento de materiais escritório"
Status 2: Pendente (P)
Data 2: 2025-01-02

Resultado: Mantém registro 1 (mais antigo), anula registro 2 → 'N'
```

### Caso 2: Similaridade Alta
```
Objeto A: "Aquisição de equipamentos de informática para departamento"
Objeto B: "Aquisição equipamentos informática para o departamento"
Similaridade: 95% → Confirma duplicata
```

### Caso 3: Similaridade Baixa
```
Objeto A: "Contratação de serviços de limpeza"
Objeto B: "Aquisição de equipamentos médicos"
Similaridade: 15% → Não são duplicatas
```

## Vantagens do Sistema

### Automação Completa
- ✅ Não requer seleção manual
- ✅ Aplica regras de negócio consistentes
- ✅ Processa centenas de registros rapidamente

### Inteligência Contextual
- ✅ Reconhece padrões de numeração oficial
- ✅ Analisa conteúdo semântico dos objetos
- ✅ Respeita prioridades de processamento

### Segurança e Reversibilidade
- ✅ Marca como "sem interesse" em vez de excluir
- ✅ Mantém histórico completo
- ✅ Permite reversão manual se necessário

### Interface Intuitiva
- ✅ Visualização clara de ações propostas
- ✅ Comparação lado a lado detalhada
- ✅ Feedback em tempo real

## Comparação com Detecção Normal

| Aspecto | Detecção Normal | Detecção Inteligente |
|---------|----------------|---------------------|
| **Critério** | Campo único (título/objeto/ID) | Código + similaridade |
| **Precisão** | Básica (texto exato) | Alta (semântica) |
| **Automação** | Manual (seleção) | Automática (regras) |
| **Ação** | Exclusão | Anulação (reversível) |
| **Casos de Uso** | Duplicatas óbvias | Duplicatas complexas |

## Logs e Monitoramento

O sistema gera logs detalhados para acompanhamento:

```
🔍 Iniciando detecção inteligente de duplicados por código + similaridade...
📊 Encontrados 45 códigos únicos
🔍 Analisando grupo 0686/2025 com 3 registros
📝 Comparando registros 123 vs 124: 94.2% similares
✅ Grupo duplicata confirmado: 0686/2025 (3 itens, 94.2% similares)
✅ Análise concluída: 12 grupos de duplicados encontrados
📊 Total: 156 registros analisados, 23 serão anulados
```

## Configurações Técnicas

### Parâmetros Ajustáveis
- **Regex de Código**: `(\d{3,4}\/\d{4})` (3-4 dígitos + barra + 4 dígitos)
- **Limiar de Similaridade**: 90% (configurável no código)
- **Tamanho Mínimo de Palavra**: 3 caracteres (filtro de ruído)

### Performance
- **Complexidade**: O(n²) por grupo (otimizada para grupos pequenos)
- **Memória**: Carrega todos os registros para análise completa
- **Tempo**: ~2-5 segundos para 1000+ registros

## Próximas Melhorias

### Funcionalidades Planejadas
- [ ] Configuração de limiar de similaridade via interface
- [ ] Suporte a múltiplos padrões de código
- [ ] Análise de similaridade em múltiplos campos
- [ ] Histórico de operações de anulação
- [ ] API para integração externa

### Otimizações
- [ ] Cache de cálculos de similaridade
- [ ] Processamento em lotes para grandes volumes
- [ ] Índices de busca para códigos extraídos 