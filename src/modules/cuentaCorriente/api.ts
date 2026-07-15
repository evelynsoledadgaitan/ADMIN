import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Ajuste, AjusteFormValues, TipoEntidadCC, Transferencia, TransferenciaFormValues } from './types'

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

export interface SaldoConActividad {
  saldo: number
  ultimaActividad: string | null
}

/**
 * Misma función SQL que `useSaldosClientes` (`saldos_clientes()`,
 * extendida en la migración 0054) — un hook aparte en vez de cambiar el
 * de arriba, para no tocar los 8 lugares que ya lo usan (Listado de
 * Clientes) solo porque Informes necesita un dato más. Ordenar por
 * "Más reciente/antigua actividad" en Informes usa esto.
 */
export function useSaldosClientesConActividad() {
  return useQuery({
    queryKey: ['saldos_clientes', 'con_actividad'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('saldos_clientes')
      if (error) throw error
      return new Map(
        (data as { cliente_id: string; saldo: number; ultima_actividad: string | null }[]).map((f) => [
          f.cliente_id,
          { saldo: f.saldo, ultimaActividad: f.ultima_actividad }
        ])
      )
    }
  })
}

// ---- Transferencia entre cuentas -------------------------------------------

/**
 * Registrar una transferencia — de la cuenta de `origenClienteId` hacia
 * la de `valores.destino_cliente_id`. Por dentro, dos Ajustes con signo
 * opuesto, agrupados por `transferencia_id` (decisión aprobada, ver
 * docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md) — sin
 * ningún cálculo de saldo nuevo, `saldos_clientes()` ya suma
 * `ajustes_cuenta` tal como siempre.
 */
export function useRegistrarTransferencia(origenClienteId: string, nombreOrigen: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ valores, nombreDestino }: { valores: TransferenciaFormValues; nombreDestino: string }) => {
      const transferenciaId = crypto.randomUUID()
      const importe = valores.importe as number
      const motivoUsuario = valores.motivo.trim()

      const { error: errorTransferencia } = await supabase.from('transferencias_cuenta').insert({
        id: transferenciaId,
        origen_cliente_id: origenClienteId,
        destino_cliente_id: valores.destino_cliente_id,
        importe,
        fecha: valores.fecha,
        motivo: motivoUsuario === '' ? null : motivoUsuario
      })
      if (errorTransferencia) throw errorTransferencia

      const sufijo = motivoUsuario ? ` — ${motivoUsuario}` : ''
      const { error: errorAjustes } = await supabase.from('ajustes_cuenta').insert([
        {
          cliente_id: origenClienteId,
          monto: importe, // positivo = aumenta lo que debe (pierde el saldo a favor que cede)
          motivo: `Transferencia a ${nombreDestino}${sufijo}`,
          fecha: valores.fecha,
          transferencia_id: transferenciaId
        },
        {
          cliente_id: valores.destino_cliente_id,
          monto: -importe, // negativo = reduce lo que debe
          motivo: `Transferencia desde ${nombreOrigen}${sufijo}`,
          fecha: valores.fecha,
          transferencia_id: transferenciaId
        }
      ])
      if (errorAjustes) throw errorAjustes
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes_cuenta'] })
      queryClient.invalidateQueries({ queryKey: ['saldo_cliente'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_clientes'] })
      queryClient.invalidateQueries({ queryKey: ['transferencias'] })
    }
  })
}

/** Transferencias donde este cliente participó, como origen o como destino. */
export function useTransferenciasCliente(clienteId: string) {
  return useQuery({
    queryKey: ['transferencias', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias_cuenta')
        .select('*, origen:clientes!transferencias_cuenta_origen_cliente_id_fkey(nombre_apellido), destino:clientes!transferencias_cuenta_destino_cliente_id_fkey(nombre_apellido)')
        .or(`origen_cliente_id.eq.${clienteId},destino_cliente_id.eq.${clienteId}`)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as (Transferencia & { origen: { nombre_apellido: string }; destino: { nombre_apellido: string } })[]
    }
  })
}

/**
 * Anular una transferencia — anula los dos Ajustes que generó (mismo
 * criterio que anular una factura anula la deuda que generó).
 */
export function useAnularTransferencia() {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const ahora = new Date().toISOString()
      const motivoFinal = motivo.trim() === '' ? null : motivo.trim()

      await supabase
        .from('ajustes_cuenta')
        .update({ archived_at: ahora, anulado_por: usuario?.id, motivo_anulacion: 'Transferencia anulada.' })
        .eq('transferencia_id', id)
        .is('archived_at', null)

      const { error } = await supabase
        .from('transferencias_cuenta')
        .update({ archived_at: ahora, anulado_por: usuario?.id, motivo_anulacion: motivoFinal })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes_cuenta'] })
      queryClient.invalidateQueries({ queryKey: ['saldo_cliente'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_clientes'] })
      queryClient.invalidateQueries({ queryKey: ['transferencias'] })
    }
  })
}
