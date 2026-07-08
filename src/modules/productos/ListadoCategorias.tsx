import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Pencil, Archive, RotateCcw, Plus } from 'lucide-react'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { EmptyState } from '@/core/components/EmptyState'
import { Skeleton } from '@/core/components/Skeleton'
import { useToast } from '@/core/hooks/useToast'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { useCategoriasProductos, useCategoriasArchivadas } from './api'
import { CategoriaDialog } from './CategoriaDialog'
import type { CategoriaProducto } from './types'

/**
 * Administración de categorías — Bloque 2. Vive dentro de Productos por
 * ahora (Configuración todavía no es un módulo real, ver
 * docs/sistemas/bloque2-productos-diseno.md) — cuando exista, puede
 * enlazar hacia acá sin reconstruir nada.
 */
export function ListadoCategorias() {
  usePageTitle('Categorías')
  const navigate = useNavigate()
  const toast = useToast()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')
  const [dialogoAbierto, setDialogoAbierto] = React.useState(false)
  const [categoriaEditando, setCategoriaEditando] = React.useState<CategoriaProducto | null>(null)

  const { data: activas, isLoading: cargandoActivas } = useCategoriasProductos()
  const { data: archivadas, isLoading: cargandoArchivadas } = useCategoriasArchivadas()
  const archivar = useArchivable('categorias_productos')
  const restaurar = useRestaurar('categorias_productos')

  const items = estado === 'activos' ? activas ?? [] : archivadas ?? []
  const cargando = estado === 'activos' ? cargandoActivas : cargandoArchivadas

  function handleNueva() {
    setCategoriaEditando(null)
    setDialogoAbierto(true)
  }

  function handleEditar(categoria: CategoriaProducto) {
    setCategoriaEditando(categoria)
    setDialogoAbierto(true)
  }

  function handleArchivar(categoria: CategoriaProducto) {
    archivar.mutate(categoria.id, {
      onSuccess: () => toast.exito('Categoría archivada'),
      onError: () => toast.error('No se pudo archivar la categoría')
    })
  }

  function handleRestaurar(categoria: CategoriaProducto) {
    restaurar.mutate(categoria.id, {
      onSuccess: () => toast.exito('Categoría restaurada'),
      onError: () => toast.error('No se pudo restaurar la categoría')
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <button onClick={() => navigate('/productos')} aria-label="Volver" className="rounded-full p-1 active:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-foreground">Categorías</h1>
        <button onClick={handleNueva} className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <Plus className="h-4 w-4" />
          Nueva
        </button>
      </div>

      <div className="border-b border-border px-4 py-3">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivadas?.length} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cargando ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState mensaje={estado === 'activos' ? 'No hay categorías.' : 'No hay categorías archivadas.'} />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((categoria) => (
              <li key={categoria.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm font-medium text-foreground">{categoria.nombre}</span>
                <div className="flex items-center gap-3">
                  {estado === 'activos' ? (
                    <>
                      <button onClick={() => handleEditar(categoria)} aria-label="Editar" className="text-muted-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleArchivar(categoria)} aria-label="Archivar" className="text-muted-foreground">
                        <Archive className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestaurar(categoria)}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restaurar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CategoriaDialog abierto={dialogoAbierto} onOpenChange={setDialogoAbierto} categoria={categoriaEditando} />
    </div>
  )
}
