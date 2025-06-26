# Instruções de Instalação - Sistema de Gestão de Licitações

## 🔒 Segurança e Configuração

### **⚠️ IMPORTANTE - CONFIGURAÇÃO OBRIGATÓRIA**

Este sistema requer configuração do banco de dados Supabase. **NUNCA** use as chaves de exemplo em produção.

### **Passo 1: Configurar seu próprio projeto Supabase**

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Anote suas chaves de API (você precisará delas)

### **Passo 2: Configurar Variáveis de Ambiente**

Crie um arquivo `.env.local` na pasta do projeto com suas chaves **REAIS**:

```bash
# SUBSTITUA pelos valores do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=sua_chave_service_aqui
```

### **Passo 3: Instalação**

1. Extraia o arquivo ZIP do sistema
2. Abra o terminal/prompt na pasta do projeto
3. Execute: `npm install`
4. Configure o arquivo `.env.local` com suas chaves
5. Execute: `npm run dev`

### **🔐 Configuração de Segurança**

- **NUNCA** commite arquivos `.env*` no Git
- Use chaves diferentes para desenvolvimento e produção
- Mantenha suas chaves de API seguras
- Implemente RLS (Row Level Security) no Supabase

### **🛠️ Troubleshooting**

Se encontrar erros de conexão:
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o projeto Supabase está ativo
3. Verifique se as permissões do banco estão configuradas

### **📞 Suporte**

Para problemas de configuração, verifique:
- Console do navegador para erros de autenticação
- Logs do Supabase Dashboard
- Configurações de RLS no banco de dados

**Desenvolvido com ❤️ para otimizar o processo de gestão de licitações**

## Requisitos do Sistema
- Windows 7/8/10/11 (64 bits)
- Mínimo de 4GB de RAM
- 500MB de espaço em disco
- Conexão com a internet

## Opções de Instalação

### Opção 1: Instalação Automática (Recomendada)

1. Execute o arquivo `instalar_e_executar.bat`
2. O script verificará se o Node.js está instalado e o instalará automaticamente se necessário
3. As dependências do projeto serão instaladas
4. O aplicativo será compilado e iniciado automaticamente
5. Um navegador será aberto com o aplicativo em execução

### Opção 2: Apenas Executar (Se já instalado anteriormente)

1. Execute o arquivo `executar_aplicativo.bat`
2. O aplicativo será iniciado e um navegador será aberto automaticamente

## Distribuição para Outros Computadores

Para distribuir o aplicativo para outros computadores:

1. Execute o arquivo `empacotar_aplicativo.bat`
2. Um arquivo `Sistema_Gestao_Licitacoes.zip` será criado
3. Copie este arquivo para o computador de destino
4. Extraia o conteúdo do arquivo ZIP
5. Execute o arquivo `instalar_e_executar.bat` no computador de destino

## Primeira Execução

Ao executar o aplicativo pela primeira vez, você precisará configurar a conexão com o banco de dados Supabase:

1. Configure seu próprio projeto Supabase seguindo as instruções na seção "Configuração Obrigatória" acima
2. Caso haja problemas de conexão, verifique se as credenciais do seu projeto Supabase estão corretas no arquivo `.env.local`

## Problemas Comuns

### Erro de Conexão com o Banco de Dados
- Verifique sua conexão com a internet
- Confirme se as credenciais do Supabase estão corretas
- Verifique se o firewall não está bloqueando a conexão

### Aplicativo Não Inicia
- Verifique se seu sistema atende aos requisitos mínimos
- Tente reinstalar o aplicativo executando novamente `instalar_e_executar.bat`
- Verifique se há atualizações do Windows pendentes

### Erro "EADDRINUSE" (Porta em uso)
- Isso significa que a porta 3000 já está em uso por outro aplicativo
- Feche outros aplicativos que possam estar usando essa porta
- Ou edite o arquivo `executar_aplicativo.bat` e altere a porta no comando `start "" http://localhost:3000`

## Suporte

Em caso de problemas, entre em contato com o suporte técnico.

---

## Informações para Desenvolvedores

### Configuração Manual das Variáveis de Ambiente

Se necessário, você pode configurar manualmente as variáveis de ambiente criando um arquivo `.env.local` na pasta de instalação com o seguinte conteúdo:

```bash
# SUBSTITUA pelos valores do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=sua_chave_service_aqui
```

**⚠️ IMPORTANTE:** Nunca use chaves de exemplo em produção. Sempre configure seu próprio projeto Supabase. 