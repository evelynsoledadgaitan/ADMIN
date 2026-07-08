import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { subirAdjunto } from '@/core/lib/adjuntos'
import { calcularEstadoVencimiento } from './types'
import { hoyISO } from './validaciones'
import type {
  Obligacion,
  VencimientoFormValues,
  DocumentoContador,
  DocumentoContadorFormValues,
  TipoDocumentoContador
} from './types'

// ---- Vencimientos (obligaciones_contador) ----------------------------------

export function useVencimientos() {
  return useQuery({
    queryKey: ['obligaciones_contador'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligaciones_contador')
        .select('*')
        .is('archived_at', null)
        .order('fecha_vencimiento', { ascending: true })
      if (error) throw error
      return data as Obligacion[]
    }
  })
}

export function useVencimientosArchivados() {
  return useQuery({
    queryKey: ['obligaciones_contador', 'archivados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligaciones_contador')
        .select('*')
        .not('archived_at', 'is', null)
        .order('fecha_vencimiento', { ascending: false })
      if (error) throw error
      return data as Obligacion[]
    }
  })
}

export function useVencimiento(id: string | undefined) {
  return useQuery({
    queryKey: ['obligaciones_contador', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('obligaciones_contador').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Obligacion
    }
  })
}

/** Cantidad de vencimientos vencidos o próximos a vencer — para la tarjeta de Pendientes en Inicio. Livianas: se traen solo las fechas, el cálculo de estado es en el cliente. */
export function useCantidadVencimientosPendientes() {
  return useQuery({
    queryKey: ['obligaciones_contador', 'pendientes', 'cantidad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligaciones_contador')
        .select('fecha_pago, fecha_vencimiento')
        .is('archived_at', null)
        .is('fecha_pago', null)
      if (error) throw error
      const hoy = hoyISO()
      return (data as Pick<Obligacion, 'fecha_pago' | 'fecha_vencimiento'>[]).filter(
        (o) => calcularEstadoVencimiento(o, hoy) === 'vencida' || calcularEstadoVencimiento(o, hoy) === 'proxima_a_vencer'
      ).length
    }
  })
}

export function useRegistrarVencimiento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: VencimientoFormValues) => {
      const { data, error } = await supabase
        .from('obligaciones_contador')
        .insert({
          tipo: valores.tipo,
          concepto: valores.concepto.trim(),
          monto: valores.monto,
          fecha_vencimiento: valores.fecha_vencimiento,
          nota: valores.nota.trim() === '' ? null : valores.nota.trim()
        })
        .select()
        .single()
      if (error) throw error
      return data as Obligacion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligaciones_contador'] })
    }
  })
}

/** Marcar como pagada — la única edición que admite un vencimiento después de creado (mismo criterio que el número real de ARCA en Facturación). */
export function useMarcarPagada(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ fechaPago, archivo }: { fechaPago: string; archivo: File | null }) => {
      const comprobante_path = archivo ? await subirAdjunto('contador', 'obligaciones_contador', id, archivo) : undefined

      const { data, error } = await supabase
        .from('obligaciones_contador')
        .update({
          fecha_pago: fechaPago,
          ...(comprobante_path !== undefined ? { comprobante_path } : {})
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Obligacion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligaciones_contador'] })
      queryClient.invalidateQueries({ queryKey: ['obligaciones_contador', id] })
    }
  })
}

export function useAnularVencimiento() {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('obligaciones_contador')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Obligacion
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['obligaciones_contador'] })
  })
}

// ---- Documentación general --------------------------------------------------

export function useDocumentosContador() {
  return useQuery({
    queryKey: ['documentos_contador'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_contador')
        .select('*, usuario_anulacion:usuarios(nombre)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (DocumentoContador & { usuario_anulacion: { nombre: string } | null })[]
    }
  })
}

export function useAgregarDocumentoContador() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ valores, archivo }: { valores: DocumentoContadorFormValues; archivo: File }) => {
      const id = crypto.randomUUID()
      const comprobante_path = await subirAdjunto('contador', 'documentos_contador', id, archivo)

      const { data, error } = await supabase
        .from('documentos_contador')
        .insert({
          id,
          tipo_documento: valores.tipo_documento as TipoDocumentoContador,
          descripcion_otro: valores.tipo_documento === 'otro' ? valores.descripcion_otro.trim() : null,
          comprobante_path
        })
        .select()
        .single()
      if (error) throw error
      return data as DocumentoContador
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos_contador'] })
  })
}

export function useAnularDocumentoContador() {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('documentos_contador')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DocumentoContador
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos_contador'] })
  })
}
