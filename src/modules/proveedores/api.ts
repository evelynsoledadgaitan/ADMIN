import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { normalizarCuit } from '@/core/lib/cuit'
import { subirAdjunto } from '@/core/lib/adjuntos'
import type { Compra, CompraFormValues, Proveedor, ProveedorFormValues } from './types'

/** Listado de proveedores activos, ordenados alfabéticamente EN LA CONSULTA (ver docs/decisiones/0012). */
export function useProveedores(enabled = true) {
  return useQuery({
    queryKey: ['proveedores'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .is('archived_at', null)
        .order('nombre', { ascending: true })
      if (error) throw error
      return data as Proveedor[]
    }
  })
}

export function useProveedor(id: string | undefined) {
  return useQuery({
    queryKey: ['proveedores', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('proveedores').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Proveedor
    }
  })
}

/** Proveedores archivados — Etapa 3, ronda de ajuste. Mismo criterio que useProveedores(), filtrando lo opuesto. */
export function useProveedoresArchivados() {
  return useQuery({
    queryKey: ['proveedores', 'archivados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
      if (error) throw error
      return data as Proveedor[]
    }
  })
}

function aRegistroProveedor(valores: ProveedorFormValues) {
  const esVacio = (v: string) => v.trim() === ''
  return {
    nombre: valores.nombre.trim(),
    razon_social: esVacio(valores.razon_social) ? null : valores.razon_social.trim(),
    cuit: esVacio(valores.cuit) ? null : normalizarCuit(valores.cuit),
    condicion_iva_id: esVacio(valores.condicion_iva_id) ? null : valores.condicion_iva_id
  }
}

export function useCrearProveedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ProveedorFormValues) => {
      const { data, error } = await supabase.from('proveedores').insert(aRegistroProveedor(valores)).select().single()
      if (error) throw error
      return data as Proveedor
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores'] })
  })
}

export function useModificarProveedor(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ProveedorFormValues) => {
      const { data, error } = await supabase.from('proveedores').update(aRegistroProveedor(valores)).eq('id', id).select().single()
      if (error) throw error
      return data as Proveedor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      queryClient.invalidateQueries({ queryKey: ['proveedores', id] })
    }
  })
}

// ---- Compras -----------------------------------------------------------

/** Compras de UN proveedor, orden cronológico estable (observación C): fecha desc, created_at desc. No filtra anuladas — se muestran igual, marcadas. */
export function useCompras(proveedorId: string) {
  return useQuery({
    queryKey: ['compras', proveedorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras')
        .select('*, usuario_anulacion:usuarios(nombre)')
        .eq('proveedor_id', proveedorId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (Compra & { usuario_anulacion: { nombre: string } | null })[]
    }
  })
}

export function useUltimaCompra(proveedorId: string) {
  return useQuery({
    queryKey: ['compras', proveedorId, 'ultima'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .eq('proveedor_id', proveedorId)
        .is('archived_at', null)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Compra | null
    }
  })
}

export function useUltimoPago(proveedorId: string) {
  return useQuery({
    queryKey: ['movimientos', 'pago', proveedorId, 'ultimo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimientos')
        .select('*')
        .eq('proveedor_id', proveedorId)
        .eq('tipo', 'pago')
        .is('archived_at', null)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    }
  })
}

export function useRegistrarCompra(proveedorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ valores, archivo }: { valores: CompraFormValues; archivo: File | null }) => {
      const id = crypto.randomUUID()
      const comprobante_path = archivo ? await subirAdjunto('proveedores', 'compras', id, archivo) : null

      const { data, error } = await supabase
        .from('compras')
        .insert({
          id,
          proveedor_id: proveedorId,
          origen: valores.origen,
          descripcion: valores.descripcion.trim(),
          numero_comprobante: valores.numero_comprobante.trim() === '' ? null : valores.numero_comprobante.trim(),
          monto: valores.monto as number,
          fecha: valores.fecha,
          comprobante_path
        })
        .select()
        .single()
      if (error) throw error
      return data as Compra
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras', proveedorId] })
      queryClient.invalidateQueries({ queryKey: ['saldo_proveedor', proveedorId] })
    }
  })
}

/** Anular (nunca editar) — mismo criterio que useAnularMovimiento (Sprint 3). */
export function useAnularCompra(proveedorId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('compras')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Compra
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras', proveedorId] })
      queryClient.invalidateQueries({ queryKey: ['saldo_proveedor', proveedorId] })
    }
  })
}

// ---- Saldo ---------------------------------------------------------------

/** Compras activas menos pagos activos — calculado en la base (ver migración 0017), nunca almacenado. */
export function useSaldoProveedor(proveedorId: string) {
  return useQuery({
    queryKey: ['saldo_proveedor', proveedorId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('saldo_proveedor', { p_proveedor_id: proveedorId })
      if (error) throw error
      return data as number
    }
  })
}

/**
 * Saldo de TODOS los proveedores activos, en una sola consulta — para la
 * columna "Estado de cuenta" del listado (migración 0031). Gemela de
 * useSaldosClientes (modules/cuentaCorriente/api.ts).
 */
export function useSaldosProveedores() {
  return useQuery({
    queryKey: ['saldos_proveedores'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('saldos_proveedores')
      if (error) throw error
      return new Map((data as { proveedor_id: string; saldo: number }[]).map((f) => [f.proveedor_id, f.saldo]))
    }
  })
}

/** Misma función SQL que `useSaldosProveedores` (extendida en la migración 0054) — hook aparte para no tocar el listado, mismo criterio que `useSaldosClientesConActividad`. */
export function useSaldosProveedoresConActividad() {
  return useQuery({
    queryKey: ['saldos_proveedores', 'con_actividad'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('saldos_proveedores')
      if (error) throw error
      return new Map(
        (data as { proveedor_id: string; saldo: number; ultima_actividad: string | null }[]).map((f) => [
          f.proveedor_id,
          { saldo: f.saldo, ultimaActividad: f.ultima_actividad }
        ])
      )
    }
  })
}
