import * as React from 'react'
import { cn, LABEL_CAMPO } from '@/core/lib/utils'

/**
 * Selector de fecha único de ADMIN. Usa el <input type="date"> nativo a
 * propósito: en Android abre el selector de fecha nativo del sistema, que
 * es más rápido y más cómodo con el pulgar que cualquier calendario propio
 * que podamos construir — y es exactamente el criterio del brief
 * ("celular primero", "excelente experiencia táctil"). Value/onChange
 * trabajan con string ISO (YYYY-MM-DD), que es lo que Postgres espera.
 */
export const DateField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(({ label, error, className, ...props }, ref) => (
  <label className="grid gap-1.5 text-sm">
    <span className={LABEL_CAMPO}>{label}</span>
    <input
      ref={ref}
      type="date"
      className={cn(
        'h-11 rounded-md border border-border bg-surface px-3 text-sm transition-colors',
        'hover:border-border-strong',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
        error && 'border-error focus-visible:ring-error',
        className
      )}
      aria-invalid={!!error}
      {...props}
    />
    {error && <span className="text-xs text-error">{error}</span>}
  </label>
))
DateField.displayName = 'DateField'
