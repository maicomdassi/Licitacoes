# Sistema de Gestão de Licitações

## 🔒 **AVISO DE SEGURANÇA IMPORTANTE**

**⚠️ ANTES DE USAR EM PRODUÇÃO:**
1. Configure suas **próprias** chaves do Supabase
2. **NUNCA** use as chaves de exemplo/desenvolvimento
3. Mantenha o arquivo `.env.local` **fora** do controle de versão

## 🚀 Instalação Segura

### 1. Configurar Supabase
- Crie sua conta em [supabase.com](https://supabase.com)
- Crie um novo projeto
- Anote suas chaves de API

### 2. Configurar Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite .env.local com suas chaves REAIS
nano .env.local
```

### 3. Instalar e Executar
```bash
npm install
npm run dev
```

## 📁 Estrutura do Projeto

- `/src/app` - Páginas da aplicação
- `/src/components` - Componentes reutilizáveis
- `/src/lib` - Utilities e configurações
- `/electron` - Aplicação desktop

## 🎯 Funcionalidades

- ✅ Gestão de licitações com filtros inteligentes
- ✅ Sistema de autenticação seguro
- ✅ Classificação automática por interesse
- ✅ Detecção e remoção de duplicados
- ✅ Interface responsiva e moderna
- ✅ Aplicação desktop com Electron

## 🛡️ Segurança

- RLS (Row Level Security) no Supabase
- Autenticação JWT
- Validação de entrada
- Sanitização de dados
- Variáveis de ambiente protegidas

---

**Desenvolvido com ❤️ para otimizar processos de licitação**

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
