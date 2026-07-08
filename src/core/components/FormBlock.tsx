import * as React from 'react'
import { cn, LABEL_CAMPO } from '@/core/lib/utils'

/**
 * Bloque de formulario: agrupa campos relacionados con un título opcional.
 * El brief pide "formularios organizados por bloques" — este componente es
 * la única forma de armar esa organización en todo ADMIN.
 *
 * Identidad visual definitiva, Etapa 2: el título pasa a ser una etiqueta
 * editorial (chica, mayúscula) *arriba* de la tarjeta, no un heading
 * adentro — es el tratamiento que se aprobó en los mockups de Alta de
 * Cliente. La tarjeta en sí suma la sombra sutil compartida.
 *
 * Etapa 3: `columnas={2}` acomoda los campos en 2 columnas *solo en
 * escritorio* (`md:` — en celular siempre es 1 columna, sin excepción).
 * Techo de 2, nunca más — un formulario con 3+ columnas se vuelve difícil
 * de escanear de arriba a abajo, que es como se completa un formulario en
 * la práctica.
 */
export function FormBlock({
  titulo,
  children,
  className,
  columnas = 1
}: {
  titulo?: string
  children: React.ReactNode
  className?: string
  columnas?: 1 | 2
}) {
  return (
    <div className={className}>
      {titulo && <p className={cn(LABEL_CAMPO, 'mb-2 px-0.5')}>{titulo}</p>}
      <section className="rounded-lg border border-border bg-surface p-4 sombra-tarjeta">
        <div className={cn('grid gap-4', columnas === 2 && 'md:grid-cols-2')}>{children}</div>
      </section>
    </div>
  )
}

/**
 * Campo de texto con crecimiento automático (textarea que crece con el
 * contenido), pedido explícitamente para "campos largos" en el brief.
 */
export const CampoTextoLargo = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }
>(({ label, className, onInput, ...props }, ref) => {
  function autoGrow(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    onInput?.(e)
  }

  return (
    <label className="grid gap-1.5 text-sm">
      <span className={LABEL_CAMPO}>{label}</span>
      <textarea
        ref={ref}
        rows={1}
        onInput={autoGrow}
        className={cn(
          'resize-none overflow-hidden rounded-md border border-border bg-surface px-3 py-2 text-sm transition-colors',
          'hover:border-border-strong',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
          className
        )}
        {...props}
      />
    </label>
  )
})
CampoTextoLargo.displayName = 'CampoTextoLargo'
