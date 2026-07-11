import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { subirAdjunto } from '@/core/lib/adjuntos'
import { formatearNumeroFactura, subtotalLinea, totalFactura } from './types'
import type { Factura, FacturaItem, FacturaFormValues } from './types'
import type { Deuda } from '@/modules/clientes/types'
import type { Movimiento } from '@/modules/pagos/types'

type FacturaConCliente = Factura & { cliente: { nombre_apellido: string } }

/** Facturas activas — listado principal. */
export function useFacturas() {
  return useQuery({
    queryKey: ['facturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('*, cliente:clientes(nombre_apellido)')
        .is('archived_at', null)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FacturaConCliente[]
    }
  })
}

/** Facturas archivadas — pestaña "Archivados" del listado. */
export function useFacturasArchivadas() {
  return useQuery({
    queryKey: ['facturas', 'archivadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('*, cliente:clientes(nombre_apellido)')
        .not('archived_at', 'is', null)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FacturaConCliente[]
    }
  })
}

/** Facturas de UN cliente puntual — para el enlace "Facturas" desde su Ficha/Estado de cuenta. */
export function useFacturasCliente(clienteId: string) {
  return useQuery({
    queryKey: ['facturas', 'cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Factura[]
    }
  })
}

export function useFactura(id: string | undefined) {
  return useQuery({
    queryKey: ['facturas', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('*, cliente:clientes(nombre_apellido)')
        .eq('id', id as string)
        .single()
      if (error) throw error
      return data as FacturaConCliente
    }
  })
}

export function useFacturaItems(facturaId: string | undefined) {
  return useQuery({
    queryKey: ['factura_items', facturaId],
    enabled: !!facturaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('factura_items')
        .select('*')
        .eq('factura_id', facturaId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as FacturaItem[]
    }
  })
}

/**
 * Cobros de un cliente que todavía no tienen ninguna factura asociada —
 * para el selector del Flujo B ("Es el comprobante de un cobro ya
 * registrado"). Sin límite de tiempo, a propósito (decisión aprobada,
 * punto 2 de docs/sistemas/facturacion-dos-flujos-diseno.md): mejor un
 * listado largo que ocultar un cobro viejo por una fecha de corte.
 *
 * Dos consultas simples en vez de una con subconsulta — mismo criterio
 * de simplicidad que ya rige el resto del sistema (los volúmenes de un
 * único negocio no justifican una vista o función SQL para esto).
 */
export function useCobrosSinFactura(clienteId: string) {
  return useQuery({
    queryKey: ['movimientos', 'cobro', clienteId, 'sin_factura'],
    queryFn: async () => {
      const { data: cobros, error: errorCobros } = await supabase
        .from('movimientos')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('tipo', 'cobro')
        .is('archived_at', null)
        .order('fecha', { ascending: false })
      if (errorCobros) throw errorCobros

      const { data: facturasConCobro, error: errorFacturas } = await supabase
        .from('facturas')
        .select('movimiento_id')
        .eq('cliente_id', clienteId)
        .is('archived_at', null)
        .not('movimiento_id', 'is', null)
      if (errorFacturas) throw errorFacturas

      const idsYaAsociados = new Set((facturasConCobro as { movimiento_id: string }[]).map((f) => f.movimiento_id))
      return (cobros as Movimiento[]).filter((c) => !idsYaAsociados.has(c.id))
    }
  })
}

/** El cobro asociado a una factura del Flujo B, si lo hay — para el enlace "Ver el cobro" en la Ficha. */
export function useCobroDeFactura(movimientoId: string | null) {
  return useQuery({
    queryKey: ['movimientos', movimientoId],
    enabled: !!movimientoId,
    queryFn: async () => {
      const { data, error } = await supabase.from('movimientos').select('*').eq('id', movimientoId as string).single()
      if (error) throw error
      return data as Movimiento
    }
  })
}

/**
 * Deudas de un cliente que todavía no tienen ninguna factura vinculada —
 * para el selector del Flujo C ("Es el comprobante de una deuda ya
 * generada"). En la práctica son las cargadas a mano con "Agregar deuda"
 * — las que ya nacieron de una factura (Flujo A) tienen `factura_id`
 * puesto desde el momento en que se crearon, así que quedan afuera solas,
 * sin necesitar ningún filtro extra por origen.
 */
