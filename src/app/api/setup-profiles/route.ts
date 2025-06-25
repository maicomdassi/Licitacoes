import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando setup da tabela profiles...')
    
    // Primeiro, vamos verificar se a tabela profiles já existe
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (checkError && checkError.code === '42P01') {
      // Tabela não existe, precisamos criá-la manualmente no SQL Editor
      return NextResponse.json({
        success: false,
        error: 'A tabela profiles não existe. Execute o SQL abaixo no SQL Editor do Supabase:',
        sqlRequired: `
-- Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy para usuários atualizarem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Atualizar timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
        `
      }, { status: 400 })
    }
    
    console.log('✅ Tabela profiles existe!')
    
    // Buscar todos os usuários registrados
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      return NextResponse.json({
        success: false,
        error: `Erro ao listar usuários: ${usersError.message}`,
        details: usersError
      }, { status: 500 })
    }
    
    console.log(`📋 Encontrados ${users.users.length} usuários`)
    
    // Sincronizar todos os usuários na tabela profiles
    const profilesToUpsert = users.users.map((user: any) => ({
      id: user.id,
      email: user.email,
      role: user.email === 'maicomdassi@gmail.com' ? 'admin' : 'user'
    }))
    
    console.log('📝 Sincronizando perfis:', profilesToUpsert)
    
    // Inserir/atualizar todos os perfis
    const { data: upsertedProfiles, error: upsertError } = await supabase
      .from('profiles')
      .upsert(profilesToUpsert, { onConflict: 'id' })
      .select()
    
    if (upsertError) {
      return NextResponse.json({
        success: false,
        error: `Erro ao sincronizar perfis: ${upsertError.message}`,
        details: upsertError
      }, { status: 500 })
    }
    
    // Verificar se o admin foi criado
    const adminProfile = upsertedProfiles?.find((p: any) => p.email === 'maicomdassi@gmail.com')
    
    return NextResponse.json({
      success: true,
      message: `Setup concluído com sucesso! ${upsertedProfiles?.length || 0} perfis sincronizados.`,
      adminCreated: !!adminProfile,
      adminProfile: adminProfile,
      totalProfiles: upsertedProfiles?.length || 0,
      profiles: upsertedProfiles
    })
    
  } catch (error) {
    console.error('❌ Erro no setup:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error
    }, { status: 500 })
  }
} 