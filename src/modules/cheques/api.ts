import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { hoyISO } from '@/core/lib/format'
import type { Cheque, ChequeFormValues, EstadoCheque } from './types'
import type { Movimiento, TipoMovimiento } from '@/modules/pagos/types'

async function idMedioPagoCheque(): Promise<string> {
  const { data } = await supabase.from('medios_pago').select('id').eq('nombre', 'Cheque').is('archived_at', null).maybeSingle()
  if (!data) throw new Error('No se encontró el medio de pago "Cheque" en el catálogo.')
  return data.id
}

/** Anula un movimiento (cobro o pago) — mismo patrón que ya usa Facturación al anular una factura vinculada a una deuda. */
async function anularMovimiento(movimientoId: string, motivo: string, usuarioId: string | undefined) {
  await supabase
    .from('movimientos')
    .update({ archived_at: new Date().toISOString(), anulado_por: usuarioId, motivo_anulacion: motivo })
    .eq('id', movimientoId)
    .is('archived_at', null)
}

export function useCheques() {
  return useQuery({
    queryKey: ['cheques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cheques')
        .select('*, cliente:clientes(nombre_apellido), proveedor:proveedores(nombre)')
        .order('fecha_vencimiento', { ascending: true })
      if (error) throw error
      return data as (Cheque & { cliente: { nombre_apellido: string } | null; proveedor: { nombre: string } | null })[]
    }
  })
}

export function useCheque(id: string | undefined) {
  return useQuery({
    queryKey: ['cheques', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cheques')
        .select('*, cliente:clientes(nombre_apellido), proveedor:proveedores(nombre)')
        .eq('id', id as string)
        .single()
      if (error) throw error
      return data as Cheque & { cliente: { nombre_apellido: string } | null; proveedor: { nombre: string } | null }
    }
  })
}

/**
 * Los movimientos (cobro y/o pago) que usaron este cheque a lo largo de
 * su vida — para mostrar en su Ficha de dónde vino y a quién se entregó,
 * con trazabilidad completa (pedido explícito).
 */
export function useMovimientosDeCheque(chequeId: string) {
  return useQuery({
    queryKey: ['movimientos', 'de_cheque', chequeId],
    enabled: !!chequeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimientos')
        .select('*, cliente:clientes(nombre_apellido), proveedor:proveedores(nombre)')
        .eq('cheque_id', chequeId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as (Movimiento & { cliente: { nombre_apellido: string } | null; proveedor: { nombre: string } | null })[]
    }
  })
}

/**
 * Cheques disponibles para elegir como medio de pago — "cartera" (ver
 * docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md). Para un
 * cobro, solo los que todavía no se usaron en nada (`en_cartera`). Para
 * un pago, también los que ya están en nuestras manos por haberlos
 * recibido de un cliente (`disponible`) — un cheque puede ir derecho de
 * la cartera a un proveedor, sin pasar por ningún cliente.
 */
export function useChequesDisponiblesParaUsar(tipo: TipoMovimiento) {
  return useQuery({
    queryKey: ['cheques', 'disponibles', tipo],
    queryFn: async () => {
      const estados: EstadoCheque[] = tipo === 'cobro' ? ['en_cartera'] : ['en_cartera', 'disponible']
      const { data, error } = await supabase.from('cheques').select('*').in('estado', estados).order('fecha_vencimiento')
      if (error) throw error
      return data as Cheque[]
    }
  })
}

/** Cheques en cartera o disponibles con vencimiento de hoy o dentro de 7 días — un cheque sin usar también "vence" si no se lo usa a tiempo. */
export function useChequesPendientesVencer() {
  return useQuery({
    queryKey: ['cheques', 'pendientes'],
    queryFn: async () => {
      const en7dias = new Date()
      en7dias.setDate(en7dias.getDate() + 7)
      const offset = en7dias.getTimezoneOffset()
      const limite = new Date(en7dias.getTime() - offset * 60_000).toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('cheques')
        .select('id')
        .in('estado', ['en_cartera', 'disponible'])
        .lte('fecha_vencimiento', limite)
      if (error) throw error
      return data as { id: string }[]
    }
  })
}

