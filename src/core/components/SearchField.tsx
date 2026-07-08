import { Search, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'

export interface SearchFieldProps {
  value: string
  onChange: (valor: string) => void
  placeholder?: string
  className?: string
}

/**
 * Buscador único de ADMIN — el mismo campo en la Pantalla Principal (si
 * algún día busca pendientes), en cada listado de módulo (vía ListView) y
 * en cualquier otro lugar que necesite filtrar por texto. Antes vivía
 * escrito a mano dentro de ListView; se separó para poder reusarlo fuera
 * de un listado también.
 */
export function SearchField({ value, onChange, placeholder = 'Buscar...', className }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full rounded-md border border-border bg-surface pl-9 pr-9 text-sm transition-colors',
          'hover:border-border-strong',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 active:bg-muted"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
