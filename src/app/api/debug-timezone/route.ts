import { NextResponse } from 'next/server'
import { getInfoTimezone, getDataBrasil, getOntemBrasil, formatarDataBrasil } from '@/lib/timezone-brasil'

export async function GET() {
  try {
    const info = getInfoTimezone()
    const hoje = getDataBrasil()
    const ontem = getOntemBrasil()
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timezone: {
        sistema: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offsetLocal: new Date().getTimezoneOffset(),
        offsetBrasil: -180, // UTC-3
      },
      datas: {
        utc: info.dataUTC,
        brasil: info.dataBrasil,
        hojeFormatado: formatarDataBrasil(hoje),
        ontemFormatado: formatarDataBrasil(ontem),
        hojeBrasil: info.dataAtualBrasil,
        ontemBrasil: info.ontemBrasil
      },
      debug: {
        new_Date: new Date().toISOString(),
        getDataBrasil: hoje.toISOString(),
        getOntemBrasil: ontem.toISOString(),
        diferenca_horas: (new Date().getTime() - hoje.getTime()) / (1000 * 60 * 60)
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 