/** Alta de un cheque — entra a la cartera solo, sin cliente ni cobro todavía (decisión aprobada). */
export function useCrearCheque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ChequeFormValues) => {
      const { data, error } = await supabase
        .from('cheques')
        .insert({
          banco: valores.banco.trim(),
          numero: valores.numero.trim(),
          importe: valores.importe as number,
          titular: valores.titular.trim(),
          cuit: valores.cuit.trim() === '' ? null : valores.cuit.trim(),
          fecha_emision: valores.fecha_emision,
          fecha_vencimiento: valores.fecha_vencimiento,
          observaciones: valores.observaciones.trim() === '' ? null : valores.observaciones.trim()
        })
        .select()
        .single()
      if (error) throw error
      return data as Cheque
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cheques'] })
  })
}

/** Cargarle la foto del frente, en cualquier momento de su vida — mismo patrón "adjunto opcional" del resto del sistema. */
export function useAdjuntarComprobanteCheque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, comprobante_path }: { id: string; comprobante_path: string }) => {
      const { error } = await supabase.from('cheques').update({ comprobante_path }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_v, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cheques', id] })
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
    }
  })
}

/** Depositar — no genera ningún cobro nuevo: el ingreso ya se registró cuando se usó el cheque en un cobro. Solo cambia el estado. */
export function useDepositarCheque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cheques').update({ estado: 'depositado' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_v, id) => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['cheques', id] })
    }
  })
}

export function useMarcarAcreditado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cheques').update({ estado: 'acreditado' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_v, id) => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['cheques', id] })
    }
  })
}

/**
 * Entregar a un proveedor — acción rápida desde la Ficha del cheque
 * (equivalente a elegir este mismo cheque en un pago compuesto desde
 * Proveedores, para el caso simple de un solo cheque). Genera el pago
 * en el Motor de Pagos, con `cheque_id` vinculado.
 */
export function useEntregarAProveedor(chequeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ proveedorId, importe, numero, banco }: { proveedorId: string; importe: number; numero: string; banco: string }) => {
      const medioPagoId = await idMedioPagoCheque()

      const { error: errorMovimiento } = await supabase.from('movimientos').insert({
        tipo: 'pago',
        proveedor_id: proveedorId,
        monto: importe,
        fecha: hoyISO(),
        medio_pago_id: medioPagoId,
        cheque_id: chequeId,
        nota: `Cheque ${numero} — ${banco}`
      })
      if (errorMovimiento) throw errorMovimiento

      const { error: errorCheque } = await supabase
        .from('cheques')
        .update({ estado: 'entregado', proveedor_id: proveedorId })
        .eq('id', chequeId)
      if (errorCheque) throw errorCheque
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['cheques', chequeId] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_proveedores'] })
    }
  })
}

/**
 * Marcar rechazado — desde "Depositado" (nuestro banco lo rechazó: el
 * cobro original se anula, la deuda del cliente vuelve) o desde
 * "Entregado" (el proveedor avisa que rebotó: el pago se anula). Busca
 * el movimiento activo correspondiente por `cheque_id` — ya no hay
 * punteros guardados en el propio cheque.
 */
export function useMarcarRechazado() {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async (cheque: Cheque) => {
      const tipoABuscar = cheque.estado === 'depositado' ? 'cobro' : 'pago'
      const { data: movimiento } = await supabase
        .from('movimientos')
        .select('id')
        .eq('cheque_id', cheque.id)
        .eq('tipo', tipoABuscar)
        .is('archived_at', null)
        .maybeSingle()

      if (movimiento) {
        const motivo =
          tipoABuscar === 'cobro' ? 'Cheque rechazado por el banco.' : 'Cheque rechazado — el pago al proveedor se anula.'
        await anularMovimiento(movimiento.id, motivo, usuario?.id)
      }

      const { error } = await supabase.from('cheques').update({ estado: 'rechazado' }).eq('id', cheque.id)
      if (error) throw error
    },
    onSuccess: (_v, cheque) => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['cheques', cheque.id] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_clientes'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_proveedores'] })
    }
  })
}

/** Anular — corrección de un error de carga. Anula cualquier cobro y/o pago activo que haya usado este cheque. */
export function useAnularCheque() {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async (cheque: Cheque) => {
      const { data: movimientos } = await supabase
        .from('movimientos')
        .select('id')
        .eq('cheque_id', cheque.id)
        .is('archived_at', null)

      for (const m of movimientos ?? []) {
        await anularMovimiento(m.id, 'Cheque anulado.', usuario?.id)
      }

      const { error } = await supabase.from('cheques').update({ estado: 'anulado' }).eq('id', cheque.id)
      if (error) throw error
    },
    onSuccess: (_v, cheque) => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['cheques', cheque.id] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_clientes'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_proveedores'] })
    }
  })
}
