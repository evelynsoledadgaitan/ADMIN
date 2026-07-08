import { cn } from '@/core/lib/utils'

/**
 * Placeholder "pulsante" único de ADMIN para contenido que todavía está
 * cargando (ej. una fila de ListView mientras llega la respuesta de
 * Supabase). Se usa como bloque de tamaño fijo que imita la forma del
 * contenido real, para que la pantalla no "salte" cuando los datos llegan.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

/** Fila de skeleton lista para usar dentro de un ListView mientras carga. */
export function SkeletonFila() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}
