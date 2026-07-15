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

/**
 * Transferencia entre cuentas — herramienta general para aplicar el
 * saldo a favor de un cliente a la deuda de otro (decisión aprobada,
 * ver docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md). Por
 * dentro, dos Ajustes con signo opuesto — no un mecanismo nuevo de
 * cálculo de saldo.
 */
export type Transferencia = Database['public']['Tables']['transferencias_cuenta']['Row']

export interface TransferenciaFormValues {
  destino_cliente_id: string
  importe: number | null
  fecha: string
  motivo: string // opcional, pero recomendado (decisión aprobada)
}

export function valoresTransferenciaVacio(hoyISO: string): TransferenciaFormValues {
  return { destino_cliente_id: '', importe: null, fecha: hoyISO, motivo: '' }
}

/** "TR-000001" — mismo criterio que el resto de las numeraciones. */
export function formatearNumeroTransferencia(numeroInterno: number, prefijo = 'TR-'): string {
  return `${prefijo}${String(numeroInterno).padStart(6, '0')}`
}
