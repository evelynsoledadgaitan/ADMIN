import { normalizarCuit, validarDigitoVerificadorCuit } from '@/core/lib/cuit'
import { hoyISO } from '@/modules/pagos/validaciones'
import type { ProveedorFormValues, CompraFormValues } from './types'

export type ErroresProveedor = Partial<Record<keyof ProveedorFormValues, string>>
export type ErroresCompra = Partial<Record<keyof CompraFormValues, string>>

/**
 * Validación del formulario de Alta/Modificación de proveedor (Sprint 4).
 * Bloque 1: CUIT validado con dígito verificador real (módulo 11,
 * `core/lib/cuit.ts`, compartida con Clientes) — antes solo se
 * comprobaba longitud.
 */
export function validarProveedor(valores: ProveedorFormValues): ErroresProveedor {
  const errores: ErroresProveedor = {}

  if (!valores.nombre.trim()) {
    errores.nombre = 'Este dato es obligatorio.'
  }

  const cuitNormalizado = normalizarCuit(valores.cuit)
  if (cuitNormalizado && !validarDigitoVerificadorCuit(cuitNormalizado)) {
    errores.cuit = 'El CUIT no es válido.'
  }

  return errores
}

/**
 * Validación del formulario de Registrar compra (decisiones aprobadas,
 * Sprint 4, puntos 4 y 5): descripción obligatoria, monto > 0, fecha no
 * futura — mismo criterio que el Motor de Pagos.
 */
export function validarCompra(valores: CompraFormValues): ErroresCompra {
  const errores: ErroresCompra = {}

  if (!valores.descripcion.trim()) {
    errores.descripcion = 'Este dato es obligatorio.'
  }

  if (valores.monto === null || valores.monto <= 0) {
    errores.monto = 'Ingresá un monto mayor a cero.'
  }

  if (!valores.fecha) {
    errores.fecha = 'Este dato es obligatorio.'
  } else if (valores.fecha > hoyISO()) {
    errores.fecha = 'La fecha no puede ser futura.'
  }

  return errores
}

export { hayErrores } from '@/core/lib/validacion'
