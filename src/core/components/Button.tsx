import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/core/lib/utils'

/**
 * Botón semántico único para todo ADMIN.
 * Reglas del proyecto (no negociables):
 *   Guardar    -> verde
 *   Modificar  -> amarillo
 *   Cancelar   -> gris
 *   Archivar   -> negro
 * Ningún módulo debe crear su propio botón de color distinto para estas
 * acciones. Si una pantalla necesita una acción que no es ninguna de estas
 * cuatro, usar la variante "neutral" y consultar antes de inventar un color.
 *
 * Identidad visual definitiva, Etapa 2 — "mayor protagonismo": el color
 * de cada acción NO cambió (sigue siendo la misma regla de siempre), lo
 * que cambia es el peso visual. Guardar/Modificar/Archivar mantienen
 * relleno sólido + una sombra sutil (`.sombra-boton-principal`) — son
 * decisiones, deben notarse. Cancelar pasa a un tratamiento más liviano
 * (borde, sin relleno) porque casi siempre acompaña a una acción
 * principal y no debería competir con ella en peso visual — sigue siendo
 * inconfundiblemente "la opción gris de cancelar", solo que ya no grita
 * tan fuerte como Guardar al lado.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none h-10 px-4',
  {
    variants: {
      accion: {
        guardar: 'bg-guardar text-guardar-foreground hover:opacity-90 sombra-boton-principal',
        modificar: 'bg-modificar text-modificar-foreground hover:opacity-90 sombra-boton-principal',
        cancelar: 'bg-transparent text-muted-foreground border border-border-strong hover:bg-muted font-medium',
        archivar: 'bg-archivar text-archivar-foreground hover:opacity-90 sombra-boton-principal',
        neutral: 'bg-surface text-foreground border border-border hover:bg-muted font-medium'
      }
    },
    defaultVariants: { accion: 'neutral' }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Ícono opcional a la izquierda del texto (16px). Refuerza reconocimiento en las acciones principales. */
  icono?: LucideIcon
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, accion, icono: Icono, children, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ accion }), className)} {...props}>
      {Icono && <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
