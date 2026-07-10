import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search } from 'lucide-react'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { ETIQUETAS_ORIGEN_DEUDA } from '@/modules/clientes/types'
import { useDeudasSinFactura } from './api'
import type { Deuda } from '@/modules/clientes/types'

export interface SeleccionarDeudaDialogProps {
  clienteId: string
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  onSeleccionar: (deuda: Deuda) => void
}

/**
 * Selector de deuda para el Flujo C de Facturación ("Es el comprobante de
 * una deuda ya generada") — mismo componente y mismo criterio que
 * `SeleccionarCobroDialog` del Flujo B, adaptado a deudas. Sin límite de
 * tiempo, con buscador.
 */
export function SeleccionarDeudaDialog({ clienteId, abierto, onOpenChange, onSeleccionar }: SeleccionarDeudaDialogProps) {
  const { data: deudas, isLoading } = useDeudasSinFactura(clienteId)
  const [busqueda, setBusqueda] = React.useState('')

  React.useEffect(() => {
    if (abierto) setBusqueda('')
  }, [abierto])

  const deudasFiltradas = React.useMemo(() => {
    if (!deudas) return []
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return deudas
    return deudas.filter((d) => {
      const texto = `${formatearFecha(d.fecha)} ${d.descripcion} ${d.monto}`.toLowerCase()
      return texto.includes(termino)
    })
  }, [deudas, busqueda])

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Elegí la deuda</Dialog.Title>
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
              placeholder="Buscar por fecha, monto, descripción..."
              className="w-full rounded-md border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-border-strong"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
            ) : deudasFiltradas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {deudas?.length === 0 ? 'Este cliente no tiene deudas sin factura.' : 'No se encontraron deudas.'}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {deudasFiltradas.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => onSeleccionar(d)}
                      className="flex w-full flex-col gap-0.5 py-2.5 text-left tocable hover:bg-muted/40"
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{formatearFecha(d.fecha)}</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">{formatearMoneda(d.monto)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {d.descripcion} · {ETIQUETAS_ORIGEN_DEUDA[d.origen]}
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
