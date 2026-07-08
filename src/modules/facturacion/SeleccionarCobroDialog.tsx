import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search } from 'lucide-react'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useMediosPago } from '@/modules/pagos/api'
import { useCobrosSinFactura } from './api'
import type { Movimiento } from '@/modules/pagos/types'

export interface SeleccionarCobroDialogProps {
  clienteId: string
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  onSeleccionar: (cobro: Movimiento) => void
}

/**
 * Selector de cobro para el Flujo B de Facturación ("Es el comprobante de
 * un cobro ya registrado") — a diferencia de `SelectorEntidadDialog`
 * (genérico, dos líneas de texto), acá hacen falta 4 datos por fila
 * (Fecha, Monto, Medio de pago, Concepto — pedido explícito, punto de
 * docs/sistemas/facturacion-dos-flujos-diseno.md) para poder identificar
 * el cobro correcto sin abrir uno por uno. Por eso es un componente
 * propio, no una reutilización de aquel.
 *
 * Sin límite de tiempo (decisión aprobada): muestra todos los cobros sin
 * factura del cliente, con un buscador para cuando la lista crezca.
 */
export function SeleccionarCobroDialog({ clienteId, abierto, onOpenChange, onSeleccionar }: SeleccionarCobroDialogProps) {
  const { data: cobros, isLoading } = useCobrosSinFactura(clienteId)
  const { data: mediosPago } = useMediosPago()
  const [busqueda, setBusqueda] = React.useState('')

  React.useEffect(() => {
    if (abierto) setBusqueda('')
  }, [abierto])

  const cobrosFiltrados = React.useMemo(() => {
    if (!cobros) return []
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return cobros
    return cobros.filter((c) => {
      const nombreMedio = mediosPago?.find((m) => m.id === c.medio_pago_id)?.nombre ?? ''
      const texto = `${formatearFecha(c.fecha)} ${nombreMedio} ${c.nota ?? ''} ${c.monto}`.toLowerCase()
      return texto.includes(termino)
    })
  }, [cobros, mediosPago, busqueda])

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Elegí el cobro</Dialog.Title>
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
              placeholder="Buscar por fecha, monto, medio de pago..."
              className="w-full rounded-md border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-border-strong"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
            ) : cobrosFiltrados.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {cobros?.length === 0 ? 'Este cliente no tiene cobros sin factura asociada.' : 'No se encontraron cobros.'}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {cobrosFiltrados.map((c) => {
                  const nombreMedio = mediosPago?.find((m) => m.id === c.medio_pago_id)?.nombre
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => onSeleccionar(c)}
                        className="flex w-full flex-col gap-0.5 py-2.5 text-left tocable hover:bg-muted/40"
                      >
                        <span className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{formatearFecha(c.fecha)}</span>
                          <span className="text-sm font-semibold tabular-nums text-foreground">{formatearMoneda(c.monto)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {nombreMedio ?? 'Sin medio de pago'}
                          {c.nota && ` · ${c.nota}`}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
