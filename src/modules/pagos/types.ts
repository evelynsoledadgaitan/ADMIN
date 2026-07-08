import type { Database } from '@/lib/supabase/database.types'

export type Movimiento = Database['public']['Tables']['movimientos']['Row']
export type MedioPago = Database['public']['Tables']['medios_pago']['Row']
export type TipoMovimiento = 'cobro' | 'pago'

export interface MovimientoFormValues {
  monto: number | null
  fecha: string // ISO yyyy-mm-dd
  medio_pago_id: string
  nota: string
}

export function valoresMovimientoVacio(hoyISO: string): MovimientoFormValues {
  return { monto: null, fecha: hoyISO, medio_pago_id: '', nota: '' }
}

/** "MOV-000001" — referencia legible para el usuario, no reemplaza al id. */
export function formatearNumeroMovimiento(numeroInterno: number, prefijo = 'MOV-'): string {
  return `${prefijo}${String(numeroInterno).padStart(6, '0')}`
}
