import type { Database } from '@/lib/supabase/database.types'

export type Producto = Database['public']['Tables']['productos']['Row']
export type CategoriaProducto = Database['public']['Tables']['categorias_productos']['Row']
export type HistorialPrecioItem = Database['public']['Tables']['historial_precios']['Row']

export interface ProductoFormValues {
  codigo_barras: string
  nombre: string
  categoria_id: string
  precio: number | null
}

export const PRODUCTO_FORM_VACIO: ProductoFormValues = {
  codigo_barras: '',
  nombre: '',
  categoria_id: '',
  precio: null
}

export function productoAFormValues(producto: Producto): ProductoFormValues {
  return {
    codigo_barras: producto.codigo_barras,
    nombre: producto.nombre,
    categoria_id: producto.categoria_id ?? '',
    precio: producto.precio_actual
  }
}

/** Una fila ya parseada y validada del archivo de importación. */
export interface FilaImportacion {
  numeroFila: number // para mostrar "fila 14" en los errores
  codigo_barras: string
  nombre: string
  precio: number | null
  error: string | null
}

export interface ResumenImportacion {
  procesados: number
  creados: number
  actualizados: number
  reactivados: number
  errores: number
}
