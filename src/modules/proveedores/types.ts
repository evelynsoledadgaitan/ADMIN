import type { Database } from '@/lib/supabase/database.types'

export type Proveedor = Database['public']['Tables']['proveedores']['Row']
export type Compra = Database['public']['Tables']['compras']['Row']
export type OrigenCompra = Compra['origen']
export type CondicionIva = Database['public']['Tables']['condiciones_iva']['Row']

/**
 * Decisión aprobada (Reorganización del flujo operativo, punto 4): estas
 * son las 3 opciones que efectivamente terminan siendo un Ingreso de
 * mercadería. "Ajuste" existe como cuarta opción visual en el selector
 * del formulario, pero NO es un origen real — redirige al formulario de
 * Ajuste ya existente (ver RegistrarCompraDialog.tsx).
 */
export const ETIQUETAS_ORIGEN_COMPRA: Record<OrigenCompra, string> = {
  mercaderia: 'Mercadería',
  factura: 'Factura',
  otro: 'Otro'
}

export interface ProveedorFormValues {
  nombre: string
  razon_social: string
  cuit: string
  condicion_iva_id: string
}

export const PROVEEDOR_FORM_VACIO: ProveedorFormValues = {
  nombre: '',
  razon_social: '',
  cuit: '',
  condicion_iva_id: ''
}

export function proveedorAFormValues(proveedor: Proveedor): ProveedorFormValues {
  return {
    nombre: proveedor.nombre,
    razon_social: proveedor.razon_social ?? '',
    cuit: proveedor.cuit ?? '',
    condicion_iva_id: proveedor.condicion_iva_id ?? ''
  }
}

export interface CompraFormValues {
  origen: OrigenCompra
  descripcion: string
  numero_comprobante: string
  monto: number | null
  fecha: string // ISO yyyy-mm-dd
}

export function valoresCompraVacio(hoyISO: string): CompraFormValues {
  return { origen: 'mercaderia', descripcion: '', numero_comprobante: '', monto: null, fecha: hoyISO }
}

/**
 * "ING-000001" — referencia legible para el usuario, no reemplaza al id.
 * El nombre técnico de la función y del campo interno siguen diciendo
 * "compra" a propósito (evita migraciones/renombres innecesarios) — el
 * prefijo visible cambió de "COMP-" a "ING-" porque sí es texto que ve
 * el usuario (decisión aprobada: terminología nueva en todo lo visible).
 */
export function formatearNumeroCompra(numeroInterno: number, prefijo = 'ING-'): string {
  return `${prefijo}${String(numeroInterno).padStart(6, '0')}`
}
