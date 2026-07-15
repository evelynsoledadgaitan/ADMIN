import type { Database } from '@/lib/supabase/database.types'

export type Movimiento = Database['public']['Tables']['movimientos']['Row']
export type MedioPago = Database['public']['Tables']['medios_pago']['Row']
export type TipoMovimiento = 'cobro' | 'pago'

/**
 * Una línea de un cobro/pago compuesto — decisión aprobada, ver
 * docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md. Mismo
 * criterio visual que las líneas de una factura: cada una con su propio
 * medio de pago y su monto. Cuando el medio elegido es "Cheque", el
 * monto no se tipea — se completa solo con el importe del cheque
 * elegido de la cartera (un cheque no se puede usar "a medias").
 */
export interface LineaMovimiento {
  idLocal: string
  medio_pago_id: string
  monto: number | null
  /** Solo cuando el medio de pago elegido es "Cheque". */
  cheque_id: string | null
}

export interface MovimientoCompuestoFormValues {
  fecha: string // ISO yyyy-mm-dd
  nota: string
  lineas: LineaMovimiento[]
}

export function nuevaLineaMovimientoVacia(): LineaMovimiento {
  return { idLocal: crypto.randomUUID(), medio_pago_id: '', monto: null, cheque_id: null }
}

export function valoresMovimientoCompuestoVacio(hoyISO: string): MovimientoCompuestoFormValues {
  return { fecha: hoyISO, nota: '', lineas: [nuevaLineaMovimientoVacia()] }
}

export function totalMovimientoCompuesto(lineas: LineaMovimiento[]): number {
  return lineas.reduce((acc, l) => acc + (l.monto ?? 0), 0)
}

/** "MOV-000001" — referencia legible para el usuario, no reemplaza al id. */
export function formatearNumeroMovimiento(numeroInterno: number, prefijo = 'MOV-'): string {
  return `${prefijo}${String(numeroInterno).padStart(6, '0')}`
}
