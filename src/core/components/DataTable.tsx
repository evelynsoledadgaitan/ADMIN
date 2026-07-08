import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { normalizarTexto, cn } from '@/core/lib/utils'
import { SearchField } from './SearchField'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'
import { Tooltip } from './Tooltip'

export interface ColumnaDataTable<T> {
  key: string
  encabezado: string
  render: (item: T) => React.ReactNode
  /** Si se omite, la columna no se puede usar para ordenar (ej. una columna de solo texto libre sin orden útil). */
  valorOrden?: (item: T) => string | number
  alineacion?: 'left' | 'right'
  /**
   * Ancho fijo opcional (ej. "180px"). Sin uso hoy más que pasarlo al
   * <col>, pero es el punto de apoyo para "columnas configurables" el día
   * que se implemente esa preferencia por usuario — ver sección de
   * extensión al final del archivo.
   */
  ancho?: string
}

export interface AccionDataTable<T> {
  icono: LucideIcon
  etiqueta: string // también es el texto del tooltip
  onClick: (item: T) => void
}

export interface DataTableProps<T> {
  items: T[]
  getKey: (item: T) => string
  columnas: ColumnaDataTable<T>[]
  getSearchableText: (item: T) => string
  /** Acciones por fila — función porque pueden variar según el propio item (ej. Restaurar en vez de Editar/Archivar si está archivado). */
  acciones: (item: T) => AccionDataTable<T>[]
  onRowClick?: (item: T) => void
  placeholderBusqueda?: string
  emptyMensaje?: string
  cargando?: boolean
  /** Slot para filtros propios del módulo (ej. "Facturación" en Clientes) — DataTable no sabe nada de ningún campo de negocio. */
  filtros?: React.ReactNode
  /** Slot para el botón principal ("+ Nuevo cliente") — mismo criterio que filtros. */
  accionPrincipal?: React.ReactNode
  opcionesFilasPorPagina?: number[]
}

const OPCIONES_FILAS_DEFAULT = [10, 20, 50, 100]

/**
 * Tabla de escritorio única de ADMIN — Etapa 3. Búsqueda, orden por
 * columna, paginación con selector de tamaño y acciones por fila con
 * tooltip, todo resuelto acá una sola vez y reutilizado en cada módulo
 * (Clientes, Proveedores, Productos, y los que sigan). El módulo que la
 * usa solo aporta columnas, acciones y (opcionalmente) filtros — nunca
 * lógica de tabla propia.
 *
 * Rendimiento: igual criterio que ListView (docs/decisiones/0012) — opera
 * sobre los datos que ya trajo la consulta, sin volver a pedirle nada a
 * Supabase por buscar/ordenar/paginar. Con los volúmenes de este proyecto
 * alcanza; si algún día hiciera falta, se puede mover a paginación real
 * del servidor sin cambiar la API pública de este componente (las props
 * ya son "items ya cargados", no "cómo pedirlos").
 *
 * Preparado para (sin implementar todavía — ver identidad-visual-admin.md
 * y el documento de la Etapa 3):
 *   - Columnas configurables por usuario: ya cada columna es un objeto de
 *     configuración (`ColumnaDataTable`), no JSX hardcodeado — agregar un
 *     selector de "qué columnas mostrar" es filtrar este array antes de
 *     pasarlo, sin tocar el componente.
 *   - Acciones masivas: agregaría una columna de checkbox + un estado de
 *     selección + una barra de acciones que aparece cuando hay algo
 *     seleccionado. El lugar natural es entre el toolbar y la tabla.
 *   - Exportación: un botón más en el toolbar (junto a filtros/acción
 *     principal) que arma un CSV a partir de `items` y `columnas` — la
 *     misma lógica que ya existe en `modules/productos/csvParser.ts`
 *     (`generarCSVErrores`) generalizada.
 */
