import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import type { CategoriaProducto, FilaImportacion, HistorialPrecioItem, Producto, ProductoFormValues, ResumenImportacion } from './types'

export function useProductos() {
  return useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .is('archived_at', null)
        .order('nombre', { ascending: true })
      if (error) throw error
      return data as Producto[]
    }
  })
}

export function useProducto(id: string | undefined) {
  return useQuery({
    queryKey: ['productos', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('productos').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Producto
    }
  })
}

/** Productos archivados — Etapa 3, ronda de ajuste. Mismo criterio que useProductos(), filtrando lo opuesto. */
export function useProductosArchivados() {
  return useQuery({
    queryKey: ['productos', 'archivados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
      if (error) throw error
      return data as Producto[]
    }
  })
}

/** Categorías activas — usada en el Select de Alta/Modificación de producto (nunca debe ofrecer una archivada) y en la pestaña "Activos" de administración. */
export function useCategoriasProductos() {
  return useQuery({
    queryKey: ['categorias_productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_productos')
        .select('*')
        .is('archived_at', null)
        .order('nombre')
      if (error) throw error
      return data as CategoriaProducto[]
    }
  })
}

/** Categorías archivadas — pestaña "Archivados" de administración. */
export function useCategoriasArchivadas() {
  return useQuery({
    queryKey: ['categorias_productos', 'archivados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_productos')
        .select('*')
        .not('archived_at', 'is', null)
        .order('nombre')
      if (error) throw error
      return data as CategoriaProducto[]
    }
  })
}

export function useCrearCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await supabase.from('categorias_productos').insert({ nombre }).select().single()
      if (error) throw error
      return data as CategoriaProducto
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_productos'] })
  })
}

export function useModificarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nombre }: { id: string; nombre: string }) => {
      const { data, error } = await supabase
        .from('categorias_productos')
        .update({ nombre })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CategoriaProducto
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_productos'] })
  })
}

function aRegistroProducto(valores: ProductoFormValues) {
  return {
    codigo_barras: valores.codigo_barras.trim(),
    nombre: valores.nombre.trim(),
    categoria_id: valores.categoria_id || null,
    precio_actual: valores.precio as number
  }
}

export function useCrearProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ProductoFormValues) => {
      const { data, error } = await supabase.from('productos').insert(aRegistroProducto(valores)).select().single()
      if (error) throw error
      return data as Producto
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] })
  })
}

export function useModificarProducto(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ProductoFormValues) => {
      const { data, error } = await supabase.from('productos').update(aRegistroProducto(valores)).eq('id', id).select().single()
      if (error) throw error
      return data as Producto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos', id] })
    }
  })
}

export function useHistorialPrecios(productoId: string) {
  return useQuery({
    queryKey: ['historial_precios', productoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historial_precios')
        .select('*')
        .eq('producto_id', productoId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as HistorialPrecioItem[]
    }
  })
}

/**
 * Ejecuta la importación: un único RPC (`importar_productos`, migración
 * 0021) que hace el UPSERT por lotes en la base — nunca un loop de
 * inserts/updates fila por fila desde acá (decisión aprobada, observación
 * E). Después registra el resultado en `importaciones` (observación B).
 */
export function useImportarProductos() {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()

  return useMutation({
    mutationFn: async ({
      filasValidas,
      cantidadErrores
    }: {
      filasValidas: FilaImportacion[]
      cantidadErrores: number
    }): Promise<ResumenImportacion> => {
      const payload = filasValidas.map((f) => ({
        codigo_barras: f.codigo_barras,
        nombre: f.nombre,
        precio: f.precio
      }))

      const { data, error } = await supabase.rpc('importar_productos', { p_filas: payload })
      if (error) throw error

      const resultado = data?.[0] ?? { creados: 0, actualizados: 0, reactivados: 0 }

      const resumen: ResumenImportacion = {
        procesados: filasValidas.length,
        creados: resultado.creados,
        actualizados: resultado.actualizados,
        reactivados: resultado.reactivados,
        errores: cantidadErrores
      }

      await supabase.from('importaciones').insert({
        usuario_id: usuario?.id,
        cantidad_procesados: resumen.procesados,
        cantidad_creados: resumen.creados,
        cantidad_actualizados: resumen.actualizados,
        cantidad_reactivados: resumen.reactivados,
        cantidad_errores: resumen.errores
      })

      return resumen
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] })
  })
}
