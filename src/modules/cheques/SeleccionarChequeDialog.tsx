import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search } from 'lucide-react'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useChequesDisponiblesParaUsar } from './api'
import type { Cheque } from './types'
import type { TipoMovimiento } from '@/modules/pagos/types'

export interface SeleccionarChequeDialogProps {
  /** "cobro" muestra solo los que nunca se usaron (en_cartera); "pago" suma también los ya recibidos de un cliente (disponible) — ver docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md. */
  tipo: TipoMovimiento
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  onSeleccionar: (cheque: Cheque) => void
}

/** Selector de un cheque de la cartera — mismo patrón que SeleccionarDeudaDialog/SeleccionarCobroDialog de Facturación. */
export function SeleccionarChequeDialog({ tipo, abierto, onOpenChange, onSeleccionar }: SeleccionarChequeDialogProps) {
  const { data: cheques, isLoading } = useChequesDisponiblesParaUsar(tipo)
  const [busqueda, setBusqueda] = React.useState('')

  React.useEffect(() => {
    if (abierto) setBusqueda('')
  }, [abierto])

  const chequesFiltrados = React.useMemo(() => {
    if (!cheques) return []
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return cheques
    return cheques.filter((c) => `${c.banco} ${c.numero} ${c.titular} ${c.importe}`.toLowerCase().includes(termino))
  }, [cheques, busqueda])

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Elegí un cheque de la cartera</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por banco, número, titular..."
              className="w-full rounded-md border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-border-strong"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
            ) : chequesFiltrados.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {cheques?.length === 0 ? 'No hay cheques disponibles en la cartera.' : 'No se encontraron cheques.'}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {chequesFiltrados.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => onSeleccionar(c)}
                      className="flex w-full flex-col gap-0.5 py-2.5 text-left tocable hover:bg-muted/40"
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {c.banco} · {c.numero}
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">{formatearMoneda(c.importe)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.titular} · Vence {formatearFecha(c.fecha_vencimiento)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
