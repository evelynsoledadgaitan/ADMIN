import { normalizarCuit, validarDigitoVerificadorCuit } from '@/core/lib/cuit'
import type { ClienteFormValues, DeudaFormValues } from './types'

export type ErroresCliente = Partial<Record<keyof ClienteFormValues, string>>
export type ErroresDeuda = Partial<Record<keyof DeudaFormValues, string>>

const REGEX_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export { normalizarCuit }

/**
 * Validación de formulario del módulo Clientes (Sprint 2, sección 5 y 4.1
 * del documento de arquitectura, aprobadas). Espeja en el frontend lo
 * mismo que la migración 0009 exige en la base de datos — acá para dar
 * feedback inmediato campo por campo; en la base, como última defensa.
 *
 * Bloque 1 (validación real de CUIT): antes solo se comprobaba longitud
 * (11 dígitos) — ahora se valida el dígito verificador real (módulo 11,
 * `core/lib/cuit.ts`, compartida con Proveedores). Sigue sin confirmar
 * que el CUIT exista en AFIP/ARCA — eso queda fuera del alcance del
 * proyecto (decisión 0025).
 */
export function validarCliente(valores: ClienteFormValues): ErroresCliente {
  const errores: ErroresCliente = {}

  if (!valores.nombre_apellido.trim()) {
    errores.nombre_apellido = 'Este dato es obligatorio.'
  }

  if (valores.email.trim() && !REGEX_EMAIL.test(valores.email.trim())) {
    errores.email = 'El email no tiene un formato válido.'
  }

  const cuitNormalizado = normalizarCuit(valores.cuit)
  if (cuitNormalizado && !validarDigitoVerificadorCuit(cuitNormalizado)) {
    errores.cuit = 'El CUIT no es válido.'
  }

  // Regla aprobada 4.1: solo "Siempre factura" exige los datos de facturación.
  if (valores.factura_config === 'siempre') {
    if (!valores.razon_social.trim()) errores.razon_social = 'Obligatorio cuando siempre factura.'
    if (!cuitNormalizado) errores.cuit = 'Obligatorio cuando siempre factura.'
    else if (!validarDigitoVerificadorCuit(cuitNormalizado)) errores.cuit = 'El CUIT no es válido.'
    if (!valores.condicion_iva_id) errores.condicion_iva_id = 'Obligatorio cuando siempre factura.'
  }

  return errores
}

export { hayErrores } from '@/core/lib/validacion'

/** Misma fecha de hoy en ISO que usa el resto de la app (Motor de Pagos, Compras, Ajustes). */
import { hoyISO } from '@/core/lib/format'
export { hoyISO }

/**
 * Validación de "Registrar deuda" — gemela de validarCompra
 * (modules/proveedores/validaciones.ts): descripción obligatoria, monto
 * > 0, fecha no futura. El origen siempre tiene un valor por default
 * ("Cuenta del mes"), así que no hace falta validarlo aparte.
 */
export function validarDeuda(valores: DeudaFormValues): ErroresDeuda {
  const errores: ErroresDeuda = {}

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
