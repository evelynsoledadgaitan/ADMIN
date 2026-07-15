import { hoyISO } from '@/core/lib/format'
import type { MovimientoCompuestoFormValues, LineaMovimiento } from './types'

export type ErroresLinea = Partial<Record<'medio_pago_id' | 'monto', string>>
export interface ErroresMovimientoCompuesto {
  fecha?: string
  porLinea: Record<string, ErroresLinea> // idLocal -> errores
}

export { hoyISO }

/**
 * Validación del formulario de Registrar cobro/pago — ahora compuesto
 * (varias líneas, decisión aprobada). Cada línea exige medio de pago y
 * un monto mayor a cero — salvo que el medio elegido sea "Cheque", donde
 * el monto se completa solo al elegir el cheque (ver `nombreMedioCheque`
 * en api.ts) y lo que se valida en cambio es que haya un cheque elegido.
 */
export function validarMovimientoCompuesto(
  valores: MovimientoCompuestoFormValues,
  idMedioPagoCheque: string | null
): ErroresMovimientoCompuesto {
  const errores: ErroresMovimientoCompuesto = { porLinea: {} }

  if (!valores.fecha) {
    errores.fecha = 'Este dato es obligatorio.'
  } else if (valores.fecha > hoyISO()) {
    errores.fecha = 'La fecha no puede ser futura.'
  }

  for (const linea of valores.lineas) {
    const erroresLinea: ErroresLinea = {}
    if (!linea.medio_pago_id) {
      erroresLinea.medio_pago_id = 'Elegí un medio de pago.'
    } else if (linea.medio_pago_id === idMedioPagoCheque) {
      if (!linea.cheque_id) erroresLinea.monto = 'Elegí un cheque de la cartera.'
    } else if (linea.monto === null || linea.monto <= 0) {
      erroresLinea.monto = 'Ingresá un monto mayor a cero.'
    }
    if (Object.keys(erroresLinea).length > 0) errores.porLinea[linea.idLocal] = erroresLinea
  }

  return errores
}

export function hayErroresMovimiento(errores: ErroresMovimientoCompuesto): boolean {
  return !!errores.fecha || Object.keys(errores.porLinea).length > 0
}

export function lineaValida(linea: LineaMovimiento, idMedioPagoCheque: string | null): boolean {
  if (!linea.medio_pago_id) return false
  if (linea.medio_pago_id === idMedioPagoCheque) return !!linea.cheque_id
  return linea.monto !== null && linea.monto > 0
}
