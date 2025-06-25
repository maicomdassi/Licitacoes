-- Script para adicionar o campo data_leilao à tabela licitacoes
-- Este script deve ser executado no SQL Editor do Supabase

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'licitacoes'
        AND column_name = 'data_leilao'
    ) THEN
        -- Adicionar a coluna data_leilao
        ALTER TABLE licitacoes
        ADD COLUMN data_leilao TIMESTAMP WITH TIME ZONE;
        
        -- Adicionar comentário explicativo à coluna
        COMMENT ON COLUMN licitacoes.data_leilao IS 'Data do leilão quando o interesse for "S"';
    END IF;
END $$;

-- Confirmação
SELECT 'Coluna data_leilao adicionada ou já existente na tabela licitacoes' as status; 