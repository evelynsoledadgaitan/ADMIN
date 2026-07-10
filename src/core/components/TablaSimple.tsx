import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

export interface ColumnaTablaSimple<T> {
  clave: string
  encabezado: string
  alineacion?: 'left' | 'right'
  render: (item: T) => React.ReactNode
}

/**
 * Tabla simple de solo lectura — mismo criterio que `LibroCuentaCorriente`
 * (una sola tabla con scroll horizontal, sin duplicar la infraestructura
 * de `DataTable`/`ListView` para algo que no necesita alta ni acciones
 * complejas por fila). Sin buscador ni paginación a propósito.
 *
 * Vivía en `modules/informes/` (se llamaba `TablaInforme`) — se promovió
 * acá cuando Facturación también la necesitó (Pendientes de facturar de
 * clientes "Siempre factura"), para no hacer que un módulo dependiera de
 * otro solo por un componente de presentación genérico.
 */
export function TablaSimple<T>({
  items,
  columnas,
  getKey,
  emptyMensaje,
  cargando,
  onRowClick
}: {
  items: T[]
  columnas: ColumnaTablaSimple<T>[]
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
