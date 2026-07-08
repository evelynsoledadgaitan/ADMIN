import { Landmark, Briefcase, FileText } from 'lucide-react'
import type { TipoObligacion } from './types'

/**
 * Distinción visual entre Honorarios (del contador) e Impuestos — pedido
 * explícito. No usa color (los colores ya están ocupados por el estado,
 * que es lo que se pidió priorizar) — usa un ícono distinto por tipo.
 */
const ICONOS: Record<TipoObligacion, typeof Landmark> = {
  impuesto: Landmark,
  honorario: Briefcase,
  otro: FileText
}

export function TipoObligacionIcono({ tipo, className = 'h-4 w-4' }: { tipo: TipoObligacion; className?: string }) {
  const Icono = ICONOS[tipo]
  return <Icono className={`shrink-0 text-muted-foreground ${className}`} aria-hidden="true" />
}
