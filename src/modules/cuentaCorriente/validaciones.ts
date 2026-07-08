import type { AjusteFormValues } from './types'

export type ErroresAjuste = Partial<Record<keyof AjusteFormValues, string>>

/** Misma fecha de hoy en ISO que ya usa el Motor de Pagos — mismo criterio en toda la app. */
import { hoyISO } from '@/core/lib/format'
export { hoyISO }

/**
 * Validación del Ajuste — compartida entre Clientes y Proveedores (es
 * exactamente la misma regla para los dos). Motivo siempre obligatorio
 * (decisión aprobada 6.5, sin excepción — a diferencia del motivo de
 * anulación, que es opcional en el resto del sistema).
 */
export function validarAjuste(valores: AjusteFormValues): ErroresAjuste {
  const errores: ErroresAjuste = {}

  if (valores.monto === null || valores.monto === 0) {
    errores.monto = 'Ingresá un importe distinto de cero (positivo o negativo).'
  }

  if (!valores.motivo.trim()) {
    errores.motivo = 'El motivo es obligatorio.'
  }

  if (!valores.fecha) {
    errores.fecha = 'Este dato es obligatorio.'
  } else if (valores.fecha > hoyISO()) {
    errores.fecha = 'La fecha no puede ser futura.'
  }

  return errores
}

export { hayErrores } from '@/core/lib/validacion'
