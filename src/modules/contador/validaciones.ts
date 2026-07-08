import type { VencimientoFormValues, DocumentoContadorFormValues } from './types'

export type ErroresVencimiento = Partial<Record<keyof VencimientoFormValues, string>>
export type ErroresDocumentoContador = Partial<Record<keyof DocumentoContadorFormValues, string>>

export { hoyISO } from '@/core/lib/format'

export { hayErrores } from '@/core/lib/validacion'

export function validarVencimiento(valores: VencimientoFormValues): ErroresVencimiento {
  const errores: ErroresVencimiento = {}
  if (!valores.concepto.trim()) {
    errores.concepto = 'Este dato es obligatorio.'
  }
  if (valores.monto !== null && valores.monto <= 0) {
    errores.monto = 'Tiene que ser mayor a cero.'
  }
  if (!valores.fecha_vencimiento) {
    errores.fecha_vencimiento = 'Este dato es obligatorio.'
  }
  return errores
}

export function validarDocumentoContador(valores: DocumentoContadorFormValues): ErroresDocumentoContador {
  const errores: ErroresDocumentoContador = {}
  if (!valores.tipo_documento) {
    errores.tipo_documento = 'Elegí un tipo de documento.'
  }
  if (valores.tipo_documento === 'otro' && !valores.descripcion_otro.trim()) {
    errores.descripcion_otro = 'Describí de qué documento se trata.'
  }
  return errores
}
