import { Plus } from 'lucide-react'
import { cn } from '@/core/lib/utils'

/**
 * Botón flotante "+" — obligatorio en todos los listados según el brief.
 * Un único componente para que su posición, tamaño y comportamiento
 * sean idénticos en Clientes, Proveedores, Productos, etc.
 */
export function FloatingActionButton({
  onClick,
  label = 'Agregar'
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed z-40 flex h-14 w-14 items-center justify-center right-6',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6',
        'rounded-full bg-primary text-primary-foreground shadow-lg',
        'hover:opacity-90 active:scale-95 transition-transform'
      )}
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
