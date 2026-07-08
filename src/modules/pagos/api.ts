import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { subirAdjunto } from '@/core/lib/adjuntos'
import type { MedioPago, Movimiento, MovimientoFormValues, TipoMovimiento } from './types'

export function useMediosPago() {
  return useQuery({
    queryKey: ['medios_pago'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medios_pago').select('*').is('archived_at', null).order('orden')
      if (error) throw error
      return data as MedioPago[]
    }
  })
}

/**
 * Movimientos de UNA entidad (un cliente o un proveedor puntual), más
 * recientes primero. No filtra los anulados — se muestran igual, marcados
 * "ANULADO" (decisión aprobada, punto D): nunca desaparecen.
 */
export function useMovimientos(tipo: TipoMovimiento, entidadId: string) {
  const columnaEntidad = tipo === 'cobro' ? 'cliente_id' : 'proveedor_id'
  return useQuery({
    queryKey: ['movimientos', tipo, entidadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimientos')
        .select('*, usuario_anulacion:usuarios(nombre)')
        .eq(columnaEntidad, entidadId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (Movimiento & { usuario_anulacion: { nombre: string } | null })[]
    }
  })
}

export function useRegistrarMovimiento(tipo: TipoMovimiento, entidadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ valores, archivo }: { valores: MovimientoFormValues; archivo: File | null }) => {
      const id = crypto.randomUUID()
      const modulo = tipo === 'cobro' ? 'clientes' : 'proveedores'
      const comprobante_path = archivo ? await subirAdjunto(modulo, 'movimientos', id, archivo) : null

      const { data, error } = await supabase
        .from('movimientos')
        .insert({
          id,
          tipo,
          cliente_id: tipo === 'cobro' ? entidadId : null,
          proveedor_id: tipo === 'pago' ? entidadId : null,
          monto: valores.monto as number,
          fecha: valores.fecha,
          medio_pago_id: valores.medio_pago_id,
          nota: valores.nota.trim() === '' ? null : valores.nota.trim(),
          comprobante_path
        })
        .select()
        .single()
      if (error) throw error
      return data as Movimiento
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movimientos', tipo, entidadId] })
  })
}

/**
 * Anular (nunca editar — ver docs/decisiones y migración 0012). Registra
 * quién anula (usuario actual) y, opcionalmente, el motivo.
 */
export function useAnularMovimiento(tipo: TipoMovimiento, entidadId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('movimientos')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Movimiento
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movimientos', tipo, entidadId] })
  })
}