export function useDeudasSinFactura(clienteId: string) {
  return useQuery({
    queryKey: ['deudas_clientes', clienteId, 'sin_factura'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deudas_clientes')
        .select('*')
        .eq('cliente_id', clienteId)
        .is('archived_at', null)
        .is('factura_id', null)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as Deuda[]
    }
  })
}

/** La deuda que generó esta factura, si la hay — para el enlace "Ver deuda" desde la Ficha de factura. */
export function useDeudaDeFactura(facturaId: string | undefined) {
  return useQuery({
    queryKey: ['deudas_clientes', 'de_factura', facturaId],
    enabled: !!facturaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deudas_clientes')
        .select('*')
        .eq('factura_id', facturaId as string)
        .maybeSingle()
      if (error) throw error
      return data as Deuda | null
    }
  })
}

/**
 * Registrar una factura — inserta la cabecera, las líneas y, siempre,
 * la Deuda automática correspondiente (origen='factura', con
 * `factura_id` para trazabilidad). Documentar una operación (facturar) y
 * registrar un movimiento de dinero (cobrar) son procesos completamente
 * separados — el cobro se registra después, aparte, con el Motor de
 * Pagos que ya existe. Facturación nunca sabe si algo ya se cobró.
 *
 * Nota de arquitectura: son 3 inserts secuenciales, no una transacción de
 * base de datos — mismo criterio que ya usa el resto de ADMIN (ningún
 * flujo del sistema envuelve varias tablas en una transacción explícita
 * desde el cliente). El riesgo de una falla a mitad de camino es real
 * pero bajo, y consistente con cómo ya está construido todo lo demás.
 */
/**
 * Registrar una factura — inserta la cabecera y las líneas, y después,
 * según el modo elegido explícitamente en la pantalla (ver
 * docs/sistemas/facturacion-dos-flujos-diseno.md):
 *
 * - Flujo A (`movimientoId` null): genera automáticamente la Deuda
 *   correspondiente (origen='factura', `factura_id` para trazabilidad) —
 *   comportamiento sin cambios desde la primera entrega de Facturación.
 * - Flujo B (`movimientoId` presente): la factura se asocia a ese cobro
 *   ya existente (`facturas.movimiento_id`) — no se crea ninguna Deuda,
 *   el saldo del cliente no se toca para nada. La factura queda como
 *   comprobante fiscal de un cobro que ya estaba registrado.
 *
 * Nota de arquitectura: son inserts secuenciales, no una transacción de
 * base de datos — mismo criterio que ya usa el resto de ADMIN.
 */
/**
 * Registrar una factura — inserta la cabecera y las líneas, y después,
 * según el modo elegido explícitamente en la pantalla (ver
 * docs/sistemas/facturacion-dos-flujos-diseno.md y
 * docs/sistemas/facturacion-tercer-flujo-diseno.md):
 *
 * - Flujo A (`movimientoId` y `deudaId` null): genera automáticamente la
 *   Deuda correspondiente (origen='factura', `factura_id` para
 *   trazabilidad).
 * - Flujo B (`movimientoId` presente): la factura se asocia a ese cobro
 *   ya existente — no se crea ninguna Deuda.
 * - Flujo C (`deudaId` presente): la factura se asocia a esa deuda ya
 *   existente — se actualiza su `factura_id`, no se crea ninguna deuda
 *   nueva. Es el mismo estado final que el Flujo A (una deuda con
 *   `factura_id` cargado) — la diferencia es solo el momento en que pasó.
 *
 * Los tres son mutuamente excluyentes — la pantalla exige elegir
 * exactamente uno.
 */
