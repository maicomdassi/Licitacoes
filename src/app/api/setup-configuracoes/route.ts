import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Executando setup da tabela configuracoes...')
    
    // Script SQL para criar a tabela e configuração inicial
    const setupSQL = `
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
    `

    // Executar o SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: setupSQL })
    
    if (error) {
      console.error('Erro ao executar setup SQL:', error)
      
      // Tentar criar a tabela usando métodos alternativos
      try {
        // Criar tabela usando insert/upsert direto
        const { error: insertError } = await supabase
          .from('configuracoes')
          .upsert({
            chave: 'portal_padrao',
            valor: 'compras.rs.gov.br',
            descricao: 'Portal padrão selecionado nos filtros de licitações'
          })
        
        if (insertError) {
          throw new Error(`Erro ao inserir configuração: ${insertError.message}`)
        }
        
        console.log('✅ Configuração criada com sucesso usando método alternativo')
        
        return NextResponse.json({
          success: true,
          message: 'Setup concluído com sucesso (método alternativo)',
          method: 'direct_insert'
        })
        
      } catch (altError) {
        throw new Error(`Falha no setup: ${error.message}. Método alternativo também falhou: ${altError}`)
      }
    }

    // Verificar se a configuração foi criada
    const { data: config, error: selectError } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('chave', 'portal_padrao')
      .single()

    if (selectError) {
      console.warn('Aviso ao verificar configuração:', selectError)
    }

    console.log('✅ Setup da tabela configuracoes concluído com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Setup da tabela configuracoes concluído com sucesso',
      config: config || null,
      method: 'sql_rpc'
    })

  } catch (error) {
    console.error('❌ Erro no setup da tabela configuracoes:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      instructions: [
        'Execute manualmente no SQL Editor do Supabase:',
        '',
        'CREATE TABLE IF NOT EXISTS configuracoes (',
        '  id SERIAL PRIMARY KEY,',
        '  chave VARCHAR(100) UNIQUE NOT NULL,',
        '  valor TEXT NOT NULL,',
        '  descricao TEXT,',
        '  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),',
        '  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        ');',
        '',
        'INSERT INTO configuracoes (chave, valor, descricao)',
        'VALUES (',
        '  \'portal_padrao\',',
        '  \'compras.rs.gov.br\',',
        '  \'Portal padrão selecionado nos filtros de licitações\'',
        ') ON CONFLICT (chave) DO NOTHING;'
      ]
    }, { status: 500 })
  }
} 