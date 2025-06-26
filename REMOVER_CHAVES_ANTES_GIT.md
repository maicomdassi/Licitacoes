# 🚨 ATENÇÃO: Remover Chaves de API Antes do Git

## ⚠️ CRÍTICO - LEIA ANTES DE FAZER COMMIT

Este arquivo contém instruções para remover TODAS as chaves de API expostas antes de fazer commit no Git.

## 🔑 Chaves que DEVEM ser removidas/alteradas:

### 1. Arquivo `.env.local`
- **DEVE ser removido ou ter seu conteúdo substituído por exemplos**
- Contém chaves reais do Supabase
- Já está no `.gitignore`, mas pode ter sido commitado anteriormente

### 2. Verificar todos os arquivos por chaves expostas:

```bash
# Procurar por tokens JWT (começam com eyJ)
findstr /r /c:"eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*" *.* /s

# Procurar por URLs específicas do Supabase
findstr /r /c:"https://[a-z0-9]*\.supabase\.co" *.* /s

# Procurar por chaves que começam com sb-
findstr /r /c:"sb-[A-Za-z0-9_-]*" *.* /s
```

## 🛠️ Como corrigir:

### 1. Remover o arquivo .env.local:
```bash
del .env.local
```

### 2. Usar apenas o .env.example:
- Mantenha apenas valores de exemplo
- Nunca coloque chaves reais

### 3. Verificar arquivos de documentação:
- README.md
- INSTRUCOES_INSTALACAO.md
- INSTRUCOES_ADMIN_SETUP.md
- Qualquer arquivo .md

### 4. Limpar histórico do Git (se necessário):
```bash
# Se já commitou chaves, será necessário limpar o histórico
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env.local" --prune-empty --tag-name-filter cat -- --all
```

## ✅ Checklist antes do commit:

- [ ] Arquivo `.env.local` removido ou com valores de exemplo
- [ ] Nenhum token JWT (eyJ...) em arquivos
- [ ] Nenhuma URL específica do Supabase em arquivos
- [ ] Documentação usa apenas exemplos
- [ ] `.gitignore` configurado corretamente

## 🔄 Para desenvolvimento local:

1. Crie seu próprio projeto Supabase
2. Copie `.env.example` para `.env.local`
3. Substitua pelos valores do SEU projeto
4. NUNCA commite o `.env.local`

## 📞 Em caso de exposição acidental:

1. **IMEDIATAMENTE** regenere todas as chaves no Supabase Dashboard
2. Atualize seu `.env.local` com as novas chaves
3. Limpe o histórico do Git se necessário
4. Force push após limpeza (CUIDADO em projetos compartilhados)

---

**Lembre-se: Uma vez que chaves são expostas publicamente, elas devem ser consideradas comprometidas e regeneradas imediatamente.** 