export function useRegistrarFactura(clienteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      valores,
      movimientoId,
      deudaId
    }: {
      valores: FacturaFormValues
      movimientoId: string | null
      deudaId: string | null
    }) => {
      const facturaId = crypto.randomUUID()
      const total = totalFactura(valores.items)

      const { data: factura, error: errorFactura } = await supabase
        .from('facturas')
        .insert({
          id: facturaId,
          cliente_id: clienteId,
          fecha: valores.fecha,
          total,
          nota: valores.nota.trim() === '' ? null : valores.nota.trim(),
          movimiento_id: movimientoId
        })
        .select()
        .single()
      if (errorFactura) throw errorFactura

      const itemsAInsertar = valores.items.map((item) => ({
        factura_id: facturaId,
        producto_id: item.producto_id,
        descripcion: item.descripcion.trim(),
        cantidad: item.cantidad as number,
        precio_unitario: item.precio_unitario as number,
        iva: item.iva,
        subtotal: subtotalLinea(item)
      }))
      const { error: errorItems } = await supabase.from('factura_items').insert(itemsAInsertar)
      if (errorItems) throw errorItems

      if (deudaId !== null) {
        const { error: errorVincular } = await supabase.from('deudas_clientes').update({ factura_id: facturaId }).eq('id', deudaId)
        if (errorVincular) throw errorVincular
      } else if (movimientoId === null) {
        const { data: config } = await supabase.from('configuracion').select('valor').eq('clave', 'numeracion').maybeSingle()
        const prefijoFacturas = (config?.valor as { facturas?: string } | null)?.facturas ?? 'FAC-'

        const { error: errorDeuda } = await supabase.from('deudas_clientes').insert({
          cliente_id: clienteId,
          origen: 'factura',
          descripcion: `Factura ${formatearNumeroFactura((factura as Factura).numero_interno, prefijoFacturas)}`,
          monto: total,
          fecha: valores.fecha,
          factura_id: facturaId
        })
        if (errorDeuda) throw errorDeuda
      }

      return factura as Factura
    },
    onSuccess: (_factura, { movimientoId, deudaId }) => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] })
      queryClient.invalidateQueries({ queryKey: ['deudas_clientes', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['saldo_cliente', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['saldos_clientes'] })
      if (movimientoId) {
        queryClient.invalidateQueries({ queryKey: ['movimientos', 'cobro', clienteId, 'sin_factura'] })
      }
      if (deudaId) {
        queryClient.invalidateQueries({ queryKey: ['deudas_clientes', clienteId, 'sin_factura'] })
        queryClient.invalidateQueries({ queryKey: ['deudas_clientes', 'pendientes_facturar_siempre'] })
      }
    }
  })
}

/**
 * Deudas sin factura de clientes "Siempre factura" — la "tarea
 * pendiente de facturación" completa: no es una fila guardada en ningún
 * lado, es este cruce, calculado en el momento (ver
 * docs/sistemas/siempre-factura-diseno.md). Global (todos los clientes),
 * para la tarjeta de Pendientes en Inicio y su listado.
 */
export function useDeudasPendientesFacturarSiempreFactura() {
  return useQuery({
    queryKey: ['deudas_clientes', 'pendientes_facturar_siempre'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deudas_clientes')
        .select('*, cliente:clientes!inner(id, nombre_apellido, factura_config)')
        .is('archived_at', null)
        .is('factura_id', null)
        .eq('cliente.factura_config', 'siempre')
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as (Deuda & { cliente: { id: string; nombre_apellido: string; factura_config: string } })[]
    }
  })
}

/**
 * Cargar el número real (emitido en ARCA, por fuera de ADMIN) y/o el PDF
 * oficial — la única edición que admite una factura después de creada
 * (todo lo demás sigue inmutable, ver migración 0033). El `estado` nunca
 * se manda desde acá: lo calcula solo un trigger a partir de si estos dos
 * datos están completos (migración 0036) — así "Emitida" y "tiene los
 * dos datos cargados" no se pueden desincronizar por error humano.
 *
 * Usa el permiso `modificar` de Facturación (RLS, migración 0037) — no
 * es una anulación, por eso no usa `archivar`.
 */
