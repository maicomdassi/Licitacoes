-- Criar tabela de configurações do sistema
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

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_updated_at 
BEFORE UPDATE ON configuracoes 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 