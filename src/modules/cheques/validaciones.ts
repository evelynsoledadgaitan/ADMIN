import { hayErrores } from '@/core/lib/validacion'
import { hoyISO } from '@/core/lib/format'
import type { ChequeFormValues } from './types'

export type ErroresCheque = Partial<Record<keyof ChequeFormValues, string>>

export function validarCheque(valores: ChequeFormValues): ErroresCheque {
  const errores: ErroresCheque = {}
  if (!valores.banco.trim()) errores.banco = 'Este dato es obligatorio.'
  if (!valores.numero.trim()) errores.numero = 'Este dato es obligatorio.'
  if (!valores.titular.trim()) errores.titular = 'Este dato es obligatorio.'
  if (valores.importe === null || valores.importe <= 0) errores.importe = 'Ingresá un importe mayor a cero.'
  if (!valores.fecha_emision) errores.fecha_emision = 'Este dato es obligatorio.'
  else if (valores.fecha_emision > hoyISO()) errores.fecha_emision = 'La fecha de emisión no puede ser futura.'
  if (!valores.fecha_vencimiento) errores.fecha_vencimiento = 'Este dato es obligatorio.'
  else if (valores.fecha_vencimiento < valores.fecha_emision) errores.fecha_vencimiento = 'No puede ser anterior a la fecha de emisión.'
  return errores
}

export { hayErrores }
