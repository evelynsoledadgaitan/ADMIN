import * as React from 'react'
import { cn } from '@/core/lib/utils'

/**
 * Estilo único de "tarjeta" de ADMIN — identidad visual definitiva,
 * Etapa 2: radio 12px (token `--radius`), sombra casi imperceptible
 * (`.sombra-tarjeta`) además del borde, más padding que antes (1.25rem)
 * para dar más aire. Se expone también como función (`cardClassName`)
 * para los pocos casos donde la tarjeta debe ser un elemento distinto de
 * <div> por motivos de accesibilidad — por ejemplo un <button> tocable
 * (ver pages/menu/Menu.tsx) — y necesita el mismo aspecto sin perder la
 * semántica correcta de botón.
 */
export function cardClassName(interactivo = false) {
  return cn(
    'rounded-lg border border-border bg-surface p-5 sombra-tarjeta',
    interactivo && 'tocable hover:border-border-strong active:bg-muted/50 cursor-pointer transition-colors'
  )
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactivo?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactivo = false, ...props }, ref) => (
    <div ref={ref} className={cn(cardClassName(interactivo), className)} {...props} />
  )
)
Card.displayName = 'Card'
