import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { normalizarTexto } from '@/core/lib/utils'
import { SearchField } from './SearchField'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'

export interface ItemSelectorEntidad {
  id: string
  nombre: string
  subtitulo?: string
}

export interface SelectorEntidadDialogProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  titulo: string
  items: ItemSelectorEntidad[]
  onSeleccionar: (item: ItemSelectorEntidad) => void
  cargando?: boolean
  placeholderBusqueda?: string
}

/**
 * Selector de entidad con autocompletado — buscar y elegir un cliente o
 * un proveedor sin entrar a su módulo. Componente genérico: no sabe nada
 * de "cliente" ni "proveedor", solo de una lista de {id, nombre}. Nace
 * para los accesos rápidos de Inicio (Agregar deuda, Agregar ingreso de
 * mercadería, Registrar cobro, Registrar pago) — ver
 * docs/sistemas/reorganizacion-flujo-operativo.md.
 *
 * Solo debería recibir entidades activas (no archivadas) — es
 * responsabilidad de quien arma `items`, no de este componente.
 */
export function SelectorEntidadDialog({
  abierto,
  onOpenChange,
  titulo,
  items,
  onSeleccionar,
  cargando = false,
  placeholderBusqueda = 'Buscar...'
}: SelectorEntidadDialogProps) {
  const [busqueda, setBusqueda] = React.useState('')

  React.useEffect(() => {
    if (abierto) setBusqueda('')
  }, [abierto])

  const filtrados = React.useMemo(() => {
    const q = normalizarTexto(busqueda)
    if (!q) return items
    return items.filter((item) => normalizarTexto(item.nombre).includes(q))
  }, [items, busqueda])

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl border-t border-border bg-surface shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="flex items-center justify-between p-5 pb-3">
            <Dialog.Title className="text-base font-semibold text-foreground">{titulo}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-5 pb-3">
            <SearchField value={busqueda} onChange={setBusqueda} placeholder={placeholderBusqueda} />
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {cargando ? (
              <div className="space-y-2 px-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filtrados.length === 0 ? (
              <EmptyState mensaje="No hay resultados." />
            ) : (
              <ul>
                {filtrados.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSeleccionar(item)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left active:bg-muted/60"
                    >
                      <span className="text-sm font-medium text-foreground">{item.nombre}</span>
                      {item.subtitulo && <span className="text-xs text-muted-foreground">{item.subtitulo}</span>}
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