export function DataTable<T>({
  items,
  getKey,
  columnas,
  getSearchableText,
  acciones,
  onRowClick,
  placeholderBusqueda = 'Buscar...',
  emptyMensaje = 'No hay resultados.',
  cargando = false,
  filtros,
  accionPrincipal,
  opcionesFilasPorPagina = OPCIONES_FILAS_DEFAULT
}: DataTableProps<T>) {
  const [busqueda, setBusqueda] = React.useState('')
  const busquedaDiferida = React.useDeferredValue(busqueda)
  const [columnaOrden, setColumnaOrden] = React.useState<string | null>(null)
  const [ordenDescendente, setOrdenDescendente] = React.useState(false)
  const [pagina, setPagina] = React.useState(1)
  const [filasPorPagina, setFilasPorPagina] = React.useState(opcionesFilasPorPagina[0])

  const filtrados = React.useMemo(() => {
    const q = normalizarTexto(busquedaDiferida)
    if (!q) return items
    return items.filter((item) => normalizarTexto(getSearchableText(item)).includes(q))
  }, [items, busquedaDiferida, getSearchableText])

  const ordenados = React.useMemo(() => {
    const columna = columnas.find((c) => c.key === columnaOrden)
    if (!columna?.valorOrden) return filtrados
    const copia = [...filtrados]
    copia.sort((a, b) => {
      const va = columna.valorOrden!(a)
      const vb = columna.valorOrden!(b)
      const resultado = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return ordenDescendente ? -resultado : resultado
    })
    return copia
  }, [filtrados, columnas, columnaOrden, ordenDescendente])

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / filasPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const paginados = ordenados.slice((paginaActual - 1) * filasPorPagina, paginaActual * filasPorPagina)

  React.useEffect(() => setPagina(1), [busquedaDiferida, filasPorPagina])

  function handleClickEncabezado(columna: ColumnaDataTable<T>) {
    if (!columna.valorOrden) return
    if (columnaOrden === columna.key) {
      setOrdenDescendente((actual) => !actual)
    } else {
      setColumnaOrden(columna.key)
      setOrdenDescendente(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <SearchField value={busqueda} onChange={setBusqueda} placeholder={placeholderBusqueda} className="w-72" />
        {filtros}
        <div className="flex-1" />
        {accionPrincipal}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface sombra-tarjeta">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              {columnas.map((columna) => (
                <th
                  key={columna.key}
                  style={{ width: columna.ancho }}
                  className={cn(
                    'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                    columna.alineacion === 'right' ? 'text-right' : 'text-left',
                    columna.valorOrden && 'cursor-pointer select-none hover:text-foreground'
                  )}
                  onClick={() => handleClickEncabezado(columna)}
                >
                  <span className={cn('inline-flex items-center gap-1', columna.alineacion === 'right' && 'flex-row-reverse')}>
                    {columna.encabezado}
                    {columnaOrden === columna.key &&
                      (ordenDescendente ? <ArrowDown className="h-3.5 w-3.5 text-primary" /> : <ArrowUp className="h-3.5 w-3.5 text-primary" />)}
                  </span>
                </th>
              ))}
              <th className="w-px px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td colSpan={columnas.length + 1} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : paginados.length === 0 ? (
              <tr>
                <td colSpan={columnas.length + 1}>
                  <EmptyState mensaje={emptyMensaje} />
                </td>
              </tr>
            ) : (
              paginados.map((item) => (
                <tr
                  key={getKey(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn('border-t border-border transition-colors hover:bg-muted/40', onRowClick && 'cursor-pointer')}
                >
                  {columnas.map((columna) => (
                    <td key={columna.key} className={cn('px-4 py-3 text-foreground', columna.alineacion === 'right' && 'text-right tabular-nums')}>
                      {columna.render(item)}
                    </td>
                  ))}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      {acciones(item).map((accion) => (
                        <Tooltip key={accion.etiqueta} texto={accion.etiqueta}>
                          <button
                            onClick={() => accion.onClick(item)}
                            aria-label={accion.etiqueta}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <accion.icono className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!cargando && ordenados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">
              Mostrando {(paginaActual - 1) * filasPorPagina + 1}–{Math.min(paginaActual * filasPorPagina, ordenados.length)} de{' '}
              {ordenados.length}
              {ordenados.length !== items.length && <> (de {items.length} en total)</>}
            </span>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Filas por página
                <div className="relative">
                  <select
                    value={filasPorPagina}
                    onChange={(e) => setFilasPorPagina(Number(e.target.value))}
                    className="appearance-none rounded-md border border-border bg-surface py-1 pl-2 pr-6 text-xs text-foreground"
                  >
                    {opcionesFilasPorPagina.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  aria-label="Página anterior"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-14 text-center text-xs text-muted-foreground">
                  {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  aria-label="Página siguiente"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
