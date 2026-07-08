import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { subirAdjunto } from '@/core/lib/adjuntos'
import { DATOS_NEGOCIO_VACIO, PREFIJOS_DEFAULT } from './types'
import type { DatosNegocio, PrefijosNumeracion, Usuario, Permiso } from './types'

// ---- Datos del negocio -------------------------------------------------------

/**
 * Se guarda como una única fila en `configuracion` (clave='datos_negocio'),
 * la tabla clave/valor que existe desde la Fase 0 y nunca se había usado
 * — no hizo falta ninguna tabla nueva. Lectura abierta a cualquier
 * usuario autenticado (migración 0050): esta información aparece en
 * documentos que cualquiera puede generar, no solo quien administra
 * Configuración.
 */
export function useDatosNegocio() {
  return useQuery({
    queryKey: ['configuracion', 'datos_negocio'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracion').select('valor').eq('clave', 'datos_negocio').maybeSingle()
      if (error) throw error
      return { ...DATOS_NEGOCIO_VACIO, ...((data?.valor as Partial<DatosNegocio>) ?? {}) }
    }
  })
}

export function useGuardarDatosNegocio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ valores, logo }: { valores: DatosNegocio; logo: File | null }) => {
      let logo_path = valores.logo_path
      if (logo) {
        logo_path = await subirAdjunto('configuracion', 'datos_negocio', 'logo', logo)
      }
      const { error } = await supabase
        .from('configuracion')
        .upsert({ clave: 'datos_negocio', valor: { ...valores, logo_path } })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion', 'datos_negocio'] })
  })
}

// ---- Numeración ---------------------------------------------------------------

export function useNumeracion() {
  return useQuery({
    queryKey: ['configuracion', 'numeracion'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracion').select('valor').eq('clave', 'numeracion').maybeSingle()
      if (error) throw error
      return { ...PREFIJOS_DEFAULT, ...((data?.valor as Partial<PrefijosNumeracion>) ?? {}) }
    }
  })
}

export function useGuardarNumeracion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: PrefijosNumeracion) => {
      const { error } = await supabase.from('configuracion').upsert({ clave: 'numeracion', valor: valores })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion', 'numeracion'] })
  })
}

// ---- Usuarios y permisos --------------------------------------------------------

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase.from('usuarios').select('*').order('nombre')
      if (error) throw error
      return data as Usuario[]
    }
  })
}

export function usePermisosUsuario(usuarioId: string) {
  return useQuery({
    queryKey: ['permisos', usuarioId],
    enabled: !!usuarioId,
    queryFn: async () => {
      const { data, error } = await supabase.from('permisos').select('*').eq('usuario_id', usuarioId)
      if (error) throw error
      return data as Permiso[]
    }
  })
}

/** Activar/desactivar un usuario existente — nunca se crea uno nuevo desde acá (límite técnico real, ver docs/sistemas/configuracion-diseno.md). */
export function useCambiarActivoUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from('usuarios').update({ activo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] })
  })
}

/**
 * Guarda la matriz completa de permisos de un usuario de una vez —
 * borra los que ya tenía y vuelve a insertar los que quedaron tildados.
 * Más simple que ir comparando fila por fila qué cambió, y el volumen
 * (una decena de módulos como mucho) no justifica optimizarlo.
 */
export function useGuardarPermisos(usuarioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (permisos: Omit<Permiso, 'id' | 'usuario_id'>[]) => {
      const { error: errorDelete } = await supabase.from('permisos').delete().eq('usuario_id', usuarioId)
      if (errorDelete) throw errorDelete

      const aInsertar = permisos.filter((p) => p.puede_ver || p.puede_crear || p.puede_modificar || p.puede_archivar)
      if (aInsertar.length > 0) {
        const { error: errorInsert } = await supabase
          .from('permisos')
          .insert(aInsertar.map((p) => ({ ...p, usuario_id: usuarioId })))
        if (errorInsert) throw errorInsert
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permisos', usuarioId] })
  })
}

// ---- Catálogos genéricos (Condición de IVA, Medios de pago, Modalidades de pago) --

export function useCrearItemCatalogo(tabla: 'condiciones_iva' | 'medios_pago' | 'modalidades_pago_empleado') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { error } = await supabase.from(tabla).insert({ nombre: nombre.trim() })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tabla] })
  })
}

export function useModificarItemCatalogo(tabla: 'condiciones_iva' | 'medios_pago' | 'modalidades_pago_empleado') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nombre }: { id: string; nombre: string }) => {
      const { error } = await supabase.from(tabla).update({ nombre: nombre.trim() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tabla] })
  })
}

/** Las 3 tablas, incluyendo los archivados — la versión "activos" ya la usa cada módulo (useMediosPago, useCondicionesIva, useModalidadesPago). */
export function useCatalogoCompleto(tabla: 'condiciones_iva' | 'medios_pago' | 'modalidades_pago_empleado') {
  return useQuery({
    queryKey: [tabla, 'completo'],
    queryFn: async () => {
      const { data, error } = await supabase.from(tabla).select('*').order('nombre')
      if (error) throw error
      return data as { id: string; nombre: string; archived_at: string | null }[]
    }
  })
}
