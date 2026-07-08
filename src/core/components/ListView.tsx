import * as React from 'react'
import { useListState } from '@/core/hooks/useListState'
import { normalizarTexto } from '@/core/lib/utils'
import { FloatingActionButton } from './FloatingActionButton'
import { SearchField } from './SearchField'
import { EmptyState } from './EmptyState'
import { SkeletonFila } from './Skeleton'

/**
 * Listado genérico de ADMIN. Todo módulo con un listado (Clientes,
 * Proveedores, Productos, Empleados, Cheques...) debe usar ESTE componente
 * en lugar de construir su propia tabla/lista, para garantizar:
 *   - Buscador fijo arriba (SearchField), insensible a mayúsculas/acentos
 *   - Orden (lo aplica quien llama, ver prop `items` — ver nota de rendimiento)
 *   - Persistencia de posición de búsqueda/scroll al volver
 *   - Botón flotante "+"
 *   - Estado vacío y estado de carga uniformes (EmptyState / Skeleton)
 *
 * Nota de rendimiento (pensado para miles de registros, sin implementarlo
 * todavía — ver docs/decisiones/0012): el ORDEN correcto debe salir
 * siempre de la consulta a la base de datos (ORDER BY con índice), nunca
 * de un sort en el cliente — así el componente no necesita cargar toda la
 * tabla en memoria para mostrar el orden correcto. El filtro de texto
 * usa `React.useDeferredValue`, que evita que cada tecla escrita bloquee
 * el hilo principal si la lista es grande, sin agregar ninguna librería de
 * debounce. Cuando la cantidad real de filas lo justifique, el siguiente
 * paso es virtualizar (ej. react-window) — se puede hacer sin cambiar la
 * API pública de este componente, porque `renderItem` ya recibe un item a
 * la vez.
 */
export interface ListViewProps<T> {
  listKey: string // identificador único de esta lista, ej "clientes"
  items: T[]
  getKey: (item: T) => string
  getSearchableText: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  onAgregar: () => void
  placeholderBusqueda?: string
  emptyState?: React.ReactNode
  /** true mientras se espera la respuesta real (ej. de Supabase). Muestra filas de esqueleto en vez de "sin resultados". */
  cargando?: boolean
  /** Se muestra en vez del listado si la consulta falló. */
  error?: { mensaje: string; onReintentar: () => void }
}

export function ListView<T>({
  listKey,
  items,
  getKey,
  getSearchableText,
  renderItem,
  onAgregar,
  placeholderBusqueda = 'Buscar...',
  emptyState,
  cargando = false,
  error
}: ListViewProps<T>) {
  const { busqueda, setBusqueda, scrollRef, guardarScroll } = useListState(listKey)
  const busquedaDiferida = React.useDeferredValue(busqueda)

  const filtrados = React.useMemo(() => {
    const q = normalizarTexto(busquedaDiferida)
    if (!q) return items
    return items.filter((item) => normalizarTexto(getSearchableText(item)).includes(q))
  }, [items, busquedaDiferida, getSearchableText])

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-3 border-b border-border">
        <SearchField value={busqueda} onChange={setBusqueda} placeholder={placeholderBusqueda} />
      </div>

      <div ref={scrollRef} onScroll={guardarScroll} className="flex-1 overflow-y-auto">
        {error ? (
          <EmptyState mensaje={error.mensaje} accion={{ texto: 'Reintentar', onClick: error.onReintentar }} />
        ) : cargando ? (
          <div className="divide-y divide-border">
            <SkeletonFila />
            <SkeletonFila />
            <SkeletonFila />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState mensaje={typeof emptyState === 'string' ? emptyState : 'No hay resultados.'} />
        ) : (
          <ul className="divide-y divide-border">
            {filtrados.map((item) => (
              <li key={getKey(item)} className="transition-colors hover:bg-muted/40">
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <FloatingActionButton onClick={onAgregar} />
    </div>
  )
}
