-- Tabela para controlar consultas à API externa
-- Baseada na aplicação Python migrada

CREATE TABLE IF NOT EXISTS controle_consultas (
    id BIGSERIAL PRIMARY KEY,
    ip_utilizado VARCHAR(45) NOT NULL,
    ultima_data_consultada DATE NOT NULL,
    status_ultima_consulta VARCHAR(20) NOT NULL DEFAULT 'sucesso',
    total_inseridas INTEGER NOT NULL DEFAULT 0,
    data_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT,
    
    -- Índices para performance
    CONSTRAINT status_validos CHECK (status_ultima_consulta IN ('sucesso', 'erro', 'parcial'))
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_controle_consultas_data ON controle_consultas(data_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_controle_consultas_status ON controle_consultas(status_ultima_consulta);
CREATE INDEX IF NOT EXISTS idx_controle_consultas_ip ON controle_consultas(ip_utilizado);

-- Função para obter última consulta bem-sucedida
CREATE OR REPLACE FUNCTION obter_ultima_consulta_sucesso()
RETURNS TABLE(
    ultima_data_consultada DATE,
    ip_utilizado VARCHAR(45),
    total_inseridas INTEGER,
    data_consulta TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
AS $$
    SELECT 
        c.ultima_data_consultada,
        c.ip_utilizado,
        c.total_inseridas,
        c.data_consulta
    FROM controle_consultas c
    WHERE c.status_ultima_consulta = 'sucesso'
    ORDER BY c.data_consulta DESC
    LIMIT 1;
$$;

-- Função para estatísticas de consultas
CREATE OR REPLACE FUNCTION estatisticas_consultas()
RETURNS TABLE(
    total_consultas BIGINT,
    consultas_sucesso BIGINT,
    consultas_erro BIGINT,
    total_licitacoes_inseridas BIGINT,
    primeiro_uso DATE,
    ultimo_uso DATE,
    ips_utilizados BIGINT
)
LANGUAGE sql
AS $$
    SELECT 
        COUNT(*) as total_consultas,
        COUNT(*) FILTER (WHERE status_ultima_consulta = 'sucesso') as consultas_sucesso,
        COUNT(*) FILTER (WHERE status_ultima_consulta = 'erro') as consultas_erro,
        COALESCE(SUM(total_inseridas), 0) as total_licitacoes_inseridas,
        MIN(data_consulta::DATE) as primeiro_uso,
        MAX(data_consulta::DATE) as ultimo_uso,
        COUNT(DISTINCT ip_utilizado) as ips_utilizados
    FROM controle_consultas;
$$;

-- Função para limpar registros antigos (manter apenas últimos 100)
CREATE OR REPLACE FUNCTION limpar_controle_consultas_antigos()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    registros_removidos INTEGER;
BEGIN
    WITH registros_manter AS (
        SELECT id
        FROM controle_consultas
        ORDER BY data_consulta DESC
        LIMIT 100
    )
    DELETE FROM controle_consultas
    WHERE id NOT IN (SELECT id FROM registros_manter);
    
    GET DIAGNOSTICS registros_removidos = ROW_COUNT;
    RETURN registros_removidos;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE controle_consultas IS 'Controle de consultas realizadas à API externa de licitações';
COMMENT ON COLUMN controle_consultas.ip_utilizado IS 'IP público utilizado na consulta';
COMMENT ON COLUMN controle_consultas.ultima_data_consultada IS 'Última data processada com sucesso';
COMMENT ON COLUMN controle_consultas.status_ultima_consulta IS 'Status da consulta: sucesso, erro ou parcial';
COMMENT ON COLUMN controle_consultas.total_inseridas IS 'Total de licitações inseridas nesta execução';
COMMENT ON COLUMN controle_consultas.data_consulta IS 'Timestamp da execução da consulta';

-- Inserir registro inicial se tabela estiver vazia
INSERT INTO controle_consultas (
    ip_utilizado, 
    ultima_data_consultada, 
    status_ultima_consulta, 
    total_inseridas,
    observacoes
)
SELECT 
    'Sistema', 
    CURRENT_DATE - INTERVAL '1 day', 
    'sucesso', 
    0,
    'Registro inicial criado automaticamente'
WHERE NOT EXISTS (SELECT 1 FROM controle_consultas);

-- Verificar se a tabela foi criada corretamente
SELECT 
    'Tabela controle_consultas criada com sucesso!' as mensagem,
    COUNT(*) as registros_existentes
FROM controle_consultas; 