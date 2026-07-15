import type { Database } from '@/lib/supabase/database.types'

export type Cheque = Database['public']['Tables']['cheques']['Row']
export type EstadoCheque = Cheque['estado']

export const ETIQUETAS_ESTADO_CHEQUE: Record<EstadoCheque, string> = {
  en_cartera: 'En cartera',
  disponible: 'Disponible',
  entregado: 'Entregado',
  depositado: 'Depositado',
  acreditado: 'Acreditado',
  rechazado: 'Rechazado',
  anulado: 'Anulado'
}

/**
 * Ya no pide cliente al cargarlo — un cheque entra a la cartera solo, sin
 * dueño todavía (decisión aprobada, ver
 * docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md). Se vincula a
 * un cliente recién cuando se lo elige como medio de pago en un cobro real.
 */
export interface ChequeFormValues {
  banco: string
  numero: string
  importe: number | null
  titular: string
  cuit: string
  fecha_emision: string // ISO yyyy-mm-dd
  fecha_vencimiento: string
  observaciones: string
}

export function valoresChequeVacio(hoyISO: string): ChequeFormValues {
  return {
    banco: '',
    numero: '',
    importe: null,
    titular: '',
    cuit: '',
    fecha_emision: hoyISO,
    fecha_vencimiento: hoyISO,
    observaciones: ''
  }
}
