import { Skeleton } from '@/core/components/Skeleton'
import { EmptyState } from '@/core/components/EmptyState'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { construirLibroCC, type FilaLibroCC, type FilaLibroConSaldo } from './libro'

/**
 * Tabla del libro contable — Fecha / Concepto / Debe / Haber / Saldo
 * acumulado, orden cronológico ascendente. Único componente compartido
 * entre el Estado de Cuenta de Clientes y el de Proveedores — arma las
 * columnas a partir de `construirLibroCC`, no sabe nada de negocio.
 *
 * `onFilaClick` es opcional: quien lo pasa decide qué hacer al tocar una
 * fila (típicamente, abrir el detalle/anulación del registro real detrás
 * de esa fila — ver EstadoCuentaCliente.tsx/EstadoCuentaProveedor.tsx,
 * que usan el prefijo del `id` para saber si es una deuda, un movimiento
 * o un ajuste). Sin ese callback, la tabla es de solo lectura.
 */
export function LibroCuentaCorriente({
  filas,
  cargando = false,
  onFilaClick
}: {
  filas: FilaLibroCC[]
  cargando?: boolean
  onFilaClick?: (fila: FilaLibroConSaldo) => void
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

  if (filas.length === 0) {
    return <EmptyState mensaje="Todavía no hay movimientos." />
  }

  const libro = construirLibroCC(filas)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
            <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Concepto</th>
            <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Debe</th>
            <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Haber</th>
            <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {libro.map((fila) => (
            <tr
              key={fila.id}
              onClick={() => onFilaClick?.(fila)}
              className={`border-t border-border ${fila.anulado ? 'opacity-50' : ''} ${onFilaClick ? 'cursor-pointer hover:bg-muted/40' : ''}`}
            >
              <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{formatearFecha(fila.fecha)}</td>
              <td className="px-2 py-2 text-foreground">
                {fila.concepto}
                {fila.badge && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      fila.badge.tono === 'exito' ? 'bg-exito/10 text-exito' : 'bg-advertencia/10 text-advertencia'
                    }`}
                  >
                    {fila.badge.texto}
                  </span>
                )}
                {fila.anulado && <span className="ml-2 text-xs font-semibold text-error">ANULADO</span>}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-foreground">
                {fila.debe !== null ? formatearMoneda(fila.debe) : ''}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-foreground">
                {fila.haber !== null ? formatearMoneda(fila.haber) : ''}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums font-medium text-foreground">
                {formatearMoneda(fila.saldoAcumulado)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
