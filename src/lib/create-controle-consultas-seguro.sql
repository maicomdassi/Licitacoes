-- Script seguro para criar/atualizar tabela controle_consultas
-- Verifica se existe e adiciona colunas se necessário

-- 1. Criar tabela se não existe (versão básica)
CREATE TABLE IF NOT EXISTS controle_consultas (
    id BIGSERIAL PRIMARY KEY
);

-- 2. Adicionar colunas uma por uma (não dá erro se já existir)
DO $$
BEGIN
    -- Adicionar coluna ip_utilizado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='controle_consultas' AND column_name='ip_utilizado') THEN
        ALTER TABLE controle_consultas ADD COLUMN ip_utilizado VARCHAR(45);
    END IF;

    -- Adicionar coluna ultima_data_consultada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='controle_consultas' AND column_name='ultima_data_consultada') THEN
        ALTER TABLE controle_consultas ADD COLUMN ultima_data_consultada DATE;
    END IF;

    -- Adicionar coluna status_ultima_consulta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='controle_consultas' AND column_name='status_ultima_consulta') THEN
        ALTER TABLE controle_consultas ADD COLUMN status_ultima_consulta VARCHAR(20) DEFAULT 'sucesso';
    END IF;

    -- Adicionar coluna total_inseridas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='controle_consultas' AND column_name='total_inseridas') THEN
        ALTER TABLE controle_consultas ADD COLUMN total_inseridas INTEGER DEFAULT 0;
    END IF;

    -- Adicionar coluna data_consulta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='controle_consultas' AND column_name='data_consulta') THEN
        ALTER TABLE controle_consultas ADD COLUMN data_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adicionar coluna observacoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='controle_consultas' AND column_name='observacoes') THEN
        ALTER TABLE controle_consultas ADD COLUMN observacoes TEXT;
    END IF;
END $$;

-- 3. Atualizar colunas para NOT NULL (apenas se não tiverem dados)
DO $$
BEGIN
    -- Tornar ip_utilizado NOT NULL (se possível)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='controle_consultas' AND column_name='ip_utilizado' 
               AND is_nullable='YES') THEN
        -- Atualizar registros NULL
        UPDATE controle_consultas SET ip_utilizado = 'Sistema' WHERE ip_utilizado IS NULL;
        -- Tornar NOT NULL
        ALTER TABLE controle_consultas ALTER COLUMN ip_utilizado SET NOT NULL;
    END IF;

    -- Tornar ultima_data_consultada NOT NULL (se possível)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='controle_consultas' AND column_name='ultima_data_consultada' 
               AND is_nullable='YES') THEN
        -- Atualizar registros NULL
        UPDATE controle_consultas SET ultima_data_consultada = CURRENT_DATE WHERE ultima_data_consultada IS NULL;
        -- Tornar NOT NULL
        ALTER TABLE controle_consultas ALTER COLUMN ultima_data_consultada SET NOT NULL;
    END IF;

    -- Tornar status_ultima_consulta NOT NULL (se possível)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='controle_consultas' AND column_name='status_ultima_consulta' 
               AND is_nullable='YES') THEN
        -- Atualizar registros NULL
        UPDATE controle_consultas SET status_ultima_consulta = 'sucesso' WHERE status_ultima_consulta IS NULL;
        -- Tornar NOT NULL
        ALTER TABLE controle_consultas ALTER COLUMN status_ultima_consulta SET NOT NULL;
    END IF;

    -- Tornar total_inseridas NOT NULL (se possível)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='controle_consultas' AND column_name='total_inseridas' 
               AND is_nullable='YES') THEN
        -- Atualizar registros NULL
        UPDATE controle_consultas SET total_inseridas = 0 WHERE total_inseridas IS NULL;
        -- Tornar NOT NULL
        ALTER TABLE controle_consultas ALTER COLUMN total_inseridas SET NOT NULL;
    END IF;
END $$;

-- 4. Adicionar constraint de status (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name='controle_consultas' AND constraint_name='status_validos') THEN
        ALTER TABLE controle_consultas 
        ADD CONSTRAINT status_validos CHECK (status_ultima_consulta IN ('sucesso', 'erro', 'parcial'));
    END IF;
END $$;

-- 5. Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_controle_consultas_data ON controle_consultas(data_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_controle_consultas_status ON controle_consultas(status_ultima_consulta);
CREATE INDEX IF NOT EXISTS idx_controle_consultas_ip ON controle_consultas(ip_utilizado);

-- 6. Criar função para obter última consulta
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

-- 7. Criar função para estatísticas
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

-- 8. Criar função para limpar registros antigos
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

-- 9. Criar função executar_sql se não existir (necessária para expansão dinâmica)
CREATE OR REPLACE FUNCTION executar_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
    RETURN 'SQL executado com sucesso';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro: ' || SQLERRM;
END;
$$;

-- 10. Adicionar comentários
COMMENT ON TABLE controle_consultas IS 'Controle de consultas realizadas à API externa de licitações';
COMMENT ON COLUMN controle_consultas.ip_utilizado IS 'IP público utilizado na consulta';
COMMENT ON COLUMN controle_consultas.ultima_data_consultada IS 'Última data processada com sucesso';
COMMENT ON COLUMN controle_consultas.status_ultima_consulta IS 'Status da consulta: sucesso, erro ou parcial';
COMMENT ON COLUMN controle_consultas.total_inseridas IS 'Total de licitações inseridas nesta execução';
COMMENT ON COLUMN controle_consultas.data_consulta IS 'Timestamp da execução da consulta';

-- 11. Inserir registro inicial se tabela estiver vazia
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

-- 12. Verificação final
SELECT 
    'Tabela controle_consultas configurada com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM controle_consultas) as registros_existentes,
    (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
     FROM information_schema.columns 
     WHERE table_name = 'controle_consultas') as colunas_criadas; 