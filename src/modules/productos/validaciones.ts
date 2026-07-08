import type { ProductoFormValues } from './types'

export type ErroresProducto = Partial<Record<keyof ProductoFormValues, string>>

/**
 * Validación del formulario de Alta/Modificación manual de producto
 * (Sprint 5). Categoría obligatoria SOLO acá — en la importación queda
 * opcional a propósito (decisión aprobada, punto 5).
 */
export function validarProducto(valores: ProductoFormValues): ErroresProducto {
  const errores: ErroresProducto = {}

  if (!valores.codigo_barras.trim()) {
    errores.codigo_barras = 'Este dato es obligatorio.'
  }
  if (!valores.nombre.trim()) {
    errores.nombre = 'Este dato es obligatorio.'
  }
  if (!valores.categoria_id) {
    errores.categoria_id = 'Este dato es obligatorio.'
  }
  if (valores.precio === null || valores.precio <= 0) {
    errores.precio = 'Ingresá un precio mayor a cero.'
  }

  return errores
}

export { hayErrores } from '@/core/lib/validacion'
