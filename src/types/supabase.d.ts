declare module '@supabase/supabase-js' {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      auth?: {
        persistSession?: boolean;
        autoRefreshToken?: boolean;
        detectSessionInUrl?: boolean;
      };
      global?: {
        headers?: Record<string, string>;
      };
    }
  ): any;

  export type User = {
    id: string;
    email?: string;
    user_metadata: Record<string, any>;
    app_metadata: Record<string, any>;
    aud: string;
    created_at: string;
  };

  export type Session = {
    user: User;
  };

  export type AuthChangeEvent = 
    | 'SIGNED_IN'
    | 'SIGNED_OUT'
    | 'USER_UPDATED'
    | 'PASSWORD_RECOVERY';
} 