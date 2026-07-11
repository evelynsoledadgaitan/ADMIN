import { useQuery } from '@tanstack/react-query'
import { FilePlus2, Pencil, Archive } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

type TablaAuditable = 'clientes' | 'proveedores' | 'productos' | 'empleados' | 'obligaciones_contador' | 'cheques'

const ICONOS = { insert: FilePlus2, update: Pencil, archive: Archive } as const
const ETIQUETAS = { insert: 'Creado', update: 'Modificado', archive: 'Archivado' } as const

const formateadorFecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Historial de auditoría de UN registro puntual, genérico para cualquier
 * módulo con triggers de auditoría (ver docs/decisiones/0002). No es un
 * ListView: es de solo lectura, sin buscador ni FAB — un simple listado
 * cronológico. Requiere que el usuario tenga permiso de VER la tabla de
 * origen o de Informes (ver migración 0010 y docs/decisiones/0012).
 */
export function HistorialAuditoria({ tabla, registroId }: { tabla: TablaAuditable; registroId: string }) {
  const { data: eventos, isLoading, isError } = useQuery({
    queryKey: ['audit_log', tabla, registroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('id, accion, fecha, usuario:usuarios(nombre)')
        .eq('tabla', tabla)
        .eq('registro_id', registroId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (isError) {
    return <EmptyState mensaje="No se pudo cargar la actividad." />
  }

  if (!eventos || eventos.length === 0) {
    return <EmptyState mensaje="Todavía no hay actividad registrada." />
  }

  return (
    <ul className="space-y-3">
      {eventos.map((evento) => {
        const Icono = ICONOS[evento.accion as keyof typeof ICONOS]
        // usuario puede venir null si el registro se creó antes de tener un usuario asociado (ej. seed/migración)
        const nombreUsuario = (evento.usuario as unknown as { nombre: string } | null)?.nombre ?? 'Sistema'
        return (
          <li key={evento.id} className="flex items-start gap-3 text-sm">
            <Icono className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-medium text-foreground">{ETIQUETAS[evento.accion as keyof typeof ETIQUETAS]}</span>
              <span className="text-muted-foreground"> · {nombreUsuario} · {formateadorFecha.format(new Date(evento.fecha))}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
