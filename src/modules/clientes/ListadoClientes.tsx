import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Archive, RotateCcw, Plus, Receipt } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { DataTable, type ColumnaDataTable, type AccionDataTable } from '@/core/components/DataTable'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { Select } from '@/core/components/Select'
import { Button } from '@/core/components/Button'
import { BadgeArchivadoChico } from '@/core/components/BadgeArchivado'
import { useToast } from '@/core/hooks/useToast'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { EstadoCuentaBadge, estadoCuentaDe, valorOrdenEstadoCuenta, useSaldosClientes } from '@/modules/cuentaCorriente'
import { useClientesConFacturasPendientes } from '@/modules/facturacion/api'
import { useClientes, useClientesArchivados } from './api'
import type { Cliente } from './types'
import { normalizarParaOrden } from '@/core/lib/texto'

const OPCIONES_ESTADO_CUENTA = [
  { value: 'todos', label: 'Estado de cuenta: Todos' },
  { value: 'deuda', label: 'Con deuda' },
  { value: 'al_dia', label: 'Al día' },
  { value: 'a_favor', label: 'Saldo a favor' }
]

function FilaClienteMovil({
  cliente,
  archivado,
  saldo,
  tieneFacturaPendiente,
  onClick
}: {
  cliente: Cliente
  archivado: boolean
  saldo: number | undefined
  tieneFacturaPendiente: boolean
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-muted/50">
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <span className="truncate">{cliente.nombre_apellido}</span>
        {tieneFacturaPendiente && !archivado && (
          <Receipt className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Tiene facturas pendientes de emitir" />
        )}
        {archivado && (
          <BadgeArchivadoChico />
        )}
      </span>
      {!archivado && <EstadoCuentaBadge saldo={saldo} />}
    </button>
  )
}

/**
 * Listado de clientes — el objetivo real de ADMIN es la gestión de la
 * cuenta corriente (ver docs/sistemas/estado-cuenta-listado.md), así que
 * el listado principal muestra "Estado de cuenta" en vez de datos
 * administrativos (Razón social, Facturación — esos quedan en la Ficha).
 * Celular: ListView de siempre. Escritorio (≥1024px): DataTable. Las
 * pestañas Activos/Archivados y las acciones por fila son el mismo
 * componente y la misma lógica en los dos dispositivos.
 */
