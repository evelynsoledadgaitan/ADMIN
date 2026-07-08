import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Ajuste, AjusteFormValues, TipoEntidadCC } from './types'

const COLUMNA_ENTIDAD: Record<TipoEntidadCC, 'cliente_id' | 'proveedor_id'> = {
  cliente: 'cliente_id',
  proveedor: 'proveedor_id'
}

/**
 * Ajustes de UNA entidad (un cliente o un proveedor puntual) — orden
 * cronológico estable, mismo criterio que compras/movimientos: fecha
 * desc, created_at desc. No filtra anulados — se muestran igual, marcados.
 */
export function useAjustes(tipo: TipoEntidadCC, entidadId: string) {
  const columna = COLUMNA_ENTIDAD[tipo]
  return useQuery({
    queryKey: ['ajustes_cuenta', tipo, entidadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ajustes_cuenta')
        .select('*, usuario_anulacion:usuarios(nombre)')
        .eq(columna, entidadId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (Ajuste & { usuario_anulacion: { nombre: string } | null })[]
    }
  })
}

export function useRegistrarAjuste(tipo: TipoEntidadCC, entidadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (valores: AjusteFormValues) => {
      const { data, error } = await supabase
        .from('ajustes_cuenta')
        .insert({
          cliente_id: tipo === 'cliente' ? entidadId : null,
          proveedor_id: tipo === 'proveedor' ? entidadId : null,
          monto: valores.monto as number,
          motivo: valores.motivo.trim(),
          fecha: valores.fecha
        })
        .select()
        .single()
      if (error) throw error
      return data as Ajuste
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes_cuenta', tipo, entidadId] })
      queryClient.invalidateQueries({ queryKey: [tipo === 'cliente' ? 'saldo_cliente' : 'saldo_proveedor', entidadId] })
    }
  })
}

/** Anular (nunca editar) — mismo criterio que useAnularMovimiento/useAnularCompra. */
export function useAnularAjuste(tipo: TipoEntidadCC, entidadId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('ajustes_cuenta')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Ajuste
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes_cuenta', tipo, entidadId] })
      queryClient.invalidateQueries({ queryKey: [tipo === 'cliente' ? 'saldo_cliente' : 'saldo_proveedor', entidadId] })
    }
  })
}

/** Saldo del cliente — gemela de useSaldoProveedor (modules/proveedores/api.ts). Ver saldo_cliente(), migración 0026. */
export function useSaldoCliente(clienteId: string) {
  return useQuery({
    queryKey: ['saldo_cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('saldo_cliente', { p_cliente_id: clienteId })
      if (error) throw error
      return data as number
    }
  })
}

/**
 * Saldo de TODOS los clientes activos, en una sola consulta — para la
 * columna "Estado de cuenta" del listado (migración 0031). Nunca hacer
 * N llamadas a useSaldoCliente() dentro de una lista — es exactamente el
 * problema que esta función evita.
 */
export function useSaldosClientes() {
  return useQuery({
    queryKey: ['saldos_clientes'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('saldos_clientes')
      if (error) throw error
      return new Map((data as { cliente_id: string; saldo: number }[]).map((f) => [f.cliente_id, f.saldo]))
    }
  })
}
