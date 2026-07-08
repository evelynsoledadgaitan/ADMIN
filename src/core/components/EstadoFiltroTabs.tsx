import { cn } from '@/core/lib/utils'

export type EstadoFiltro = 'activos' | 'archivados'

/**
 * Selector Activos/Archivados — el mismo componente en celular y en
 * escritorio, para que "ver y restaurar archivados" no sea una capacidad
 * exclusiva de un dispositivo (Etapa 3, ronda de ajuste). Quien lo usa
 * decide qué consulta disparar según el valor — este componente no sabe
 * nada de clientes/proveedores/productos, solo de "activos vs. archivados".
 */
export function EstadoFiltroTabs({
  valor,
  onChange,
  cantidadArchivados
}: {
  valor: EstadoFiltro
  onChange: (valor: EstadoFiltro) => void
  cantidadArchivados?: number
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      <button
        onClick={() => onChange('activos')}
        className={cn(
          'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
          valor === 'activos' ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground'
        )}
      >
        Activos
      </button>
      <button
        onClick={() => onChange('archivados')}
        className={cn(
          'rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors',
          valor === 'archivados' ? 'bg-surface text-foreground shadow-sm font-semibold' : 'text-muted-foreground'
        )}
      >
        Archivados{cantidadArchivados !== undefined && <span className="text-muted-foreground"> ({cantidadArchivados})</span>}
      </button>
    </div>
  )
}