export function ListadoClientes() {
  const navigate = useNavigate()
  const toast = useToast()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')
  const [filtroEstadoCuenta, setFiltroEstadoCuenta] = React.useState('todos')

  const { data: activos, isLoading: cargandoActivos, isError, refetch } = useClientes()
  const { data: archivados, isLoading: cargandoArchivados } = useClientesArchivados()
  const { data: saldos } = useSaldosClientes()
  const { data: clientesConPendientes } = useClientesConFacturasPendientes()
  const archivar = useArchivable('clientes')
  const restaurar = useRestaurar('clientes')

  const items = estado === 'activos' ? activos ?? [] : archivados ?? []
  const cargando = estado === 'activos' ? cargandoActivos : cargandoArchivados

  const itemsFiltrados = React.useMemo(() => {
    if (estado !== 'activos' || filtroEstadoCuenta === 'todos') return items
    return items.filter((c) => {
      const saldo = saldos?.get(c.id)
      return saldo !== undefined && estadoCuentaDe(saldo) === filtroEstadoCuenta
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "items" ya se recalcula en cada render a partir de activos/archivados/estado, no hace falta duplicarlo en las deps
  }, [activos, archivados, estado, filtroEstadoCuenta, saldos])

  function handleArchivar(cliente: Cliente) {
    archivar.mutate(cliente.id, {
      onSuccess: () => toast.exito('Cliente archivado'),
      onError: () => toast.error('No se pudo archivar el cliente')
    })
  }

  function handleRestaurar(cliente: Cliente) {
    restaurar.mutate(cliente.id, {
      onSuccess: () => toast.exito('Cliente restaurado'),
      onError: () => toast.error('No se pudo restaurar el cliente')
    })
  }

  function accionesFila(_cliente: Cliente): AccionDataTable<Cliente>[] {
    if (estado === 'archivados') {
      return [
        { icono: Eye, etiqueta: 'Ver', onClick: (c) => navigate(`/clientes/${c.id}`) },
        { icono: RotateCcw, etiqueta: 'Restaurar', onClick: handleRestaurar }
      ]
    }
    return [
      { icono: Eye, etiqueta: 'Ver', onClick: (c) => navigate(`/clientes/${c.id}`) },
      { icono: Pencil, etiqueta: 'Editar', onClick: (c) => navigate(`/clientes/${c.id}/editar`) },
      { icono: Archive, etiqueta: 'Archivar', onClick: handleArchivar }
    ]
  }

  const columnas: ColumnaDataTable<Cliente>[] = [
    {
      key: 'nombre',
      encabezado: 'Nombre y apellido',
      valorOrden: (c) => normalizarParaOrden(c.nombre_apellido),
      render: (c) => (
        <span className="flex items-center gap-1.5 font-medium">
          {c.nombre_apellido}
          {clientesConPendientes?.has(c.id) && estado === 'activos' && (
            <Receipt className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Tiene facturas pendientes de emitir" />
          )}
        </span>
      )
    },
    {
      key: 'estado_cuenta',
      encabezado: 'Estado de cuenta',
      alineacion: 'right',
      valorOrden: (c) => {
        const saldo = saldos?.get(c.id)
        return saldo === undefined ? 0 : valorOrdenEstadoCuenta(saldo)
      },
      render: (c) =>
        estado === 'archivados' ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <EstadoCuentaBadge saldo={saldos?.get(c.id)} />
        )
    }
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado de módulo — solo escritorio (celular mantiene el TopBar + buscador de ListView de siempre) */}
      <div className="hidden shrink-0 px-6 pb-2 pt-5 lg:block">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {(activos?.length ?? 0)} cliente{(activos?.length ?? 0) === 1 ? '' : 's'}
        </p>
        <div className="mt-3">
          <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
        </div>
      </div>

      {/* Celular: pestañas arriba del ListView de siempre */}
      <div className="border-b border-border px-4 pb-3 pt-3 lg:hidden">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
      </div>

      {/* Escritorio: DataTable */}
      <div className="hidden min-h-0 flex-1 px-6 pb-6 lg:block">
        <DataTable
          items={itemsFiltrados}
          getKey={(c) => c.id}
          columnas={columnas}
          getSearchableText={(c) => c.nombre_apellido}
          acciones={accionesFila}
          onRowClick={(c) => navigate(`/clientes/${c.id}`)}
          placeholderBusqueda="Buscar clientes..."
          emptyMensaje={estado === 'activos' ? 'No hay clientes.' : 'No hay clientes archivados.'}
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
              <Button accion="guardar" icono={Plus} onClick={() => navigate('/clientes/nuevo')}>
                Nuevo cliente
              </Button>
            )
          }
        />
      </div>

      {/* Celular: ListView de siempre */}
      <div className="min-h-0 flex-1 lg:hidden">
        <ListView
          listKey={`clientes-${estado}`}
          items={itemsFiltrados}
          getKey={(c) => c.id}
          getSearchableText={(c) => c.nombre_apellido}
          renderItem={(c) => (
            <FilaClienteMovil
              cliente={c}
              archivado={estado === 'archivados'}
              saldo={saldos?.get(c.id)}
              tieneFacturaPendiente={clientesConPendientes?.has(c.id) ?? false}
              onClick={() => navigate(`/clientes/${c.id}`)}
            />
          )}
          onAgregar={() => navigate('/clientes/nuevo')}
          placeholderBusqueda="Buscar clientes..."
          emptyState={estado === 'activos' ? 'No hay clientes.' : 'No hay clientes archivados.'}
          cargando={cargando}
          error={isError ? { mensaje: 'No se pudieron cargar los clientes.', onReintentar: refetch } : undefined}
        />
      </div>
    </div>
  )
}

