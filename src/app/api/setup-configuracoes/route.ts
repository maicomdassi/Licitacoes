import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Criando tabela configuracoes...')
    
    // Primeiro, tentar criar a tabela diretamente
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        chave VARCHAR(100) UNIQUE NOT NULL,
        valor TEXT NOT NULL,
        descricao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    // Usar uma consulta SQL direta
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql_query: createTableQuery 
    })
    
    if (createError) {
      console.log('Tentativa com RPC falhou, tentando método alternativo...')
      
      // Método alternativo: tentar inserir diretamente (se a tabela existir)
      const { error: insertError } = await supabase
        .from('configuracoes')
        .upsert({
          chave: 'portal_padrao',
          valor: 'compras.rs.gov.br',
          descricao: 'Portal padrão selecionado nos filtros de licitações'
        }, {
          onConflict: 'chave'
        })
      
      if (insertError) {
        console.error('Erro ao inserir configuração:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Tabela configuracoes não existe. Execute o SQL manualmente no Supabase.',
          sqlToExecute: `
CREATE TABLE configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO configuracoes (chave, valor, descricao) 
VALUES ('portal_padrao', 'compras.rs.gov.br', 'Portal padrão selecionado nos filtros de licitações')
ON CONFLICT (chave) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);
          `
        }, { status: 500 })
      }
      
      console.log('✅ Configuração inserida com sucesso (tabela já existia)')
      return NextResponse.json({
        success: true,
        message: 'Configuração inserida com sucesso (tabela já existia)',
        method: 'direct_insert'
      })
    }
    
    // Se chegou aqui, a tabela foi criada. Agora inserir a configuração padrão
    const { error: insertError } = await supabase
      .from('configuracoes')
      .upsert({
        chave: 'portal_padrao',
        valor: 'compras.rs.gov.br',
        descricao: 'Portal padrão selecionado nos filtros de licitações'
      }, {
        onConflict: 'chave'
      })
    
    if (insertError) {
      console.error('Erro ao inserir configuração:', insertError)
      return NextResponse.json({
        success: false,
        error: `Tabela criada mas erro ao inserir configuração: ${insertError.message}`
      }, { status: 500 })
    }
    
    // Criar índice
    const indexQuery = `CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);`
    await supabase.rpc('exec_sql', { sql_query: indexQuery })
    
    console.log('✅ Tabela configuracoes criada e configuração inserida com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Tabela configuracoes criada e configuração inserida com sucesso',
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
        'CREATE TABLE configuracoes (',
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
        ') ON CONFLICT (chave) DO NOTHING;',
        '',
        'CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);'
      ]
    }, { status: 500 })
  }
} 