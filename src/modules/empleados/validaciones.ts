import type { EmpleadoFormValues, DocumentoFormValues, PagoEmpleadoFormValues } from './types'

export type ErroresEmpleado = Partial<Record<keyof EmpleadoFormValues, string>>
export type ErroresDocumento = Partial<Record<keyof DocumentoFormValues, string>>
export type ErroresPagoEmpleado = Partial<Record<keyof PagoEmpleadoFormValues, string>>

import { hoyISO } from '@/core/lib/format'
export { hoyISO }

export { hayErrores } from '@/core/lib/validacion'

export function validarEmpleado(valores: EmpleadoFormValues): ErroresEmpleado {
  const errores: ErroresEmpleado = {}
  if (!valores.nombre_apellido.trim()) {
    errores.nombre_apellido = 'Este dato es obligatorio.'
  }
  if (valores.valor !== null && valores.valor <= 0) {
    errores.valor = 'Tiene que ser mayor a cero.'
  }
  return errores
}

export function validarDocumento(valores: DocumentoFormValues): ErroresDocumento {
  const errores: ErroresDocumento = {}
  if (!valores.tipo_documento) {
    errores.tipo_documento = 'Elegí un tipo de documento.'
  }
  if (valores.tipo_documento === 'otro' && !valores.descripcion_otro.trim()) {
    errores.descripcion_otro = 'Describí de qué documento se trata.'
  }
  return errores
}

export function validarPagoEmpleado(valores: PagoEmpleadoFormValues): ErroresPagoEmpleado {
  const errores: ErroresPagoEmpleado = {}
  if (valores.monto === null || valores.monto <= 0) {
    errores.monto = 'Ingresá un monto mayor a cero.'
  }
  if (!valores.fecha) {
    errores.fecha = 'Este dato es obligatorio.'
  } else if (valores.fecha > hoyISO()) {
    errores.fecha = 'La fecha no puede ser futura.'
  }
  if (!valores.concepto.trim()) {
    errores.concepto = 'Este dato es obligatorio.'
  }
  if (valores.descuento !== null) {
    if (valores.descuento <= 0) {
      errores.descuento = 'Tiene que ser mayor a cero.'
    } else if (valores.monto !== null && valores.descuento >= valores.monto) {
      errores.descuento = 'No puede ser mayor o igual al monto.'
    }
    if (!valores.motivoDescuento.trim()) {
      errores.motivoDescuento = 'Contá brevemente el motivo del descuento.'
    }
  }
  return errores
}