export function useEditarEmisionFactura(facturaId: string, clienteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ numeroExterno, archivo }: { numeroExterno: string; archivo: File | null }) => {
      const comprobante_path = archivo ? await subirAdjunto('facturacion', 'facturas', facturaId, archivo) : undefined

      const { data, error } = await supabase
        .from('facturas')
        .update({
          numero_externo: numeroExterno.trim() === '' ? null : numeroExterno.trim(),
          ...(comprobante_path !== undefined ? { comprobante_path } : {})
        })
        .eq('id', facturaId)
        .select()
        .single()
      if (error) throw error
      return data as Factura
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] })
      queryClient.invalidateQueries({ queryKey: ['facturas', facturaId] })
      queryClient.invalidateQueries({ queryKey: ['facturas', 'cliente', clienteId] })
    }
  })
}

/**
 * Cantidad de facturas pendientes de emitir — para la tarjeta de
 * "Pendientes" en la Pantalla Principal (Sprint 3.1). Cuenta sin traer
 * las filas (`head: true`) — no hace falta el contenido, solo el número.
 */
export function useCantidadFacturasPendientes() {
  return useQuery({
    queryKey: ['facturas', 'pendientes', 'cantidad'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('facturas')
        .select('*', { count: 'exact', head: true })
        .is('archived_at', null)
        .eq('estado', 'pendiente_emitir')
      if (error) throw error
      return count ?? 0
    }
  })
}

/**
 * Set de ids de clientes con al menos una factura pendiente de emitir —
 * para el indicador en el listado de Clientes (Sprint 3.1, punto 6). Solo
 * importa "existe o no", nunca la cantidad — por eso alcanza con traer
 * `cliente_id` y armar un Set, sin agregación en la base.
 */
export function useClientesConFacturasPendientes() {
  return useQuery({
    queryKey: ['facturas', 'pendientes', 'clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('cliente_id')
        .is('archived_at', null)
        .eq('estado', 'pendiente_emitir')
      if (error) throw error
      return new Set((data as { cliente_id: string }[]).map((f) => f.cliente_id))
    }
  })
}

/**
 * Anular una factura — anula primero la Deuda que haya generado (si
 * existe y sigue activa; si no hay ninguna, el update simplemente no
 * afecta filas, sin error) y recién después la factura misma (decisión
 * aprobada 5.1). Así el saldo del cliente se corrige solo.
 */
/**
 * Anular una factura — la deuda vinculada se trata distinto según de
 * dónde vino el vínculo (ver docs/sistemas/siempre-factura-diseno.md,
 * punto 0):
 *
 * - Flujo A (`origen = 'factura'`, la deuda nació junto con la factura):
 *   se anula también — sin la factura, esa deuda no debería haber
 *   existido nunca.
 * - Flujo C (cualquier otro origen, la deuda ya existía y solo se
 *   vinculó después): no se anula — se le limpia `factura_id`, vuelve a
 *   quedar "sin factura" y disponible para facturarse de nuevo. La deuda
 *   en sí nunca estuvo mal, solo se invalidó su comprobante fiscal.
 */
export function useAnularFactura(clienteId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()

  return useMutation({
    mutationFn: async ({ facturaId, motivo }: { facturaId: string; motivo: string }) => {
      const ahora = new Date().toISOString()

      const { data: deudaVinculada } = await supabase
        .from('deudas_clientes')
        .select('id, origen')
        .eq('factura_id', facturaId)
        .is('archived_at', null)
        .maybeSingle()

      if (deudaVinculada) {
        if (deudaVinculada.origen === 'factura') {
          await supabase
            .from('deudas_clientes')
            .update({
              archived_at: ahora,
              anulado_por: usuario?.id,
              motivo_anulacion: 'Anulada automáticamente: la factura que la generó fue anulada.'
            })
            .eq('id', deudaVinculada.id)
        } else {
          await supabase.from('deudas_clientes').update({ factura_id: null }).eq('id', deudaVinculada.id)
        }
      }

      const { data, error } = await supabase
        .from('facturas')
        .update({
          archived_at: ahora,
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', facturaId)
        .select()
        .single()
      if (error) throw error
      return data as Factura
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] })
      queryClient.invalidateQueries({ queryKey: ['deudas_clientes', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['saldo_cliente', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['saldos_clientes'] })
      queryClient.invalidateQueries({ queryKey: ['deudas_clientes', 'pendientes_facturar_siempre'] })
    }
  })
}
