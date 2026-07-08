import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { Button } from './Button'

export interface EmptyStateProps {
  mensaje: string
  icono?: LucideIcon
  accion?: { texto: string; onClick: () => void }
}

/**
 * Estado vacío único de ADMIN: "No hay clientes.", "No hay pendientes.",
 * "No hay resultados.". Un solo componente para que todos los vacíos de
 * la app se vean y se sientan igual, con o sin una acción asociada
 * (ej. "Agregar el primero").
 */
export function EmptyState({ mensaje, icono: Icono = Inbox, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Icono className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{mensaje}</p>
      {accion && (
        <Button accion="neutral" onClick={accion.onClick}>
          {accion.texto}
        </Button>
      )}
    </div>
  )
}
