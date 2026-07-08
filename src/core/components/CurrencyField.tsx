import * as React from 'react'
import { cn, LABEL_CAMPO } from '@/core/lib/utils'

const formateador = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

function aTextoVisible(valor: number | null): string {
  if (valor === null || Number.isNaN(valor)) return ''
  return formateador.format(valor)
}

/** "12.345,67" (formato es-AR) -> 12345.67. Vacío o inválido -> null. */
function aNumero(texto: string): number | null {
  const limpio = texto.replace(/\./g, '').replace(',', '.').trim()
  if (limpio === '') return null
  const numero = Number(limpio)
  return Number.isNaN(numero) ? null : numero
}

export interface CurrencyFieldProps {
  label: string
  value: number | null
  onValueChange: (valor: number | null) => void
  disabled?: boolean
  error?: string
}

/**
 * Campo monetario único de ADMIN: formato $ es-AR (punto de miles, coma
 * decimal), igual en Productos, Cheques, Empleados o cualquier otro monto.
 * Guarda internamente el texto que el usuario está escribiendo y solo
 * confirma el número cuando el campo pierde el foco — así no se pelea con
 * el usuario mientras todavía está tipeando la coma decimal.
 */
export function CurrencyField({ label, value, onValueChange, disabled, error }: CurrencyFieldProps) {
  const [texto, setTexto] = React.useState(aTextoVisible(value))
  const [enFoco, setEnFoco] = React.useState(false)

  React.useEffect(() => {
    if (!enFoco) setTexto(aTextoVisible(value))
  }, [value, enFoco])

  return (
    <label className="grid gap-1.5 text-sm">
      <span className={LABEL_CAMPO}>{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        <input
          inputMode="decimal"
          disabled={disabled}
          value={texto}
          onFocus={() => setEnFoco(true)}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => {
            setEnFoco(false)
            const numero = aNumero(texto)
            onValueChange(numero)
            setTexto(aTextoVisible(numero))
          }}
          className={cn(
            'h-11 w-full rounded-md border border-border bg-surface pl-7 pr-3 text-sm text-right tabular-nums transition-colors',
            'hover:border-border-strong',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
            error && 'border-error focus-visible:ring-error'
          )}
          aria-invalid={!!error}
        />
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  )
}
