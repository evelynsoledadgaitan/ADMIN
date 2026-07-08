import type { Database } from '@/lib/supabase/database.types'

export type TipoEntidadCC = 'cliente' | 'proveedor'

export type Ajuste = Database['public']['Tables']['ajustes_cuenta']['Row']

export interface AjusteFormValues {
  monto: number | null // con signo — positivo o negativo (decisión aprobada 6.3)
  motivo: string        // siempre obligatorio (6.5)
  fecha: string          // ISO yyyy-mm-dd
}

export function valoresAjusteVacio(hoyISO: string): AjusteFormValues {
  return { monto: null, motivo: '', fecha: hoyISO }
}

/** "AJ-000001" — mismo criterio que MOV-/COMP- (no reemplaza al id, es para consultas y soporte). */
export function formatearNumeroAjuste(numeroInterno: number, prefijo = 'AJ-'): string {
  return `${prefijo}${String(numeroInterno).padStart(6, '0')}`
}
