import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { hoyISO } from '@/core/lib/format'
import type { Nota, NotaFormValues } from './types'

export function useNotas() {
  return useQuery({
    queryKey: ['notas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Nota[]
    }
  })
}

export function useNotasArchivadas() {
  return useQuery({
    queryKey: ['notas', 'archivadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .not('archived_at', 'is', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Nota[]
    }
  })
}

export function useNota(id: string | undefined) {
  return useQuery({
    queryKey: ['notas', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('notas').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Nota
    }
  })
}

/** Notas con recordatorio de hoy o vencido, sin realizar — para la tarjeta de Pendientes en Inicio. Trae los ids (no solo la cantidad) para poder abrir la nota directo cuando hay una sola. */
export function useRecordatoriosPendientes() {
  return useQuery({
    queryKey: ['notas', 'pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .select('id')
        .is('archived_at', null)
        .eq('realizada', false)
        .not('recordatorio', 'is', null)
        .lte('recordatorio', hoyISO())
      if (error) throw error
      return data as { id: string }[]
    }
  })
}

function limpiar(valores: NotaFormValues) {
  return {
    titulo: valores.titulo.trim(),
    descripcion: valores.descripcion.trim() === '' ? null : valores.descripcion.trim(),
    fecha: valores.fecha === '' ? null : valores.fecha,
    recordatorio: valores.recordatorio === '' ? null : valores.recordatorio
  }
}

export function useCrearNota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: NotaFormValues) => {
      const { data, error } = await supabase.from('notas').insert(limpiar(valores)).select().single()
      if (error) throw error
      return data as Nota
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas'] })
    }
  })
}

/** Edición directa — la única excepción a la inmutabilidad de todo ADMIN (decisión aprobada, ver docs/sistemas/notas-diseno.md). */
export function useModificarNota(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: NotaFormValues) => {
      const { data, error } = await supabase.from('notas').update(limpiar(valores)).eq('id', id).select().single()
      if (error) throw error
      return data as Nota
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas'] })
      queryClient.invalidateQueries({ queryKey: ['notas', id] })
    }
  })
}

/** Marcar como realizada / deshacer — independiente de archivar (decisión aprobada, punto 4). */
export function useToggleRealizada() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, realizada }: { id: string; realizada: boolean }) => {
      const { error } = await supabase.from('notas').update({ realizada }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notas'] })
  })
}
