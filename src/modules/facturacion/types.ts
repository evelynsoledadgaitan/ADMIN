import type { Database } from '@/lib/supabase/database.types'

export type Factura = Database['public']['Tables']['facturas']['Row']
export type FacturaItem = Database['public']['Tables']['factura_items']['Row']
export type EstadoFactura = Factura['estado']
export type TasaIva = FacturaItem['iva']

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
 * El usuario carga el precio final de cada línea (el subtotal ya incluye
 * IVA, como cualquier precio de venta al público) — Neto e importe de
 * IVA se derivan siempre de acá, nunca se guardan (mismo criterio que
 * saldo_cliente(): si se puede calcular, no se persiste).
 */
function calcularNetoEIva(subtotalConIva: number, iva: TasaIva): { neto: number; importeIva: number } {
  const porcentaje = PORCENTAJE_IVA[iva]
  if (porcentaje === 0) return { neto: subtotalConIva, importeIva: 0 }
  const neto = subtotalConIva / (1 + porcentaje / 100)
  return { neto, importeIva: subtotalConIva - neto }
}

export interface DesgloseIva {
  tasa: TasaIva
  neto: number
  importeIva: number
  subtotalConIva: number
}

/**
 * IVA por línea (decisión aprobada — ver docs/sistemas/iva-por-linea-diseno.md):
 * agrupa las líneas por tasa y desarma cada grupo en Neto + IVA. Con una
 * sola tasa en toda la factura, el resultado tiene un solo grupo — se ve
 * igual que el Neto/IVA/Total de siempre. Con varias tasas mezcladas, un
 * grupo por tasa — la forma correcta de discriminar IVA en una factura
 * real. El orden de salida es siempre el mismo (Exento, 10,5%, 21%,
 * 27%), sin importar en qué orden se cargaron las líneas.
 */
export function calcularDesgloseIva(items: { subtotal: number; iva: TasaIva }[]): DesgloseIva[] {
  const orden: TasaIva[] = ['exento', '10.5', '21', '27']
  const grupos = new Map<TasaIva, number>()
  for (const item of items) {
    grupos.set(item.iva, (grupos.get(item.iva) ?? 0) + item.subtotal)
  }
  return orden
    .filter((tasa) => grupos.has(tasa))
    .map((tasa) => {
      const subtotalConIva = grupos.get(tasa) as number
      const { neto, importeIva } = calcularNetoEIva(subtotalConIva, tasa)
      return { tasa, neto, importeIva, subtotalConIva }
    })
}

/**
 * Una línea en el formulario — puede venir de un producto del catálogo
 * (`producto_id` presente) o ser un concepto libre tipeado a mano
 * (`producto_id: null`), incluso mezclando ambos tipos en la misma
 * factura (decisión aprobada). `descripcion` y `precio_unitario` viajan
 * editables aunque hayan salido de un producto — el usuario puede
 * ajustarlos antes de guardar; una vez guardada la factura, quedan fijos
 * para siempre (ver migración 0033). `iva` es propio de cada línea desde
 * la migración 0055 — antes era un solo valor para toda la factura.
 */
export interface FacturaItemFormValues {
  /** Id local (crypto.randomUUID(), no el id real de la fila) — solo para el key de React y poder editar/quitar la línea correcta en la lista. */
  idLocal: string
  producto_id: string | null
  descripcion: string
  cantidad: number | null
  precio_unitario: number | null
  iva: TasaIva
}

/**
 * Una línea nueva hereda la tasa de la anterior (decisión aprobada — más
 * práctico para cargar varios artículos iguales seguidos, sin elegir la
 * misma tasa una y otra vez). La primera línea de una factura nueva
 * arranca en "Exento", como siempre.
 */
export function nuevaLineaVacia(tasaHeredada: TasaIva = 'exento'): FacturaItemFormValues {
  return { idLocal: crypto.randomUUID(), producto_id: null, descripcion: '', cantidad: 1, precio_unitario: null, iva: tasaHeredada }
}

export interface FacturaFormValues {
  cliente_id: string
  fecha: string // ISO yyyy-mm-dd
  nota: string
  items: FacturaItemFormValues[]
}

export function valoresFacturaVacio(hoyISO: string, clienteId?: string): FacturaFormValues {
  return {
    cliente_id: clienteId ?? '',
    fecha: hoyISO,
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
