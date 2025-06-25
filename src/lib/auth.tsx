'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Configuração para usar autenticação mockada
const USE_MOCK_AUTH = false;

// Usuário mockado para desenvolvimento
const MOCK_USER = {
  id: 'mock-user-id',
  email: 'usuario@exemplo.com',
  user_metadata: {
    name: 'Usuário de Teste'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      // Simular um pequeno delay para autenticação mockada
      const timer = setTimeout(() => {
        setUser(MOCK_USER as unknown as User)
        setSession({ user: MOCK_USER as unknown as User } as Session)
        setIsLoading(false)
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      // Verificar se já existe uma sessão ativa
      const fetchSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao buscar sessão:', error)
        }
        
        setSession(session)
        setUser(session?.user || null)
        setIsLoading(false)
      }

      fetchSession()

      // Configurar listener para mudanças na autenticação
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: Session | null) => {
          setSession(session)
          setUser(session?.user || null)
          setIsLoading(false)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (USE_MOCK_AUTH) {
      // Simular um pequeno delay para login mockado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar se é o usuário mockado
      if (email === 'usuario@exemplo.com' && password === 'senha123') {
        setUser(MOCK_USER as unknown as User);
        setSession({ user: MOCK_USER as unknown as User } as Session);
        return { error: null };
      }
      
      return { error: { message: 'Email ou senha incorretos' } };
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    if (USE_MOCK_AUTH) {
      // Simular um pequeno delay para cadastro mockado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular cadastro bem-sucedido
      setUser(MOCK_USER as unknown as User);
      setSession({ user: MOCK_USER as unknown as User } as Session);
      return { error: null };
    }
    
    // Opção para desenvolvimento: cadastro sem confirmação de email
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        // Descomente a linha abaixo para login automático após cadastro (sem confirmação de email)
        // emailRedirectTo: window.location.origin
      }
    })
    
    // Se não houver erro e quiser fazer login automaticamente após o cadastro
    if (!error) {
      // Descomente a linha abaixo para fazer login automático após o cadastro
      // await signIn(email, password)
    }
    
    return { error }
  }

  const signOut = async () => {
    if (USE_MOCK_AUTH) {
      // Simular um pequeno delay para logout mockado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      setSession(null);
      return;
    }
    
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
} 