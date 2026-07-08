import { Skeleton } from '@/core/components/Skeleton'
import { EmptyState } from '@/core/components/EmptyState'

export interface ColumnaInforme<T> {
  clave: string
  encabezado: string
  alineacion?: 'left' | 'right'
  render: (item: T) => React.ReactNode
}

/**
 * Tabla simple de solo lectura, compartida por todos los informes —
 * mismo criterio que `LibroCuentaCorriente` (una sola tabla con scroll
 * horizontal, sin duplicar la infraestructura de `DataTable`/`ListView`
 * para algo que no necesita alta ni acciones por fila). Sin buscador ni
 * paginación a propósito: para volúmenes de un único negocio, y con
 * Exportar cubriendo "quiero llevarme todo", no hacía falta más.
 */
export function TablaInforme<T>({
  items,
  columnas,
  getKey,
  emptyMensaje,
  cargando,
  onRowClick
}: {
  items: T[]
  columnas: ColumnaInforme<T>[]
  getKey: (item: T) => string
  emptyMensaje: string
  cargando?: boolean
  onRowClick?: (item: T) => void
}) {
  if (cargando) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (items.length === 0) {
    return <EmptyState mensaje={emptyMensaje} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th
                key={c.clave}
                className={`px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${c.alineacion === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={getKey(item)}
              onClick={() => onRowClick?.(item)}
              className={`border-t border-border ${onRowClick ? 'cursor-pointer hover:bg-muted/40' : ''}`}
            >
              {columnas.map((c) => (
                <td key={c.clave} className={`px-2 py-2 text-foreground ${c.alineacion === 'right' ? 'text-right tabular-nums' : ''}`}>
                  {c.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
