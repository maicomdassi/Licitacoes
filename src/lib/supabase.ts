import { createClient } from '@supabase/supabase-js'
import { Licitacao, Profile, UserRole, Configuracao } from '@/types/database.types'

// Dados mockados para desenvolvimento
const MOCK_DATA: Licitacao[] = [
  {
    id: 1,
    id_licitacao: '12345',
    titulo: 'Aquisição de material escolar',
    municipio_ibge: '3550308',
    uf: 'SP',
    orgao: 'Ministério da Educação',
    abertura_datetime: '2023-06-10T10:00:00Z',
    objeto: 'Aquisição de material escolar para escolas públicas',
    link: 'https://exemplo.com/licitacao/1',
    link_externo: 'https://comprasnet.gov.br/licitacao/1',
    municipio: 'São Paulo',
    abertura: '10/06/2023',
    abertura_com_hora: '10/06/2023 10:00',
    id_tipo: '1',
    tipo: 'Pregão Eletrônico',
    data_insercao: '2023-05-01',
    created_at: '2023-05-01T00:00:00Z',
    updated_at: '2023-05-01T00:00:00Z',
    interece: 'P'
  },
  {
    id: 2,
    id_licitacao: '67890',
    titulo: 'Compra de medicamentos',
    municipio_ibge: '3304557',
    uf: 'RJ',
    orgao: 'Ministério da Saúde',
    abertura_datetime: '2023-07-15T14:00:00Z',
    objeto: 'Compra de medicamentos para hospitais públicos',
    link: 'https://exemplo.com/licitacao/2',
    link_externo: 'https://comprasnet.gov.br/licitacao/2',
    municipio: 'Rio de Janeiro',
    abertura: '15/07/2023',
    abertura_com_hora: '15/07/2023 14:00',
    id_tipo: '1',
    tipo: 'Pregão Eletrônico',
    data_insercao: '2023-05-15',
    created_at: '2023-05-15T00:00:00Z',
    updated_at: '2023-05-15T00:00:00Z',
    interece: 'S',
    valor_max: 130000
  },
  {
    id: 3,
    id_licitacao: '24680',
    titulo: 'Construção de ponte',
    municipio_ibge: '5300108',
    uf: 'DF',
    orgao: 'Ministério da Infraestrutura',
    abertura_datetime: '2023-08-20T09:00:00Z',
    objeto: 'Construção de ponte sobre o rio',
    link: 'https://exemplo.com/licitacao/3',
    link_externo: 'https://comprasnet.gov.br/licitacao/3',
    municipio: 'Brasília',
    abertura: '20/08/2023',
    abertura_com_hora: '20/08/2023 09:00',
    id_tipo: '2',
    tipo: 'Concorrência',
    data_insercao: '2023-05-20',
    created_at: '2023-05-20T00:00:00Z',
    updated_at: '2023-05-20T00:00:00Z',
    interece: 'N'
  }
];

// Configuração para ambiente de desenvolvimento
const isDev = process.env.NODE_ENV === 'development';
const USE_MOCK = false; // Usar dados mockados quando houver problemas de conexão

// SEMPRE usar variáveis de ambiente - NUNCA hardcode chaves de API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Configuração do Supabase incompleta. Verifique as variáveis de ambiente.');
}

console.log('Inicializando cliente Supabase...', { 
  url: supabaseUrl, 
  keyLength: supabaseKey?.length || 0,
  isDev
});

// Cria o cliente Supabase com tratamento de erros aprimorado
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': '@supabase/auth-helpers-nextjs'
    }
  }
});

