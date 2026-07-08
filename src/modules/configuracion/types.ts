import type { Database } from '@/lib/supabase/database.types'

export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Permiso = Database['public']['Tables']['permisos']['Row']

/** Los mismos módulos que ya reconoce el motor de permisos (usePermissions.ts) — sin duplicar la lista acá. */
export const MODULOS_CON_PERMISO = [
  'clientes', 'proveedores', 'productos', 'cheques', 'empleados',
  'contador', 'notas', 'informes', 'usuarios', 'configuracion', 'facturacion'
] as const

export const ETIQUETAS_MODULO_PERMISO: Record<(typeof MODULOS_CON_PERMISO)[number], string> = {
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  productos: 'Productos',
  cheques: 'Cheques',
  empleados: 'Empleados',
  contador: 'Contador',
  notas: 'Notas',
  informes: 'Informes',
  usuarios: 'Usuarios',
  configuracion: 'Configuración',
  facturacion: 'Facturación'
}

// ---- Datos del negocio -----------------------------------------------------

export interface DatosNegocio {
  nombre: string
  cuit: string
  direccion: string
  telefono: string
  email: string
  ciudad: string
  provincia: string
  condicion_iva_id: string
  observaciones: string
  logo_path: string | null
}

export const DATOS_NEGOCIO_VACIO: DatosNegocio = {
  nombre: '',
  cuit: '',
  direccion: '',
  telefono: '',
  email: '',
  ciudad: '',
  provincia: '',
  condicion_iva_id: '',
  observaciones: '',
  logo_path: null
}

// ---- Numeración -------------------------------------------------------------

export interface PrefijosNumeracion {
  deudas: string
  ajustes: string
  facturas: string
  movimientos: string
  compras: string
}

export const PREFIJOS_DEFAULT: PrefijosNumeracion = {
  deudas: 'DEU-',
  ajustes: 'AJ-',
  facturas: 'FAC-',
  movimientos: 'MOV-',
  compras: 'ING-'
}

export const ETIQUETAS_PREFIJO: Record<keyof PrefijosNumeracion, string> = {
  deudas: 'Deudas (Clientes)',
  ajustes: 'Ajustes de cuenta corriente',
  facturas: 'Facturas',
  movimientos: 'Cobros y pagos',
  compras: 'Ingresos de mercadería (Proveedores)'
}

// ---- Catálogos genéricos ------------------------------------------------------

export interface CatalogoFormValues {
  nombre: string
}

export function valoresCatalogoVacio(): CatalogoFormValues {
  return { nombre: '' }
}
