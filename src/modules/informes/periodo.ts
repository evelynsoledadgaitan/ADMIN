/**
 * Filtro de período compartido por todos los informes que representan
 * "actividad dentro de un rango" (no por los de saldo, que son una foto
 * del momento actual — ver docs/sistemas/informes-diseno.md, sección 3).
 */

export type TipoPeriodo = 'hoy' | 'semana' | 'mes' | 'mes_anterior' | 'anio' | 'anio_anterior' | 'personalizado'

export interface RangoFechas {
  desde: string // ISO yyyy-mm-dd
  hasta: string
}

export const ETIQUETAS_PERIODO: Record<TipoPeriodo, string> = {
  hoy: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes',
  mes_anterior: 'Mes anterior',
  anio: 'Este año',
  anio_anterior: 'Año anterior',
  personalizado: 'Rango personalizado'
}

function hoyISO(): string {
  const hoy = new Date()
  const offset = hoy.getTimezoneOffset()
  return new Date(hoy.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function aISO(fecha: Date): string {
  const offset = fecha.getTimezoneOffset()
  return new Date(fecha.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

/**
 * Siempre termina hoy (nunca en el futuro) — "esta semana/mes/año" mira
 * hacia atrás desde hoy, no el período calendario completo. "Mes/Año
 * anterior" son la excepción a propósito: ahí sí se pide el período
 * calendario completo ya cerrado (ej. todo junio, no "los últimos 30
 * días"), porque es lo que tiene sentido para comparar contra un mes
 * que ya terminó.
 */
export function calcularRango(tipo: TipoPeriodo, personalizado?: RangoFechas): RangoFechas {
  const hoy = hoyISO()

  if (tipo === 'hoy') return { desde: hoy, hasta: hoy }

  if (tipo === 'semana') {
    const fecha = new Date()
    const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay() // lunes=1 ... domingo=7
    fecha.setDate(fecha.getDate() - (diaSemana - 1))
    return { desde: aISO(fecha), hasta: hoy }
  }

  if (tipo === 'mes') {
    const fecha = new Date()
    fecha.setDate(1)
    return { desde: aISO(fecha), hasta: hoy }
  }

  if (tipo === 'mes_anterior') {
    const hoyDate = new Date()
    const inicioMesAnterior = new Date(hoyDate.getFullYear(), hoyDate.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 0)
    return { desde: aISO(inicioMesAnterior), hasta: aISO(finMesAnterior) }
  }

  if (tipo === 'anio') {
    const fecha = new Date()
    fecha.setMonth(0, 1)
    return { desde: aISO(fecha), hasta: hoy }
  }

  if (tipo === 'anio_anterior') {
    const anioAnterior = new Date().getFullYear() - 1
    return { desde: `${anioAnterior}-01-01`, hasta: `${anioAnterior}-12-31` }
  }

  return personalizado ?? { desde: hoy, hasta: hoy }
}

export function fechaEnRango(fecha: string, rango: RangoFechas): boolean {
  return fecha >= rango.desde && fecha <= rango.hasta
}
