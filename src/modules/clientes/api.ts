import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { subirAdjunto } from '@/core/lib/adjuntos'
import { normalizarCuit } from './validaciones'
import type { Cliente, ClienteFormValues, CondicionIva, Deuda, DeudaFormValues } from './types'

/**
 * Listado de clientes activos, ordenados alfabéticamente EN LA CONSULTA
 * (no en el cliente) — así un cliente nuevo aparece en su posición
 * correcta apenas se refresca la lista, sin ordenar nada a mano en React,
 * y el enfoque escala igual de bien con 50 clientes que con 5000 (ver
 * docs/decisiones/0012, rendimiento del listado).
 */
export function useClientes(enabled = true) {
  return useQuery({
    queryKey: ['clientes'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .is('archived_at', null)
        .order('nombre_apellido', { ascending: true })
      if (error) throw error
      return data as Cliente[]
    }
  })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Cliente
    }
  })
}

/**
 * Clientes archivados — Etapa 3, ronda de ajuste ("Restaurar, siempre que
 * el módulo lo permita"). Mismo criterio de orden que useClientes(), pero
 * filtrando lo opuesto. Alimenta la pestaña "Archivados" del listado.
 */
export function useClientesArchivados() {
  return useQuery({
    queryKey: ['clientes', 'archivados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
      if (error) throw error
      return data as Cliente[]
    }
  })
}

export function useCondicionesIva() {
  return useQuery({
    queryKey: ['condiciones_iva'],
    queryFn: async () => {
      const { data, error } = await supabase.from('condiciones_iva').select('*').is('archived_at', null).order('orden')
      if (error) throw error
      return data as CondicionIva[]
    }
  })
}

/** Arma el Insert/Update real a partir de lo que el usuario tipeó — acá vive la única normalización (CUIT) antes de guardar. */
function aRegistro(valores: ClienteFormValues) {
  const esVacio = (v: string) => v.trim() === ''
  return {
    nombre_apellido: valores.nombre_apellido.trim(),
    factura_config: valores.factura_config,
    razon_social: esVacio(valores.razon_social) ? null : valores.razon_social.trim(),
    cuit: esVacio(valores.cuit) ? null : normalizarCuit(valores.cuit),
    condicion_iva_id: esVacio(valores.condicion_iva_id) ? null : valores.condicion_iva_id,
    domicilio_fiscal: esVacio(valores.domicilio_fiscal) ? null : valores.domicilio_fiscal.trim(),
    email: esVacio(valores.email) ? null : valores.email.trim()
  }
}

export function useCrearCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ClienteFormValues) => {
      const { data, error } = await supabase.from('clientes').insert(aRegistro(valores)).select().single()
      if (error) throw error
      return data as Cliente
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })
  })
}

export function useModificarCliente(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: ClienteFormValues) => {
      const { data, error } = await supabase.from('clientes').update(aRegistro(valores)).eq('id', id).select().single()
      if (error) throw error
      return data as Cliente
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', id] })
    }
  })
}

// ---- Deuda (Cuenta Corriente) --------------------------------------------
// Gemela de useCompras/useRegistrarCompra/useAnularCompra
// (modules/proveedores/api.ts) — ver
// docs/sistemas/cuenta-corriente-arquitectura-compartida.md.

/** Deudas de UN cliente, orden cronológico estable: fecha desc, created_at desc. No filtra anuladas — se muestran igual, marcadas. */
export function useDeudasCliente(clienteId: string) {
  return useQuery({
    queryKey: ['deudas_clientes', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deudas_clientes')
        .select('*, usuario_anulacion:usuarios(nombre)')
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (Deuda & { usuario_anulacion: { nombre: string } | null })[]
    }
  })
}

/** Una deuda puntual, por id — para preseleccionarla en Nueva Factura cuando se llega desde Pendientes de facturar (?deuda=ID). */
export function useDeuda(id: string | undefined) {
  return useQuery({
    queryKey: ['deudas_clientes', 'una', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('deudas_clientes').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Deuda
    }
  })
}

export function useRegistrarDeuda(clienteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ valores, archivo }: { valores: DeudaFormValues; archivo: File | null }) => {
      const id = crypto.randomUUID()
      const comprobante_path = archivo ? await subirAdjunto('clientes', 'deudas_clientes', id, archivo) : null

      const { data, error } = await supabase
        .from('deudas_clientes')
        .insert({
          id,
          cliente_id: clienteId,
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
      return data as Deuda
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deudas_clientes', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['saldo_cliente', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['deudas_clientes', 'pendientes_facturar_siempre'] })
    }
  })
}

export function useAnularDeuda(clienteId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('deudas_clientes')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Deuda
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deudas_clientes', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['saldo_cliente', clienteId] })
      queryClient.invalidateQueries({ queryKey: ['deudas_clientes', 'pendientes_facturar_siempre'] })
    }
  })
}
