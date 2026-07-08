import type { Database } from '@/lib/supabase/database.types'

export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']
export type CondicionIva = Database['public']['Tables']['condiciones_iva']['Row']

/**
 * Forma que usa el formulario de Alta/Modificación. No es 1:1 con la fila
 * de la base: separa lo que el usuario tipea de lo que la base de datos
 * exige, para poder validar antes de armar el Insert/Update real.
 */
export interface ClienteFormValues {
  nombre_apellido: string
  factura_config: 'siempre' | 'nunca' | 'preguntar'
  razon_social: string
  cuit: string
  condicion_iva_id: string
  domicilio_fiscal: string
  email: string
}

export const CLIENTE_FORM_VACIO: ClienteFormValues = {
  nombre_apellido: '',
  factura_config: 'preguntar',
  razon_social: '',
  cuit: '',
  condicion_iva_id: '',
  domicilio_fiscal: '',
  email: ''
}

export function clienteAFormValues(cliente: Cliente): ClienteFormValues {
  return {
    nombre_apellido: cliente.nombre_apellido,
    factura_config: cliente.factura_config,
    razon_social: cliente.razon_social ?? '',
    cuit: cliente.cuit ?? '',
    condicion_iva_id: cliente.condicion_iva_id ?? '',
    domicilio_fiscal: cliente.domicilio_fiscal ?? '',
    email: cliente.email ?? ''
  }
}

// ---- Deuda (Cuenta Corriente) --------------------------------------------
// Gemela de `Compra` (modules/proveedores/types.ts) — mismo patrón, campo
// propio (`origen`) porque acá sí hace falta. Ver
// docs/sistemas/cuenta-corriente-arquitectura-compartida.md.

export type Deuda = Database['public']['Tables']['deudas_clientes']['Row']
export type OrigenDeuda = Deuda['origen']

/** Decisión aprobada (6.1): el origen de una deuda no se limita a una venta. */
export const ETIQUETAS_ORIGEN_DEUDA: Record<OrigenDeuda, string> = {
  cuenta_mes: 'Cuenta del mes',
  venta: 'Venta',
  factura: 'Factura',
  otro: 'Otro'
}

export interface DeudaFormValues {
  origen: OrigenDeuda
  descripcion: string
  numero_comprobante: string
  monto: number | null
  fecha: string // ISO yyyy-mm-dd
}

export function valoresDeudaVacio(hoyISO: string): DeudaFormValues {
  return { origen: 'cuenta_mes', descripcion: '', numero_comprobante: '', monto: null, fecha: hoyISO }
}

/** "DEU-000001" — mismo criterio que MOV-/COMP-/AJ- (no reemplaza al id). */
export function formatearNumeroDeuda(numeroInterno: number, prefijo = 'DEU-'): string {
  return `${prefijo}${String(numeroInterno).padStart(6, '0')}`
}
