import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Archive, RotateCcw, Plus } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { DataTable, type ColumnaDataTable, type AccionDataTable } from '@/core/components/DataTable'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { Select } from '@/core/components/Select'
import { Button } from '@/core/components/Button'
import { BadgeArchivadoChico } from '@/core/components/BadgeArchivado'
import { useToast } from '@/core/hooks/useToast'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { EstadoCuentaBadge, estadoCuentaDe, valorOrdenEstadoCuenta } from '@/modules/cuentaCorriente'
import { useProveedores, useProveedoresArchivados, useSaldosProveedores } from './api'
import type { Proveedor } from './types'
import { normalizarParaOrden } from '@/core/lib/texto'

const OPCIONES_ESTADO_CUENTA = [
  { value: 'todos', label: 'Estado de cuenta: Todos' },
  { value: 'deuda', label: 'Con deuda' },
  { value: 'al_dia', label: 'Al día' },
  { value: 'a_favor', label: 'Saldo a favor' }
]


function FilaProveedorMovil({
  proveedor,
  archivado,
  saldo,
  onClick
}: {
  proveedor: Proveedor
  archivado: boolean
  saldo: number | undefined
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-muted/50">
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <span className="truncate">{proveedor.nombre}</span>
        {archivado && (
          <BadgeArchivadoChico />
        )}
      </span>
      {!archivado && <EstadoCuentaBadge saldo={saldo} />}
    </button>
  )
}

/**
 * Listado de proveedores — mismo criterio y misma estructura que
 * Clientes (ver docs/sistemas/estado-cuenta-listado.md): el listado
 * muestra "Estado de cuenta", los datos administrativos (Razón social,
 * CUIT) quedan en la Ficha.
 */
export function ListadoProveedores() {
  const navigate = useNavigate()
  const toast = useToast()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')
  const [filtroEstadoCuenta, setFiltroEstadoCuenta] = React.useState('todos')

  const { data: activos, isLoading: cargandoActivos, isError, refetch } = useProveedores()
  const { data: archivados, isLoading: cargandoArchivados } = useProveedoresArchivados()
  const { data: saldos } = useSaldosProveedores()
  const archivar = useArchivable('proveedores')
  const restaurar = useRestaurar('proveedores')

  const items = estado === 'activos' ? activos ?? [] : archivados ?? []
  const cargando = estado === 'activos' ? cargandoActivos : cargandoArchivados

  const itemsFiltrados = React.useMemo(() => {
    if (estado !== 'activos' || filtroEstadoCuenta === 'todos') return items
    return items.filter((p) => {
      const saldo = saldos?.get(p.id)
      return saldo !== undefined && estadoCuentaDe(saldo) === filtroEstadoCuenta
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "items" ya se recalcula en cada render a partir de activos/archivados/estado, no hace falta duplicarlo en las deps
  }, [activos, archivados, estado, filtroEstadoCuenta, saldos])

  function handleArchivar(proveedor: Proveedor) {
    archivar.mutate(proveedor.id, {
      onSuccess: () => toast.exito('Proveedor archivado'),
      onError: () => toast.error('No se pudo archivar el proveedor')
    })
  }

  function handleRestaurar(proveedor: Proveedor) {
    restaurar.mutate(proveedor.id, {
      onSuccess: () => toast.exito('Proveedor restaurado'),
      onError: () => toast.error('No se pudo restaurar el proveedor')
    })
  }

  function accionesFila(_p: Proveedor): AccionDataTable<Proveedor>[] {
    if (estado === 'archivados') {
      return [
        { icono: Eye, etiqueta: 'Ver', onClick: (p) => navigate(`/proveedores/${p.id}`) },
        { icono: RotateCcw, etiqueta: 'Restaurar', onClick: handleRestaurar }
      ]
    }
    return [
      { icono: Eye, etiqueta: 'Ver', onClick: (p) => navigate(`/proveedores/${p.id}`) },
      { icono: Pencil, etiqueta: 'Editar', onClick: (p) => navigate(`/proveedores/${p.id}/editar`) },
      { icono: Archive, etiqueta: 'Archivar', onClick: handleArchivar }
    ]
  }

  const columnas: ColumnaDataTable<Proveedor>[] = [
    {
      key: 'nombre',
      encabezado: 'Nombre',
      valorOrden: (p) => normalizarParaOrden(p.nombre),
      render: (p) => <span className="font-medium">{p.nombre}</span>
    },
    {
      key: 'estado_cuenta',
      encabezado: 'Estado de cuenta',
      alineacion: 'right',
      valorOrden: (p) => {
        const saldo = saldos?.get(p.id)
        return saldo === undefined ? 0 : valorOrdenEstadoCuenta(saldo)
      },
      render: (p) =>
        estado === 'archivados' ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <EstadoCuentaBadge saldo={saldos?.get(p.id)} />
        )
    }
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 px-6 pb-2 pt-5 lg:block">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Proveedores</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {(activos?.length ?? 0)} proveedor{(activos?.length ?? 0) === 1 ? '' : 'es'}
        </p>
        <div className="mt-3">
          <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
        </div>
      </div>

      <div className="border-b border-border px-4 pb-3 pt-3 lg:hidden">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
      </div>

      <div className="hidden min-h-0 flex-1 px-6 pb-6 lg:block">
        <DataTable
          items={itemsFiltrados}
          getKey={(p) => p.id}
          columnas={columnas}
          getSearchableText={(p) => p.nombre}
          acciones={accionesFila}
          onRowClick={(p) => navigate(`/proveedores/${p.id}`)}
          placeholderBusqueda="Buscar proveedores..."
          emptyMensaje={estado === 'activos' ? 'No hay proveedores.' : 'No hay proveedores archivados.'}
          cargando={cargando}
          filtros={
            estado === 'activos' && (
              <Select
                label=""
                value={filtroEstadoCuenta}
                onValueChange={setFiltroEstadoCuenta}
                opciones={OPCIONES_ESTADO_CUENTA}
                className="w-56"
              />
            )
          }
          accionPrincipal={
            estado === 'activos' && (
              <Button accion="guardar" icono={Plus} onClick={() => navigate('/proveedores/nuevo')}>
                Nuevo proveedor
              </Button>
            )
          }
        />
      </div>

      <div className="min-h-0 flex-1 lg:hidden">
        <ListView
          listKey={`proveedores-${estado}`}
          items={itemsFiltrados}
          getKey={(p) => p.id}
          getSearchableText={(p) => p.nombre}
          renderItem={(p) => (
            <FilaProveedorMovil
              proveedor={p}
              archivado={estado === 'archivados'}
              saldo={saldos?.get(p.id)}
              onClick={() => navigate(`/proveedores/${p.id}`)}
            />
          )}
          onAgregar={() => navigate('/proveedores/nuevo')}
          placeholderBusqueda="Buscar proveedores..."
          emptyState={estado === 'activos' ? 'No hay proveedores.' : 'No hay proveedores archivados.'}
          cargando={cargando}
          error={isError ? { mensaje: 'No se pudieron cargar los proveedores.', onReintentar: refetch } : undefined}
        />
      </div>
    </div>
  )
}
