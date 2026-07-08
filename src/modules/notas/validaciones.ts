import { hayErrores } from '@/core/lib/validacion'
import type { NotaFormValues } from './types'

export type ErroresNota = Partial<Record<'titulo', string>>

export function validarNota(valores: NotaFormValues): ErroresNota {
  const errores: ErroresNota = {}
  if (!valores.titulo.trim()) {
    errores.titulo = 'Este dato es obligatorio.'
  }
  return errores
}

export { hayErrores }
