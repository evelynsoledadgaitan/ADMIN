import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { hoyISO } from '@/core/lib/format'
import type { Cheque, ChequeFormValues } from './types'

async function idMedioPagoCheque(): Promise<string> {
  const { data } = await supabase.from('medios_pago').select('id').eq('nombre', 'Cheque').is('archived_at', null).maybeSingle()
  if (!data) throw new Error('No se encontró el medio de pago "Cheque" en el catálogo.')
  return data.id
}

/** Anula un movimiento (cobro o pago) — mismo patrón que ya usa Facturación al anular una factura vinculada a una deuda. */
async function anularMovimiento(movimientoId: string, motivo: string) {
  await supabase
    .from('movimientos')
    .update({ archived_at: new Date().toISOString(), motivo_anulacion: motivo })
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

/** Cheques disponibles con vencimiento de hoy o dentro de 7 días — para la tarjeta de Pendientes en Inicio, mismo umbral que Contador. */
export function useChequesPendientesVencer() {
  return useQuery({
    queryKey: ['cheques', 'pendientes'],
    queryFn: async () => {
      const en7dias = new Date()
      en7dias.setDate(en7dias.getDate() + 7)
      const offset = en7dias.getTimezoneOffset()
      const limite = new Date(en7dias.getTime() - offset * 60_000).toISOString().slice(0, 10)

      const { data, error } = await supabase.from('cheques').select('id').eq('estado', 'disponible').lte('fecha_vencimiento', limite)
      if (error) throw error
      return data as { id: string }[]
    }
  })
}

/**
 * Alta de un cheque — recibirlo de un cliente es, en los hechos, un
 * cobro (Motor de Pagos, medio de pago "Cheque") — se crea primero, y el
 * cheque queda vinculado a él (`movimiento_cobro_id`). Ver
 * docs/sistemas/cheques-diseno.md, decisión central aprobada.
 */
export function useCrearCheque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ChequeFormValues) => {
      const chequeId = crypto.randomUUID()
      const medioPagoId = await idMedioPagoCheque()

      const { data: movimiento, error: errorMovimiento } = await supabase
        .from('movimientos')
        .insert({
          tipo: 'cobro',
          cliente_id: valores.cliente_id,
          monto: valores.importe as number,
          fecha: valores.fecha_emision,
          medio_pago_id: medioPagoId,
          nota: `Cheque ${valores.numero} — ${valores.banco}`
        })
        .select()
        .single()
      if (errorMovimiento) throw errorMovimiento

      const { data: cheque, error: errorCheque } = await supabase
        .from('cheques')
        .insert({
          id: chequeId,
          banco: valores.banco.trim(),
          numero: valores.numero.trim(),
          importe: valores.importe as number,
          titular: valores.titular.trim(),
          cuit: valores.cuit.trim() === '' ? null : valores.cuit.trim(),
          fecha_emision: valores.fecha_emision,
          fecha_vencimiento: valores.fecha_vencimiento,
          observaciones: valores.observaciones.trim() === '' ? null : valores.observaciones.trim(),
          cliente_id: valores.cliente_id,
          movimiento_cobro_id: movimiento.id
        })
        .select()
        .single()
      if (errorCheque) throw errorCheque

      return cheque as Cheque
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['saldos_clientes'] })
    }
  })
}

/** Cargarle la foto del frente después de creado — mismo patrón "adjunto opcional, se puede sumar después" del resto del sistema. */
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

/** Depositar — no genera ningún cobro nuevo (decisión aprobada explícita): el ingreso ya se registró al recibir el cheque. Solo cambia el estado. */
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
 * Entregar a un proveedor — genera un pago normal en el Motor de Pagos
 * (mismo criterio que recibirlo genera un cobro). El cheque queda
 * vinculado a ese pago (`movimiento_pago_id`) para poder ver, desde su
 * Ficha, a quién se entregó y con qué pago exactamente (pedido
 * explícito de trazabilidad).
 */
export function useEntregarAProveedor(chequeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ proveedorId, importe, numero, banco }: { proveedorId: string; importe: number; numero: string; banco: string }) => {
      const medioPagoId = await idMedioPagoCheque()

      const { data: movimiento, error: errorMovimiento } = await supabase
        .from('movimientos')
        .insert({
          tipo: 'pago',
          proveedor_id: proveedorId,
          monto: importe,
          fecha: hoyISO(),
          medio_pago_id: medioPagoId,
          nota: `Cheque ${numero} — ${banco}`
        })
        .select()
        .single()
      if (errorMovimiento) throw errorMovimiento

      const { error: errorCheque } = await supabase
        .from('cheques')
        .update({ estado: 'entregado', proveedor_id: proveedorId, movimiento_pago_id: movimiento.id })
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
 * "Entregado" (el proveedor avisa que rebotó: el pago se anula, decisión
 * aprobada explícita). Mismo criterio en los dos sentidos: se anula el
 * movimiento que había asumido que este cheque era plata real.
 */
export function useMarcarRechazado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cheque: Cheque) => {
      if (cheque.estado === 'depositado') {
        await anularMovimiento(cheque.movimiento_cobro_id, 'Cheque rechazado por el banco.')
      } else if (cheque.estado === 'entregado' && cheque.movimiento_pago_id) {
        await anularMovimiento(cheque.movimiento_pago_id, 'Cheque rechazado — el pago al proveedor se anula.')
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

/** Anular — corrección de un error de carga. Anula siempre el cobro original, y el pago al proveedor también si ya se había entregado. */
export function useAnularCheque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cheque: Cheque) => {
      await anularMovimiento(cheque.movimiento_cobro_id, 'Cheque anulado.')
      if (cheque.movimiento_pago_id) {
        await anularMovimiento(cheque.movimiento_pago_id, 'Cheque anulado.')
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
