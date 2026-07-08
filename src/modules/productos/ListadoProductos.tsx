import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Archive, RotateCcw, Plus, Upload, Tag } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { DataTable, type ColumnaDataTable, type AccionDataTable } from '@/core/components/DataTable'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { Button } from '@/core/components/Button'
import { BadgeArchivadoChico } from '@/core/components/BadgeArchivado'
import { formatearMoneda } from '@/core/lib/format'
import { useToast } from '@/core/hooks/useToast'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { useProductos, useProductosArchivados } from './api'
import type { Producto } from './types'
import { normalizarParaOrden } from '@/core/lib/texto'


function FilaProductoMovil({ producto, archivado, onClick }: { producto: Producto; archivado: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-muted/50">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          {producto.nombre}
          {archivado && (
            <BadgeArchivadoChico />
          )}
        </p>
        <p className="text-xs text-muted-foreground">{producto.codigo_barras}</p>
      </div>
      <span className="shrink-0 text-sm font-medium text-foreground">{formatearMoneda(producto.precio_actual)}</span>
    </button>
  )
}

/** Listado de productos — mismo patrón que Clientes/Proveedores (Etapa 3). */
export function ListadoProductos() {
  const navigate = useNavigate()
  const toast = useToast()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')

  const { data: activos, isLoading: cargandoActivos, isError, refetch } = useProductos()
  const { data: archivados, isLoading: cargandoArchivados } = useProductosArchivados()
  const archivar = useArchivable('productos')
  const restaurar = useRestaurar('productos')

  const items = estado === 'activos' ? activos ?? [] : archivados ?? []
  const cargando = estado === 'activos' ? cargandoActivos : cargandoArchivados

  function handleArchivar(producto: Producto) {
    archivar.mutate(producto.id, {
      onSuccess: () => toast.exito('Producto archivado'),
      onError: () => toast.error('No se pudo archivar el producto')
    })
  }

  function handleRestaurar(producto: Producto) {
    restaurar.mutate(producto.id, {
      onSuccess: () => toast.exito('Producto restaurado'),
      onError: () => toast.error('No se pudo restaurar el producto')
    })
  }

  function accionesFila(_p: Producto): AccionDataTable<Producto>[] {
    if (estado === 'archivados') {
      return [
        { icono: Eye, etiqueta: 'Ver', onClick: (p) => navigate(`/productos/${p.id}`) },
        { icono: RotateCcw, etiqueta: 'Restaurar', onClick: handleRestaurar }
      ]
    }
    return [
      { icono: Eye, etiqueta: 'Ver', onClick: (p) => navigate(`/productos/${p.id}`) },
      { icono: Pencil, etiqueta: 'Editar', onClick: (p) => navigate(`/productos/${p.id}/editar`) },
      { icono: Archive, etiqueta: 'Archivar', onClick: handleArchivar }
    ]
  }

  const columnas: ColumnaDataTable<Producto>[] = [
    {
      key: 'nombre',
      encabezado: 'Nombre',
      valorOrden: (p) => normalizarParaOrden(p.nombre),
      render: (p) => <span className="font-medium">{p.nombre}</span>
    },
    {
      key: 'codigo',
      encabezado: 'Código de barras',
      valorOrden: (p) => p.codigo_barras,
      render: (p) => <span className="tabular-nums">{p.codigo_barras}</span>
    },
    {
      key: 'precio',
      encabezado: 'Precio',
      alineacion: 'right',
      valorOrden: (p) => p.precio_actual,
      render: (p) => formatearMoneda(p.precio_actual)
    }
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 px-6 pb-2 pt-5 lg:flex lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Productos</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {(activos?.length ?? 0)} producto{(activos?.length ?? 0) === 1 ? '' : 's'}
          </p>
          <div className="mt-3">
            <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button accion="neutral" icono={Tag} onClick={() => navigate('/productos/categorias')}>
            Categorías
          </Button>
          <Button accion="neutral" icono={Upload} onClick={() => navigate('/productos/importar')}>
            Importar lista
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border px-4 pb-3 pt-3 lg:hidden">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/productos/categorias')} className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Tag className="h-4 w-4" aria-hidden="true" />
            Categorías
          </button>
          <button onClick={() => navigate('/productos/importar')} className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Importar
          </button>
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 px-6 pb-6 lg:block">
        <DataTable
          items={items}
          getKey={(p) => p.id}
          columnas={columnas}
          getSearchableText={(p) => `${p.nombre} ${p.codigo_barras}`}
          acciones={accionesFila}
          onRowClick={(p) => navigate(`/productos/${p.id}`)}
          placeholderBusqueda="Buscar por nombre o código..."
          emptyMensaje={estado === 'activos' ? 'No hay productos.' : 'No hay productos archivados.'}
          cargando={cargando}
          accionPrincipal={
            estado === 'activos' && (
              <Button accion="guardar" icono={Plus} onClick={() => navigate('/productos/nuevo')}>
                Nuevo producto
              </Button>
            )
          }
        />
      </div>

      <div className="min-h-0 flex-1 lg:hidden">
        <ListView
          listKey={`productos-${estado}`}
          items={items}
          getKey={(p) => p.id}
          getSearchableText={(p) => `${p.nombre} ${p.codigo_barras}`}
          renderItem={(p) => (
            <FilaProductoMovil producto={p} archivado={estado === 'archivados'} onClick={() => navigate(`/productos/${p.id}`)} />
          )}
          onAgregar={() => navigate('/productos/nuevo')}
          placeholderBusqueda="Buscar por nombre o código..."
          emptyState={estado === 'activos' ? 'No hay productos.' : 'No hay productos archivados.'}
          cargando={cargando}
          error={isError ? { mensaje: 'No se pudieron cargar los productos.', onReintentar: refetch } : undefined}
        />
      </div>
    </div>
  )
}
