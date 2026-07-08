import * as React from 'react'
import { cn, LABEL_CAMPO } from '@/core/lib/utils'

/**
 * Campo de texto de una sola línea — el compañero de CampoTextoLargo
 * (ver FormBlock.tsx) para todo lo que no necesita crecer: nombre, email,
 * CUIT, código de barras, etc. Mismo aspecto visual que el resto de los
 * campos de formulario (Select, CampoTextoLargo).
 */
export const TextField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(({ label, error, className, ...props }, ref) => (
  <label className="grid gap-1.5 text-sm">
    <span className={LABEL_CAMPO}>{label}</span>
    <input
      ref={ref}
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
TextField.displayName = 'TextField'