// Função para testar a conexão com o Supabase
export async function testConnection() {
  try {
    console.log('Iniciando teste de conexão detalhado...');
    
    // Teste básico de conectividade com o domínio
    try {
      console.log(`Testando conectividade com ${supabaseUrl}...`);
      const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey || '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta HTTP:', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        ok: fetchResponse.ok,
        headers: Object.fromEntries([...fetchResponse.headers.entries()])
      });
      
      if (!fetchResponse.ok) {
        return { 
          success: false, 
          error: `Erro HTTP: ${fetchResponse.status} ${fetchResponse.statusText}`,
          details: { 
            status: fetchResponse.status, 
            statusText: fetchResponse.statusText,
            headers: Object.fromEntries([...fetchResponse.headers.entries()])
          }
        };
      }
    } catch (fetchError) {
      console.error('Erro ao acessar URL do Supabase:', fetchError);
      return { 
        success: false, 
        error: fetchError instanceof Error ? fetchError.message : 'Erro de conectividade',
        details: fetchError
      };
    }
    
    // Teste de autenticação
    console.log('Testando autenticação do Supabase...');
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      console.log('Status da autenticação:', authData?.session ? 'Autenticado' : 'Não autenticado');
      
      if (authError) {
        console.error('Erro na autenticação:', authError);
        return {
          success: false,
          error: authError.message || 'Erro na autenticação',
          details: authError
        };
      }
    } catch (authErr) {
      console.warn('Aviso na verificação de autenticação:', authErr);
      // Continuar mesmo com erro de autenticação
    }
    
    // Verificar se a tabela licitacoes existe e tem dados
    console.log('Verificando se a tabela licitacoes existe...');
    try {
      const { data, error } = await supabase
        .from('licitacoes')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('Erro ao verificar tabela licitacoes:', error);
        
        // Se o erro for relacionado à tabela não existente, retornar mensagem específica
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          return {
            success: false,
            error: 'A tabela licitacoes não existe no banco de dados',
            details: {
              error,
              message: 'É necessário criar a tabela licitacoes no banco de dados',
              code: error.code
            }
          };
        }
        
        return {
          success: false,
          error: error.message || 'Erro ao acessar a tabela licitacoes',
          details: { 
            error, 
            code: error.code, 
            hint: error.hint,
            details: error.details,
            message: error.message
          }
        };
      }
      
      console.log('Tabela licitacoes existe e está acessível!', data);
      return { 
        success: true, 
        message: 'Conexão com o Supabase estabelecida com sucesso e tabela licitacoes está acessível',
        data 
      };
    } catch (apiError) {
      console.error('Erro ao verificar tabela licitacoes:', apiError);
      return {
        success: false,
        error: apiError instanceof Error ? apiError.message : 'Erro ao verificar tabela licitacoes',
        details: { 
          apiError, 
          message: apiError instanceof Error ? apiError.message : 'Erro desconhecido'
        }
      };
    }
  } catch (err) {
    console.error('Exceção ao testar conexão:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      details: { 
        err, 
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        stack: err instanceof Error ? err.stack : undefined
      }
    };
  }
}

