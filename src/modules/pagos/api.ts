import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { subirAdjunto } from '@/core/lib/adjuntos'
import type { MedioPago, Movimiento, MovimientoCompuestoFormValues, TipoMovimiento } from './types'

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

/** El id del medio de pago "Cheque" — para distinguirlo del resto en el formulario compuesto (ver docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md). */
export function useIdMedioPagoCheque() {
  const { data: mediosPago } = useMediosPago()
  return mediosPago?.find((m) => m.nombre === 'Cheque')?.id ?? null
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

/**
 * Registrar un cobro/pago compuesto — una fila de `movimientos` por
 * línea, todas con el mismo `grupo_id` cuando hay más de una (decisión
 * aprobada). Cada línea sigue afectando el saldo exactamente igual que
 * un movimiento suelto de siempre — no hace falta tocar
 * `saldos_clientes()`/`saldos_proveedores()`.
 *
 * Cuando una línea usa un cheque de la cartera, además de insertar el
 * movimiento con `cheque_id`, se actualiza el cheque: pasa de
 * "en_cartera" a "disponible" (cobro) o "entregado" (pago), y queda
 * vinculado al cliente/proveedor correspondiente.
 */
export function useRegistrarMovimiento(tipo: TipoMovimiento, entidadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ valores, archivo }: { valores: MovimientoCompuestoFormValues; archivo: File | null }) => {
      const modulo = tipo === 'cobro' ? 'clientes' : 'proveedores'
      const grupo_id = valores.lineas.length > 1 ? crypto.randomUUID() : null

      const movimientosCreados: Movimiento[] = []

      for (let i = 0; i < valores.lineas.length; i++) {
        const linea = valores.lineas[i]
        const id = crypto.randomUUID()
        // El comprobante (si se cargó uno) se adjunta a la primera línea
        // nada más — no tiene sentido duplicar el mismo archivo en cada una.
        const comprobante_path = archivo && i === 0 ? await subirAdjunto(modulo, 'movimientos', id, archivo) : null

        const { data, error } = await supabase
          .from('movimientos')
          .insert({
            id,
            tipo,
            cliente_id: tipo === 'cobro' ? entidadId : null,
            proveedor_id: tipo === 'pago' ? entidadId : null,
            monto: linea.monto as number,
            fecha: valores.fecha,
            medio_pago_id: linea.medio_pago_id,
            cheque_id: linea.cheque_id,
            grupo_id,
            nota: valores.nota.trim() === '' ? null : valores.nota.trim(),
            comprobante_path
          })
          .select()
          .single()
        if (error) throw error
        movimientosCreados.push(data as Movimiento)

        if (linea.cheque_id) {
          const cambiosCheque: { estado: 'disponible' | 'entregado'; cliente_id?: string; proveedor_id?: string } =
            tipo === 'cobro'
              ? { estado: 'disponible', cliente_id: entidadId }
              : { estado: 'entregado', proveedor_id: entidadId }
          const { error: errorCheque } = await supabase.from('cheques').update(cambiosCheque).eq('id', linea.cheque_id)
          if (errorCheque) throw errorCheque
        }
      }

      return movimientosCreados
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', tipo, entidadId] })
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
    }
  })
}

/**
 * Anular (nunca editar — ver docs/decisiones y migración 0012). Si el
 * movimiento tenía un cheque vinculado, el cheque vuelve al estado que
 * le corresponda: "en_cartera" si no tenía ningún otro uso activo, o de
 * vuelta a "disponible" si un pago se anula pero el cobro que lo recibió
 * sigue en pie (mismo criterio que ya se usa al anular una factura del
 * Flujo C — se desvincula, no se destruye nada).
 */
export function useAnularMovimiento(tipo: TipoMovimiento, entidadId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data: movimientoAAnular } = await supabase.from('movimientos').select('*').eq('id', id).single()

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

      if (movimientoAAnular?.cheque_id) {
        if ((movimientoAAnular as Movimiento).tipo === 'pago') {
          // ¿Ese cheque sigue teniendo un cobro activo? Si sí, vuelve a
          // "disponible" (seguía en nuestras manos); si no, vuelve a la cartera.
          const { data: cobroActivo } = await supabase
            .from('movimientos')
            .select('id')
            .eq('cheque_id', movimientoAAnular.cheque_id)
            .eq('tipo', 'cobro')
            .is('archived_at', null)
            .maybeSingle()
          await supabase
            .from('cheques')
            .update(
              cobroActivo
                ? { estado: 'disponible', proveedor_id: null }
                : { estado: 'en_cartera', cliente_id: null, proveedor_id: null }
            )
            .eq('id', movimientoAAnular.cheque_id)
        } else {
          await supabase.from('cheques').update({ estado: 'en_cartera', cliente_id: null }).eq('id', movimientoAAnular.cheque_id)
        }
      }

      return data as Movimiento
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', tipo, entidadId] })
      queryClient.invalidateQueries({ queryKey: ['cheques'] })
    }
  })
}
