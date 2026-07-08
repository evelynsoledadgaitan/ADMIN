import type { FacturaFormValues, FacturaItemFormValues } from './types'

export interface ErroresFactura {
  cliente_id?: string
  fecha?: string
  items?: string // error general de la lista (ej. "agregá al menos una línea")
  porLinea: Record<string, Partial<Record<'descripcion' | 'cantidad' | 'precio_unitario', string>>>
}

/** Misma fecha de hoy en ISO que usa el resto de la app. */
import { hoyISO } from '@/core/lib/format'
export { hoyISO }

function validarLinea(item: FacturaItemFormValues) {
  const errores: Partial<Record<'descripcion' | 'cantidad' | 'precio_unitario', string>> = {}
  if (!item.descripcion.trim()) errores.descripcion = 'Este dato es obligatorio.'
  if (item.cantidad === null || item.cantidad <= 0) errores.cantidad = 'Tiene que ser mayor a cero.'
  if (item.precio_unitario === null || item.precio_unitario <= 0) errores.precio_unitario = 'Tiene que ser mayor a cero.'
  return errores
}

/**
 * Validación de Nueva factura: cliente obligatorio, al menos una línea
 * completa. Cada línea se valida individualmente (mismo criterio que un
 * producto o una deuda) — descripción, cantidad y precio unitario, sea
 * la línea de un producto del catálogo o un concepto libre.
 */
export function validarFactura(valores: FacturaFormValues): ErroresFactura {
  const errores: ErroresFactura = { porLinea: {} }

  if (!valores.cliente_id) errores.cliente_id = 'Elegí un cliente.'
  if (!valores.fecha) errores.fecha = 'Este dato es obligatorio.'
  else if (valores.fecha > hoyISO()) errores.fecha = 'La fecha no puede ser futura.'

  if (valores.items.length === 0) {
    errores.items = 'Agregá al menos una línea.'
  } else {
    for (const item of valores.items) {
      const erroresLinea = validarLinea(item)
      if (Object.keys(erroresLinea).length > 0) {
        errores.porLinea[item.idLocal] = erroresLinea
      }
    }
  }

  return errores
}

export function hayErroresFactura(errores: ErroresFactura): boolean {
  return !!errores.cliente_id || !!errores.fecha || !!errores.items || Object.keys(errores.porLinea).length > 0
}
