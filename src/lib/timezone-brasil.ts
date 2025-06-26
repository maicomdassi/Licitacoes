/**
 * Utilitários para trabalhar com timezone do Brasil (UTC-3)
 */

/**
 * Obtém a data atual no horário de Brasília
 */
export function getDataAtualBrasil(): Date {
  const agora = new Date()
  // Brasil está em UTC-3 (ou UTC-2 no horário de verão, mas usaremos UTC-3 como padrão)
  const offsetBrasil = -3 * 60 // -3 horas em minutos
  const offsetLocal = agora.getTimezoneOffset() // offset do sistema local
  const diferencaMinutos = offsetBrasil - offsetLocal
  
  const dataBrasil = new Date(agora.getTime() + (diferencaMinutos * 60 * 1000))
  return dataBrasil
}

/**
 * Obtém apenas a data (sem horário) no timezone do Brasil
 */
export function getDataBrasil(): Date {
  const dataBrasil = getDataAtualBrasil()
  // Zera o horário para obter apenas a data
  dataBrasil.setHours(0, 0, 0, 0)
  return dataBrasil
}

/**
 * Obtém a data de ontem no horário do Brasil
 */
export function getOntemBrasil(): Date {
  const ontem = getDataBrasil()
  ontem.setDate(ontem.getDate() - 1)
  return ontem
}

/**
 * Converte uma data para string no formato YYYY-MM-DD considerando timezone do Brasil
 */
export function formatarDataBrasil(data: Date): string {
  const dataBrasil = new Date(data.getTime())
  // Ajusta para timezone do Brasil se necessário
  const ano = dataBrasil.getFullYear()
  const mes = String(dataBrasil.getMonth() + 1).padStart(2, '0')
  const dia = String(dataBrasil.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Cria uma data a partir de string YYYY-MM-DD no contexto do Brasil
 */
export function criarDataBrasil(dataStr: string): Date {
  // Cria a data assumindo o horário do Brasil (evita problemas de timezone)
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-based months
  return data
}

/**
 * Obtém informações de debug sobre timezones
 */
export function getInfoTimezone() {
  const agora = new Date()
  const dataBrasil = getDataAtualBrasil()
  
  return {
    dataUTC: agora.toISOString(),
    dataBrasil: dataBrasil.toISOString(),
    offsetLocal: agora.getTimezoneOffset(),
    offsetBrasil: -180, // UTC-3 em minutos
    dataAtualBrasil: formatarDataBrasil(dataBrasil),
    ontemBrasil: formatarDataBrasil(getOntemBrasil())
  }
} 