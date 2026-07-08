import { Archive } from 'lucide-react'
import { formatearFecha } from '@/core/lib/format'

export interface BadgeArchivadoProps {
  /** "Archivado" (dato maestro) o "Anulado"/"Anulada" (registro inmutable) — cada módulo decide cuál corresponde. */
  texto?: string
  /** Si se pasa, agrega " el {fecha}" — algunas Fichas lo muestran, otras no (se respeta el comportamiento de cada una, no se fuerza a todas). */
  fecha?: string | null
  /** Algunas Fichas mostraban un ícono de archivo, otras no — se respeta caso por caso. */
  icono?: boolean
  className?: string
}

/**
 * Insignia "Archivado"/"Anulado" de una Ficha — versión grande. Antes
 * era el mismo bloque de clases, copiado en 6 Fichas distintas (Etapa 1
 * de limpieza interna, informe de UX punto 4). Mismo aspecto visual que
 * ya tenía cada una — unificar el componente no cambia lo que se ve.
 */
export function BadgeArchivado({ texto = 'Archivado', fecha, icono, className = '' }: BadgeArchivadoProps) {
  return (
    <div
      className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground ${className}`}
    >
      {icono && <Archive className="h-3 w-3" aria-hidden="true" />}
      {texto}
      {fecha && ` el ${formatearFecha(fecha)}`}
    </div>
  )
}

/**
 * Insignia "Archivado" de una fila de listado — versión chica, en línea
 * junto al nombre. Antes copiada en 4 listados.
 */
export function BadgeArchivadoChico({ texto = 'Archivado' }: { texto?: string }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {texto}
    </span>
  )
}
