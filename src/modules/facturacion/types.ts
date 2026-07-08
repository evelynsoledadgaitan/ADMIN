import type { Database } from '@/lib/supabase/database.types'

export type Factura = Database['public']['Tables']['facturas']['Row']
export type FacturaItem = Database['public']['Tables']['factura_items']['Row']
export type EstadoFactura = Factura['estado']
export type TasaIva = Factura['iva']

/** "FAC-000001" — correlativo simple, sin reiniciar por año (decisión aprobada). Referencia técnica interna, siempre visible aunque exista un número real de ARCA. */
export function formatearNumeroFactura(numeroInterno: number, prefijo = 'FAC-'): string {
  return `${prefijo}${String(numeroInterno).padStart(6, '0')}`
}

export const ETIQUETAS_ESTADO_FACTURA: Record<EstadoFactura, string> = {
  pendiente_emitir: 'Pendiente de emitir',
  emitida: 'Emitida'
}

export const ETIQUETAS_IVA: Record<TasaIva, string> = {
  exento: 'Exento',
  '10.5': '10,5 %',
  '21': '21 %',
  '27': '27 %'
}

const PORCENTAJE_IVA: Record<TasaIva, number> = {
  exento: 0,
  '10.5': 10.5,
  '21': 21,
  '27': 27
}

/**
 * El usuario carga el precio final (el total ya incluye IVA, como
 * cualquier precio de venta al público) — Neto e importe de IVA se
 * derivan siempre de acá, nunca se guardan (mismo criterio que
 * saldo_cliente(): si se puede calcular, no se persiste).
 */
export function calcularNetoEIva(total: number, iva: TasaIva): { neto: number; importeIva: number } {
  const porcentaje = PORCENTAJE_IVA[iva]
  if (porcentaje === 0) return { neto: total, importeIva: 0 }
  const neto = total / (1 + porcentaje / 100)
  return { neto, importeIva: total - neto }
}

/**
 * Una línea en el formulario — puede venir de un producto del catálogo
 * (`producto_id` presente) o ser un concepto libre tipeado a mano
 * (`producto_id: null`), incluso mezclando ambos tipos en la misma
 * factura (decisión aprobada). `descripcion` y `precio_unitario` viajan
 * editables aunque hayan salido de un producto — el usuario puede
 * ajustarlos antes de guardar; una vez guardada la factura, quedan fijos
 * para siempre (ver migración 0033).
 */
export interface FacturaItemFormValues {
  /** Id local (crypto.randomUUID(), no el id real de la fila) — solo para el key de React y poder editar/quitar la línea correcta en la lista. */
  idLocal: string
  producto_id: string | null
  descripcion: string
  cantidad: number | null
  precio_unitario: number | null
}

export function nuevaLineaVacia(): FacturaItemFormValues {
  return { idLocal: crypto.randomUUID(), producto_id: null, descripcion: '', cantidad: 1, precio_unitario: null }
}

export interface FacturaFormValues {
  cliente_id: string
  fecha: string // ISO yyyy-mm-dd
  iva: TasaIva
  nota: string
  items: FacturaItemFormValues[]
}

export function valoresFacturaVacio(hoyISO: string, clienteId?: string): FacturaFormValues {
  return {
    cliente_id: clienteId ?? '',
    fecha: hoyISO,
    iva: 'exento',
    nota: '',
    items: [nuevaLineaVacia()]
  }
}

export function subtotalLinea(item: FacturaItemFormValues): number {
  return (item.cantidad ?? 0) * (item.precio_unitario ?? 0)
}

export function totalFactura(items: FacturaItemFormValues[]): number {
  return items.reduce((acc, item) => acc + subtotalLinea(item), 0)
}