// Função para carregar TODAS as licitações (para filtro por palavras-chave)
export async function getAllLicitacoes(
  filtroInteresse: 'P' | 'S' | 'N',
  options?: { portal?: string }
) {
  try {
    // Usar dados mockados em desenvolvimento
    if (USE_MOCK) {
      console.log('Carregando TODOS os dados mockados para filtro de palavras-chave');
      let filteredData = MOCK_DATA.filter(item => item.interece === filtroInteresse);
      
      // Aplicar filtro de portal se especificado
      if (options?.portal && options.portal !== 'todos') {
        filteredData = filteredData.filter(item => {
          if (!item.link_externo) return false;
          try {
            const url = new URL(item.link_externo);
            const portal = url.hostname.replace('www.', '');
            return portal === options.portal;
          } catch {
            return false;
          }
        });
      }
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log(`📊 Carregados ${filteredData.length} registros COMPLETOS para filtro`);
      
      return {
        data: filteredData,
        total: filteredData.length
      };
    }

    // Código para produção - carregar TODOS os registros
    console.log('🔄 Carregando TODOS os registros para filtro de palavras-chave...', { filtroInteresse, portal: options?.portal });
    
    try {
      // Construir a consulta para TODOS os registros
      let query = supabase
        .from('licitacoes')
        .select('*')
        .eq('interece', filtroInteresse);

      // Aplicar filtro de portal se especificado
      if (options?.portal && options.portal !== 'todos') {
        console.log('Aplicando filtro de portal:', options.portal)
        query = query.ilike('link_externo', `%${options.portal}%`);
      }

      const { data, error } = await query
        .order('abertura_datetime', { ascending: false });

      if (error) {
        console.error('Erro na consulta completa:', error);
        throw new Error(`Erro na consulta: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('Nenhum dado encontrado na consulta completa');
        return {
          data: [],
          total: 0
        };
      }

      console.log(`📊 Carregados ${data.length} registros COMPLETOS para filtro`);
      
      return {
        data: data as Licitacao[],
        total: data.length
      };
    } catch (error) {
      console.error('Erro na consulta completa:', error);
      // Se houver erro, tentamos usar os dados mockados como fallback
      if (isDev) {
        console.log('Usando dados mockados como fallback após erro');
        let filteredData = MOCK_DATA.filter(item => item.interece === filtroInteresse);
        
        // Aplicar filtro de portal se especificado
        if (options?.portal && options.portal !== 'todos') {
          filteredData = filteredData.filter(item => {
            if (!item.link_externo) return false;
            try {
              const url = new URL(item.link_externo);
              const portal = url.hostname.replace('www.', '');
              return portal === options.portal;
            } catch {
              return false;
            }
          });
        }
        
        return {
          data: filteredData,
          total: filteredData.length
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro detalhado:', error);
    throw error;
  }
}

export async function getLicitacoes(
  pagina: number,
  limite: number,
  filtroInteresse: 'P' | 'S' | 'N',
  options?: { offset?: number, portal?: string }
) {
  try {
    // Usar dados mockados em desenvolvimento
    if (USE_MOCK) {
      console.log('Usando dados mockados para desenvolvimento');
      let filteredData = MOCK_DATA.filter(item => item.interece === filtroInteresse);
      
      // Aplicar filtro de portal se especificado
      if (options?.portal && options.portal !== 'todos') {
        filteredData = filteredData.filter(item => {
          if (!item.link_externo) return false;
          try {
            const url = new URL(item.link_externo);
            const portal = url.hostname.replace('www.', '');
            return portal === options.portal;
          } catch {
            return false;
          }
        });
      }
      
      const from = options?.offset !== undefined ? options.offset : pagina * limite;
      const to = from + limite;
      const paginatedData = filteredData.slice(from, to);
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        data: paginatedData,
        total: filteredData.length
      };
    }

    // Código original para produção
    const from = options?.offset !== undefined ? options.offset : pagina * limite;
    const to = from + limite - 1;

    console.log('Tentando conectar ao Supabase...', { pagina, limite, from, to, portal: options?.portal });
    
    try {
      // Construir a consulta principal
      let query = supabase
        .from('licitacoes')
        .select('*')
        .eq('interece', filtroInteresse);

      // Aplicar filtro de portal se especificado
      if (options?.portal && options.portal !== 'todos') {
        console.log('Aplicando filtro de portal:', options.portal)
        // Usar ilike para busca case-insensitive
        query = query.ilike('link_externo', `%${options.portal}%`);
      } else {
        console.log('Sem filtro de portal aplicado')
      }

      const { data, error } = await query
        .order('abertura_datetime', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Erro na consulta:', error);
        throw new Error(`Erro na consulta: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('Nenhum dado encontrado');
        return {
          data: [],
          total: 0
        };
      }

      // Para obter o total, fazemos uma consulta separada para contar
      let countQuery = supabase
        .from('licitacoes')
        .select('id')
        .eq('interece', filtroInteresse);

      // Aplicar o mesmo filtro de portal para a contagem
      if (options?.portal && options.portal !== 'todos') {
        countQuery = countQuery.ilike('link_externo', `%${options.portal}%`);
      }

      const { data: countData, error: countError } = await countQuery;
      
      let total = data.length;
      
      if (!countError && countData) {
        total = countData.length;
      } else if (countError) {
        console.warn('Erro ao contar total de registros:', countError);
      }

      console.log(`Encontrados ${data.length} registros de ${total} total`);
      
      // Log detalhado dos primeiros registros para debug
      if (options?.portal && data.length > 0) {
        console.log('Primeiros registros encontrados:');
        data.slice(0, 3).forEach((item: any, index: number) => {
          console.log(`${index + 1}. ID: ${item.id}, Link: ${item.link_externo}`);
        });
      }
      
      return {
        data: data as Licitacao[],
        total
      };
    } catch (error) {
      console.error('Erro na consulta:', error);
      // Se houver erro, tentamos usar os dados mockados como fallback
      if (isDev) {
        console.log('Usando dados mockados como fallback após erro');
        let filteredData = MOCK_DATA.filter(item => item.interece === filtroInteresse);
        
        // Aplicar filtro de portal se especificado
        if (options?.portal && options.portal !== 'todos') {
          filteredData = filteredData.filter(item => {
            if (!item.link_externo) return false;
            try {
              const url = new URL(item.link_externo);
              const portal = url.hostname.replace('www.', '');
              return portal === options.portal;
            } catch {
              return false;
            }
          });
        }
        
        const from = options?.offset !== undefined ? options.offset : pagina * limite;
        const to = from + limite;
        const paginatedData = filteredData.slice(from, to);
        
        return {
          data: paginatedData,
          total: filteredData.length
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro detalhado:', error);
    throw error;
  }
}

export async function updateLicitacao(
  id: number,
  updates: Partial<Licitacao>
) {
  try {
    // Usar dados mockados em desenvolvimento
    if (USE_MOCK) {
      console.log('Atualizando licitação mockada:', { id, updates });
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Não fazemos nada realmente, apenas simulamos sucesso
      return { error: null };
    }
    
    console.log('Atualizando licitação:', { id, updates });
    
    const { error } = await supabase
      .from('licitacoes')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar licitação:', error);
      throw error;
    }
    
    return { error: null };
  } catch (error) {
    console.error('Erro detalhado na atualização:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      error
    });
    throw error;
  }
}

// Função para buscar o perfil do usuário atual
export async function getCurrentUserProfile(): Promise<{ data: Profile | null, error: string | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { data: null, error: userError?.message || 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para verificar se o usuário atual é admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data } = await getCurrentUserProfile()
    return data?.role === 'admin'
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error)
    return false
  }
}

