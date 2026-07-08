import type { MovimientoFormValues } from './types'

export type ErroresMovimiento = Partial<Record<keyof MovimientoFormValues, string>>

/** Fecha de hoy en formato ISO (yyyy-mm-dd), en la zona horaria local del dispositivo. */
import { hoyISO } from '@/core/lib/format'
export { hoyISO }

/**
 * Validación del formulario de Registrar cobro/pago (Sprint 3, sección 9 y
 * punto 4 de las decisiones aprobadas). Espeja en el frontend lo que la
 * migración 0012 exige en la base de datos.
 */
export function validarMovimiento(valores: MovimientoFormValues): ErroresMovimiento {
  const errores: ErroresMovimiento = {}

  if (valores.monto === null || valores.monto <= 0) {
    errores.monto = 'Ingresá un monto mayor a cero.'
  }

  if (!valores.fecha) {
    errores.fecha = 'Este dato es obligatorio.'
  } else if (valores.fecha > hoyISO()) {
    errores.fecha = 'La fecha no puede ser futura.'
  }

  if (!valores.medio_pago_id) {
    errores.medio_pago_id = 'Seleccioná un medio de pago.'
  }

  return errores
}

export function hayErrores(errores: ErroresMovimiento): boolean {
  return Object.keys(errores).length > 0
}
