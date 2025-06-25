import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Listando usuários...')

    // Buscar usuários do auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Erro ao buscar usuários auth: ${authError.message}`)
    }

    // Buscar perfis da tabela profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      throw new Error(`Erro ao buscar perfis: ${profilesError.message}`)
    }

    // Combinar dados do auth.users com profiles
    const usuarios = authUsers.users.map((authUser: any) => {
      const profile = profiles?.find((p: any) => p.id === authUser.id)
      
      return {
        id: authUser.id,
        email: authUser.email,
        role: profile?.role || 'user',
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at,
        last_sign_in_at: authUser.last_sign_in_at,
        created_at_auth: authUser.created_at,
        email_confirmed_at: authUser.email_confirmed_at,
        phone: authUser.phone,
        confirmed_at: authUser.confirmed_at
      }
    })

    console.log(`✅ Encontrados ${usuarios.length} usuários`)

    return NextResponse.json({
      success: true,
      usuarios: usuarios,
      total: usuarios.length,
      stats: {
        admins: usuarios.filter((u: any) => u.role === 'admin').length,
        users: usuarios.filter((u: any) => u.role === 'user').length
      }
    })

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      usuarios: []
    }, { status: 500 })
  }
}

// PUT - Atualizar role do usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role } = body

    console.log(`🔧 Atualizando usuário ${userId} para role: ${role}`)

    // Validar dados
    if (!userId || !role) {
      return NextResponse.json({
        success: false,
        error: 'userId e role são obrigatórios'
      }, { status: 400 })
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Role deve ser "admin" ou "user"'
      }, { status: 400 })
    }

    // Verificar se o usuário existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (checkError || !existingProfile) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }

    // Proteção: não permitir remover admin do maicomdassi@gmail.com
    if (existingProfile.email === 'maicomdassi@gmail.com' && role === 'user') {
      return NextResponse.json({
        success: false,
        error: 'Não é possível remover privilégios de admin do usuário principal'
      }, { status: 403 })
    }

    // Atualizar role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erro ao atualizar perfil: ${updateError.message}`)
    }

    console.log(`✅ Usuário ${existingProfile.email} atualizado para ${role}`)

    return NextResponse.json({
      success: true,
      message: `Usuário atualizado para ${role === 'admin' ? 'administrador' : 'usuário comum'}`,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// POST - Criar novo usuário (opcional, para futuras implementações)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Criação de usuários deve ser feita através do sistema de registro'
  }, { status: 405 })
} 