// Função para criar ou atualizar perfil
export async function upsertProfile(profile: Partial<Profile>): Promise<{ data: Profile | null, error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single()

    if (error) {
      console.error('Erro ao upsert perfil:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao fazer upsert do perfil:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para buscar todos os perfis (apenas admins)
export async function getAllProfiles(): Promise<{ data: Profile[], error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar perfis:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Erro ao buscar perfis:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para atualizar role de um usuário (apenas admins)
export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean, error: string | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Erro ao atualizar role:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao atualizar role do usuário:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para buscar portais únicos filtrados por interesse
export async function getPortaisUnicos(filtroInteresse?: 'P' | 'S' | 'N'): Promise<{ data: string[], error: string | null }> {
  try {
    if (USE_MOCK) {
      // Extrair portais dos dados mockados filtrados por interesse
      const portais = new Set<string>()
      MOCK_DATA
        .filter(item => !filtroInteresse || item.interece === filtroInteresse)
        .forEach(item => {
          if (item.link_externo) {
            try {
              const url = new URL(item.link_externo)
              const portal = url.hostname.replace('www.', '')
              
              // Validar se o portal é válido (não vazio, não é só protocolo, tem pelo menos um ponto)
              if (portal && 
                  portal.length > 0 && 
                  portal !== 'https' && 
                  portal !== 'http' && 
                  portal.includes('.') &&
                  portal.length > 3) {
                portais.add(portal)
              }
            } catch {
              // Ignorar URLs inválidas
            }
          }
        })
      
      return { data: Array.from(portais).sort(), error: null }
    }

    // Construir a consulta com filtro de interesse se especificado
    let query = supabase
      .from('licitacoes')
      .select('link_externo')
      .not('link_externo', 'is', null)

    if (filtroInteresse) {
      query = query.eq('interece', filtroInteresse)
    }

    const { data, error } = await query.limit(1000)

    if (error) {
      console.error('Erro ao buscar portais:', error)
      return { data: [], error: error.message }
    }

    const portais = new Set<string>()
    data?.forEach((item: any) => {
      if (item.link_externo) {
        try {
          const url = new URL(item.link_externo)
          const portal = url.hostname.replace('www.', '')
          
          // Validar se o portal é válido (não vazio, não é só protocolo, tem pelo menos um ponto)
          if (portal && 
              portal.length > 0 && 
              portal !== 'https' && 
              portal !== 'http' && 
              portal.includes('.') &&
              portal.length > 3) {
            portais.add(portal)
          }
        } catch {
          // Ignorar URLs inválidas
        }
      }
    })

    return { data: Array.from(portais).sort(), error: null }
  } catch (error) {
    console.error('Erro ao buscar portais únicos:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para buscar uma configuração por chave
export async function getConfiguracao(chave: string): Promise<{ data: string | null, error: string | null }> {
  try {
    if (USE_MOCK) {
      // Para desenvolvimento, retornar valor padrão
      if (chave === 'portal_padrao') {
        return { data: 'compras.rs.gov.br', error: null }
      }
      return { data: null, error: 'Configuração não encontrada' }
    }

    const { data, error } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', chave)
      .single()

    if (error) {
      console.error('Erro ao buscar configuração:', error)
      // Se for erro de não encontrado, retornar valor padrão para portal_padrao
      if (error.code === 'PGRST116' && chave === 'portal_padrao') {
        return { data: 'compras.rs.gov.br', error: null }
      }
      return { data: null, error: error.message }
    }

    return { data: data.valor, error: null }
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para atualizar uma configuração
export async function setConfiguracao(chave: string, valor: string, descricao?: string): Promise<{ success: boolean, error: string | null }> {
  try {
    if (USE_MOCK) {
      console.log('Mock: Configuração salva:', { chave, valor, descricao })
      return { success: true, error: null }
    }

    const { error } = await supabase
      .from('configuracoes')
      .upsert({
        chave,
        valor,
        descricao,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Erro ao salvar configuração:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para buscar todas as configurações
export async function getAllConfiguracoes(): Promise<{ data: Configuracao[], error: string | null }> {
  try {
    if (USE_MOCK) {
      const mockConfig: Configuracao[] = [{
        id: 1,
        chave: 'portal_padrao',
        valor: 'compras.rs.gov.br',
        descricao: 'Portal padrão selecionado nos filtros de licitações',
        created_at: new Date().toISOString()
      }]
      return { data: mockConfig, error: null }
    }

    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .order('chave', { ascending: true })

    if (error) {
      console.error('Erro ao buscar configurações:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
} 