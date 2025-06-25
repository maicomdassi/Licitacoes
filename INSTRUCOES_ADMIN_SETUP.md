# 🔧 Instruções para Configurar Admin

## Passo 1: Registrar Usuário
1. Acesse: http://localhost:3000/login
2. **REGISTRE-SE** com email: `maicomdassi@gmail.com`
3. Faça login no sistema

## Passo 2: Executar SQL no Supabase
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute este SQL:

```sql
-- Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy para usuários atualizarem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Inserir perfil admin para maicomdassi@gmail.com
INSERT INTO profiles (id, email, role)
SELECT 
  id, 
  email, 
  'admin' as role
FROM auth.users
WHERE email = 'maicomdassi@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verificar se foi criado
SELECT * FROM profiles WHERE email = 'maicomdassi@gmail.com';
```

## Passo 3: Configurar Tabela de Configurações
Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão do portal
INSERT INTO configuracoes (chave, valor, descricao) 
VALUES (
  'portal_padrao', 
  'compras.rs.gov.br', 
  'Portal padrão selecionado nos filtros de licitações'
) ON CONFLICT (chave) DO NOTHING;

-- Criar índice para busca por chave
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);
```

## Passo 4: Testar
1. Faça logout e login novamente
2. Acesse: http://localhost:3000
3. Você deve ver a **sidebar administrativa** do lado esquerdo
4. A sidebar terá: Dashboard, Classificação Inteligente, Relatórios, Usuários, **Configurações**
5. O filtro de portal deve estar em **compras.rs.gov.br** por padrão

## ✅ Resultado Esperado
- Sidebar aparece apenas para maicomdassi@gmail.com
- Outros usuários não veem a sidebar
- Portal padrão: **compras.rs.gov.br**
- Página de configurações funcionando: http://localhost:3000/admin/configuracoes

## 🔍 Verificar se funcionou
Execute no SQL Editor para confirmar:
```sql
SELECT email, role FROM profiles WHERE email = 'maicomdassi@gmail.com';
SELECT * FROM configuracoes WHERE chave = 'portal_padrao';
```
Deve retornar: 
- `maicomdassi@gmail.com | admin`
- `portal_padrao | compras.rs.gov.br` 