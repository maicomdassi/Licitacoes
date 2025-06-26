-- Atualizar constraint de status para incluir ajuste_manual
-- Executar no Supabase SQL Editor

-- 1. Remover constraint antiga
ALTER TABLE controle_consultas DROP CONSTRAINT IF EXISTS status_validos;

-- 2. Adicionar nova constraint com ajuste_manual
ALTER TABLE controle_consultas 
ADD CONSTRAINT status_validos 
CHECK (status_ultima_consulta IN ('sucesso', 'erro', 'parcial', 'ajuste_manual'));

-- 3. Verificar se funcionou
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'status_validos'; 