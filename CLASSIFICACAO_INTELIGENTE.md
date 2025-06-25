# 🎯 Sistema de Classificação Inteligente de Licitações

## 📋 Visão Geral

O Sistema de Classificação Inteligente é uma ferramenta automática que analisa licitações e as classifica baseado nas atividades da empresa, otimizando o processo de identificação de oportunidades relevantes.

## 🚀 Como Usar

### 1. **Acesso ao Sistema**
- Na página principal, clique no botão **"Classificação Inteligente"** (ícone de cérebro 🧠)
- Ou acesse diretamente: `http://localhost:3000/admin/classificacao`

### 2. **Executar Classificação**
1. Clique em **"Iniciar Classificação Inteligente"**
2. O sistema criará automaticamente um backup da tabela
3. Aguarde o processamento (barra de progresso mostra o andamento)
4. Visualize os resultados na tela
5. Baixe o relatório detalhado se necessário

## 🎯 Critérios de Classificação

### 🟢 **Mantidas como "P" (Participando)**
Licitações alinhadas com as atividades da empresa:

#### 🏗️ **Construção & Engenharia Civil**
- **Palavras-chave:** construção, construcao, reforma, obra, obras, alvenaria, edificação, edificacao, estrutura, civil, predial, predio
- **Atividades relacionadas:** 43.11-8-01, 43.99-1-03, 43.99-1-99

#### 🔧 **Instalações Especializadas**
- **Palavras-chave:** instalação, instalacao, ar condicionado, ventilação, ventilacao, refrigeração, refrigeracao, elétrica, eletrica, hidraulica, hidráulica
- **Atividades relacionadas:** 43.22-3-02, 43.30-4-02

#### 🎨 **Serviços de Pintura**
- **Palavras-chave:** pintura, pintar, tinta, verniz, revestimento
- **Atividades relacionadas:** 43.30-4-04

#### 🚪 **Portas, Janelas e Divisórias**
- **Palavras-chave:** porta, portas, janela, janelas, divisória, divisoria, armário, armario, esquadria, esquadrias, teto, tetos
- **Atividades relacionadas:** 43.30-4-02

#### 🧹 **Limpeza e Manutenção**
- **Palavras-chave:** limpeza, higienização, higienizacao, manutenção predial, manutencao predial, conservação, conservacao, zeladoria
- **Atividades relacionadas:** 81.21-4-00

#### 💥 **Demolição**
- **Palavras-chave:** demolição, demolicao, demolir, remoção, remocao, desmonte, derrubada
- **Atividades relacionadas:** 43.11-8-01

#### 🚰 **Esgoto e Saneamento**
- **Palavras-chave:** esgoto, tratamento, ETE, saneamento, efluente, coleta e queima de gases, estação de tratamento
- **Atividades relacionadas:** 37.02-9-00

#### 🏃 **Instalações Esportivas**
- **Palavras-chave:** ginásio, ginasio, quadra, campo, instalação esportiva, instalacao esportiva, recreativa, recreativo, esporte
- **Atividades relacionadas:** 42.99-5-01

### 🔴 **Alteradas para "N" (Sem Interesse)**
Licitações não alinhadas com o negócio:

#### 🏥 **Serviços de Saúde**
- **Palavras-chave:** médico, medico, consulta, exame, laboratório, laboratorio, análise clínica, analise clinica, credenciamento médico, credenciamento medico, hospitalar, clínico, clinico, saúde, saude

#### 🍎 **Alimentação e PNAE**
- **Palavras-chave:** PNAE, gêneros alimentícios, generos alimenticios, agricultura familiar, merenda, alimentação escolar, alimentacao escolar, suco, alimento

#### 📊 **Contábil e Jurídico**
- **Palavras-chave:** contábil, contabil, consultoria, perícia, pericia, laudo, auditoria, jurídico, juridico, advocacia

#### 🏦 **Credenciamentos Diversos**
- **Palavras-chave:** leiloeiro, leilão, leilao, instituição financeira, instituicao financeira, cooperativa, banco, crédito, credito

#### 👥 **Serviços Sociais**
- **Palavras-chave:** acolhimento, idoso, assistência social, assistencia social, SCFV, oficina, socioeducativo, convivência, convivencia

#### 📝 **Material de Escritório**
- **Palavras-chave:** material gráfico, material grafico, expediente, papelaria, escritório, escritorio, impressão, impressao

#### 🚛 **Transporte e Logística**
- **Palavras-chave:** coleta de resíduos, coleta de residuos, transporte, logística, logistica, frete, entrega

## 🔄 Processo de Classificação

### **Etapa 1: Backup Automático**
- Cria tabela `licitacoes_backup` com todos os dados atuais
- Garante segurança em caso de problemas

### **Etapa 2: Análise Inteligente**
- Busca todas as licitações com `interece = 'P'`
- Analisa o campo `objeto` de cada licitação
- Aplica critérios de classificação baseados nas palavras-chave

### **Etapa 3: Atualização Segura**
- Processa em lotes de 50 registros
- Atualiza apenas registros que atendem aos critérios
- Preserva licitações já marcadas como `'S'` (Sim)

### **Etapa 4: Relatório Detalhado**
- Gera relatório completo com todas as alterações
- Lista motivos específicos para cada classificação
- Permite download para auditoria

## 📊 Resultados Esperados

Baseado na análise dos dados atuais, estima-se:
- **60-70%** dos registros permanecerão como "P"
- **30-40%** dos registros serão alterados para "N"
- **0%** dos registros "S" serão alterados (preservados)

## 🛡️ Segurança e Backup

### **Backup Automático**
- Criado automaticamente antes de qualquer alteração
- Tabela: `licitacoes_backup`
- Contém todos os dados originais

### **Recuperação de Dados**
Se necessário, execute no banco:
```sql
-- Para restaurar todos os dados
UPDATE licitacoes 
SET interece = backup.interece 
FROM licitacoes_backup backup 
WHERE licitacoes.id = backup.id;

-- Para restaurar apenas registros específicos
UPDATE licitacoes 
SET interece = 'P' 
WHERE id IN (1234, 5678, 9012);
```

## 📈 Monitoramento

### **Estatísticas em Tempo Real**
- Total de registros processados
- Quantidade mantida como "P"
- Quantidade alterada para "N"
- Número de erros (se houver)

### **Log Detalhado**
- Cada alteração é registrada com motivo específico
- Relatório baixável em formato texto
- Auditoria completa do processo

## 🔧 Configuração Avançada

### **Personalizar Critérios**
Para ajustar os critérios, edite o arquivo:
`src/lib/classificacao-inteligente.ts`

```typescript
const CRITERIOS_INTERESSE = {
  MANTER_P: {
    nova_categoria: [
      'palavra1', 'palavra2', 'palavra3'
    ]
  },
  ALTERAR_N: {
    nova_categoria: [
      'palavra4', 'palavra5', 'palavra6'
    ]
  }
}
```

### **Ajustar Tamanho dos Lotes**
```typescript
const batchSize = 50 // Altere conforme necessário
```

## ❓ Solução de Problemas

### **Erro de Conectividade**
- Verifique as variáveis de ambiente do Supabase
- Confirme se a chave de API tem permissões adequadas

### **Backup Não Criado**
- Verifique se a tabela `licitacoes_backup` pode ser criada
- Confirme permissões de escrita no banco

### **Processo Interrompido**
- O backup permanece íntegro
- Execute novamente para continuar de onde parou

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console do navegador
2. Baixe o relatório de erros
3. Consulte a documentação técnica
4. Entre em contato com o suporte técnico

---

**Desenvolvido com ❤️ para otimizar o processo de gestão de licitações** 