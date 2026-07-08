import type { Database } from '@/lib/supabase/database.types'

export type Nota = Database['public']['Tables']['notas']['Row']

export interface NotaFormValues {
  titulo: string
  descripcion: string
  fecha: string // ISO yyyy-mm-dd, vacío si no se cargó
  recordatorio: string // ISO yyyy-mm-dd, vacío si no se cargó
}

export function valoresNotaVacio(): NotaFormValues {
  return { titulo: '', descripcion: '', fecha: '', recordatorio: '' }
}

export function notaAFormValues(nota: Nota): NotaFormValues {
  return {
    titulo: nota.titulo,
    descripcion: nota.descripcion ?? '',
    fecha: nota.fecha ?? '',
    recordatorio: nota.recordatorio ?? ''
  }
}
