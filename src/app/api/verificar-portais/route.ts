import { NextRequest, NextResponse } from 'next/server'
import { getPortaisUnicos } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando portais disponíveis...')
    
    // Buscar portais para licitações pendentes
    const { data: portaisPendentes, error: errorPendentes } = await getPortaisUnicos('P')
    
    if (errorPendentes) {
      console.error('❌ Erro ao buscar portais pendentes:', errorPendentes)
      return NextResponse.json({
        success: false,
        error: errorPendentes,
        portaisPendentes: []
      })
    }
    
    console.log('✅ Portais pendentes encontrados:', portaisPendentes?.length || 0)
    
    // Verificar se compras.rs.gov.br está na lista
    const portalPadrao = 'compras.rs.gov.br'
    const contemPortalPadrao = portaisPendentes?.includes(portalPadrao) || false
    
    return NextResponse.json({
      success: true,
      portaisPendentes: portaisPendentes || [],
      totalPortais: portaisPendentes?.length || 0,
      portalPadrao,
      contemPortalPadrao,
      primeiros5Portais: portaisPendentes?.slice(0, 5) || []
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar portais:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 