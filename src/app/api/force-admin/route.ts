import { NextRequest, NextResponse } from 'next/server'
import { supabase, getCurrentUserProfile } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Promovendo usuário atual a administrador...')
    
    // Obter o usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado. Faça login primeiro.'
      }, { status: 401 })
    }
    
    console.log('👤 Usuário atual:', user.email, user.id)
    
    // Verificar se já existe algum administrador no sistema
    const { data: existingAdmins, error: adminCheckError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
    
    if (adminCheckError) {
      console.log('⚠️ Erro ao verificar admins existentes (tabela pode não existir):', adminCheckError)
    }
    
    // Se já existem admins, não permitir auto-promoção
    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Já existem administradores no sistema. Solicite privilégios a um administrador existente.',
        existingAdmins: existingAdmins.map((admin: any) => ({ email: admin.email }))
      }, { status: 403 })
    }
    
    // Tentar inserir/atualizar o perfil como admin
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          role: 'admin'
        })
        .select()
      
      if (error) {
        throw error
      }
      
      return NextResponse.json({
        success: true,
        message: 'Você foi promovido a administrador com sucesso!',
        profile: data?.[0],
        userId: user.id
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

-- Policies para RLS
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Inserir o primeiro admin (substitua o ID pelo seu):
INSERT INTO profiles (id, email, role) VALUES 
('${user.id}', '${user.email}', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
          `,
          userId: user.id
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