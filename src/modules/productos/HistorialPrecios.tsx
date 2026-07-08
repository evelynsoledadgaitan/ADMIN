import { Skeleton } from '@/core/components/Skeleton'
import { EmptyState } from '@/core/components/EmptyState'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useHistorialPrecios } from './api'

/**
 * Historial cronológico de precios de un producto — mismo espíritu que
 * HistorialAuditoria/ListaCompras/ListaMovimientos: de solo lectura, sin
 * buscador ni FAB. Los datos ya existen desde la Fase 0 (triggers de
 * historial_precios); acá solo se muestran.
 */
export function HistorialPrecios({ productoId }: { productoId: string }) {
  const { data: historial, isLoading } = useHistorialPrecios(productoId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (!historial || historial.length === 0) {
    return <EmptyState mensaje="Todavía no hay historial de precios." />
  }

  return (
    <ul className="space-y-2">
      {historial.map((item) => (
        <li key={item.id} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{formatearFecha(item.fecha)}</span>
          <span className="font-medium text-foreground">{formatearMoneda(item.precio)}</span>
        </li>
      ))}
    </ul>
  )
}
