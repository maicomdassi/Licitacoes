import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Forçando criação do perfil admin...')
    
    // Buscar usuário maicomdassi@gmail.com
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: `Erro ao listar usuários: ${usersError.message}`
      }, { status: 500 })
    }
    
    const adminUser = users.users.find((user: any) => user.email === 'maicomdassi@gmail.com')
    
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuário maicomdassi@gmail.com não encontrado. Você precisa se registrar primeiro.'
      }, { status: 404 })
    }
    
    console.log('👤 Usuário encontrado:', adminUser.email, adminUser.id)
    
    // Tentar inserir diretamente ignorando se a tabela não existe
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: adminUser.id,
          email: adminUser.email,
          role: 'admin'
        })
        .select()
      
      if (error) {
        throw error
      }
      
      return NextResponse.json({
        success: true,
        message: 'Perfil admin criado com sucesso!',
        profile: data?.[0],
        userId: adminUser.id
      })
      
    } catch (profileError: any) {
      if (profileError.code === '42P01') {
        // Tabela não existe
        return NextResponse.json({
          success: false,
          error: 'Tabela profiles não existe. Execute este SQL no Supabase SQL Editor:',
          sql: `
-- Execute este SQL no Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Inserir o admin diretamente:
INSERT INTO profiles (id, email, role) VALUES 
('${adminUser.id}', 'maicomdassi@gmail.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
          `,
          userId: adminUser.id
        }, { status: 400 })
      }
      
      throw profileError
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error
    }, { status: 500 })
  }
} 