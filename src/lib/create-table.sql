-- Criar tabela licitacoes
CREATE TABLE IF NOT EXISTS public.licitacoes (
  id SERIAL PRIMARY KEY,
  uasg VARCHAR(20) NOT NULL,
  orgao VARCHAR(255) NOT NULL,
  objeto TEXT NOT NULL,
  edital VARCHAR(100) NOT NULL,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
  valor_estimado DECIMAL(15,2) NOT NULL,
  interece CHAR(1) NOT NULL CHECK (interece IN ('P', 'S', 'N')),
  valor_max DECIMAL(15,2),
  data_leilao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários à tabela
COMMENT ON TABLE public.licitacoes IS 'Tabela de licitações';
COMMENT ON COLUMN public.licitacoes.id IS 'ID único da licitação';
COMMENT ON COLUMN public.licitacoes.uasg IS 'Código UASG do órgão';
COMMENT ON COLUMN public.licitacoes.orgao IS 'Nome do órgão';
COMMENT ON COLUMN public.licitacoes.objeto IS 'Objeto da licitação';
COMMENT ON COLUMN public.licitacoes.edital IS 'Número do edital';
COMMENT ON COLUMN public.licitacoes.data_abertura IS 'Data de abertura da licitação';
COMMENT ON COLUMN public.licitacoes.valor_estimado IS 'Valor estimado da licitação';
COMMENT ON COLUMN public.licitacoes.interece IS 'Interesse: P (Participando), S (Sim), N (Não)';
COMMENT ON COLUMN public.licitacoes.valor_max IS 'Valor máximo para lance';
COMMENT ON COLUMN public.licitacoes.data_leilao IS 'Data do leilão';
COMMENT ON COLUMN public.licitacoes.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.licitacoes.updated_at IS 'Data da última atualização';

-- Criar função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o updated_at automaticamente
DROP TRIGGER IF EXISTS update_licitacoes_updated_at ON public.licitacoes;
CREATE TRIGGER update_licitacoes_updated_at
BEFORE UPDATE ON public.licitacoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar política de segurança para permitir acesso anônimo para leitura
ALTER TABLE public.licitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura anônima" ON public.licitacoes
FOR SELECT USING (true);

CREATE POLICY "Permitir edição para usuários autenticados" ON public.licitacoes
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção para usuários autenticados" ON public.licitacoes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão para usuários autenticados" ON public.licitacoes
FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns dados de exemplo
INSERT INTO public.licitacoes (uasg, orgao, objeto, edital, data_abertura, valor_estimado, interece)
VALUES
  ('123456', 'Ministério da Educação', 'Aquisição de material escolar', 'PREGÃO 001/2023', '2023-06-10T10:00:00Z', 50000, 'P'),
  ('789012', 'Ministério da Saúde', 'Compra de medicamentos', 'PREGÃO 002/2023', '2023-07-15T14:00:00Z', 120000, 'S'),
  ('345678', 'Ministério da Infraestrutura', 'Construção de ponte', 'CONCORRÊNCIA 001/2023', '2023-08-20T09:00:00Z', 5000000, 'N');

-- Criar função RPC para criar a tabela licitacoes
CREATE OR REPLACE FUNCTION public.create_licitacoes_table()
RETURNS JSONB AS $$
BEGIN
  -- Verificar se a tabela já existe
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'licitacoes') THEN
    RETURN jsonb_build_object('message', 'Tabela licitacoes já existe');
  END IF;
  
  -- Criar a tabela
  CREATE TABLE public.licitacoes (
    id SERIAL PRIMARY KEY,
    uasg VARCHAR(20) NOT NULL,
    orgao VARCHAR(255) NOT NULL,
    objeto TEXT NOT NULL,
    edital VARCHAR(100) NOT NULL,
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
    valor_estimado DECIMAL(15,2) NOT NULL,
    interece CHAR(1) NOT NULL CHECK (interece IN ('P', 'S', 'N')),
    valor_max DECIMAL(15,2),
    data_leilao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Adicionar comentários
  COMMENT ON TABLE public.licitacoes IS 'Tabela de licitações';
  
  -- Configurar RLS
  ALTER TABLE public.licitacoes ENABLE ROW LEVEL SECURITY;
  
  -- Criar políticas de acesso
  CREATE POLICY "Permitir leitura anônima" ON public.licitacoes
  FOR SELECT USING (true);
  
  CREATE POLICY "Permitir edição para usuários autenticados" ON public.licitacoes
  FOR UPDATE USING (auth.role() = 'authenticated');
  
  CREATE POLICY "Permitir inserção para usuários autenticados" ON public.licitacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
  CREATE POLICY "Permitir exclusão para usuários autenticados" ON public.licitacoes
  FOR DELETE USING (auth.role() = 'authenticated');
  
  -- Inserir dados de exemplo
  INSERT INTO public.licitacoes (uasg, orgao, objeto, edital, data_abertura, valor_estimado, interece)
  VALUES
    ('123456', 'Ministério da Educação', 'Aquisição de material escolar', 'PREGÃO 001/2023', '2023-06-10T10:00:00Z', 50000, 'P'),
    ('789012', 'Ministério da Saúde', 'Compra de medicamentos', 'PREGÃO 002/2023', '2023-07-15T14:00:00Z', 120000, 'S'),
    ('345678', 'Ministério da Infraestrutura', 'Construção de ponte', 'CONCORRÊNCIA 001/2023', '2023-08-20T09:00:00Z', 5000000, 'N');
  
  RETURN jsonb_build_object('message', 'Tabela licitacoes criada com sucesso', 'rows', 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 