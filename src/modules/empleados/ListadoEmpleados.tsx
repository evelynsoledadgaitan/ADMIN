import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Archive, RotateCcw, Plus } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { DataTable, type ColumnaDataTable, type AccionDataTable } from '@/core/components/DataTable'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { Button } from '@/core/components/Button'
import { BadgeArchivadoChico } from '@/core/components/BadgeArchivado'
import { useToast } from '@/core/hooks/useToast'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { useEmpleados, useEmpleadosArchivados, useModalidadesPago } from './api'
import type { Empleado } from './types'
import { normalizarParaOrden } from '@/core/lib/texto'


function FilaEmpleadoMovil({ empleado, archivado, onClick }: { empleado: Empleado; archivado: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left active:bg-muted/50">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {empleado.nombre_apellido}
        {archivado && (
          <BadgeArchivadoChico />
        )}
      </span>
      {empleado.cargo && <span className="text-xs text-muted-foreground">{empleado.cargo}</span>}
    </button>
  )
}

/**
 * Listado de Empleados — mismo patrón que Clientes/Proveedores/Productos,
 * sin columna de Estado de cuenta (no existe saldo acá, ver
 * docs/sistemas/bloque4a-empleados-diseno.md, punto 4).
 */
export function ListadoEmpleados() {
  const navigate = useNavigate()
  const toast = useToast()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')

  const { data: activos, isLoading: cargandoActivos, isError, refetch } = useEmpleados()
  const { data: archivados, isLoading: cargandoArchivados } = useEmpleadosArchivados()
  const { data: modalidades } = useModalidadesPago()
  const archivar = useArchivable('empleados')
  const restaurar = useRestaurar('empleados')

  const items = estado === 'activos' ? activos ?? [] : archivados ?? []
  const cargando = estado === 'activos' ? cargandoActivos : cargandoArchivados

  function handleArchivar(empleado: Empleado) {
    archivar.mutate(empleado.id, {
      onSuccess: () => toast.exito('Empleado archivado'),
      onError: () => toast.error('No se pudo archivar el empleado')
    })
  }

  function handleRestaurar(empleado: Empleado) {
    restaurar.mutate(empleado.id, {
      onSuccess: () => toast.exito('Empleado restaurado'),
      onError: () => toast.error('No se pudo restaurar el empleado')
    })
  }

  function accionesFila(_e: Empleado): AccionDataTable<Empleado>[] {
    if (estado === 'archivados') {
      return [
        { icono: Eye, etiqueta: 'Ver', onClick: (e) => navigate(`/empleados/${e.id}`) },
        { icono: RotateCcw, etiqueta: 'Restaurar', onClick: handleRestaurar }
      ]
    }
    return [
      { icono: Eye, etiqueta: 'Ver', onClick: (e) => navigate(`/empleados/${e.id}`) },
      { icono: Pencil, etiqueta: 'Editar', onClick: (e) => navigate(`/empleados/${e.id}/editar`) },
      { icono: Archive, etiqueta: 'Archivar', onClick: handleArchivar }
    ]
  }

  const columnas: ColumnaDataTable<Empleado>[] = [
    {
      key: 'nombre',
      encabezado: 'Nombre y apellido',
      valorOrden: (e) => normalizarParaOrden(e.nombre_apellido),
      render: (e) => <span className="font-medium">{e.nombre_apellido}</span>
    },
    {
      key: 'cargo',
      encabezado: 'Cargo',
      render: (e) => e.cargo ?? <span className="text-muted-foreground">—</span>
    },
    {
      key: 'modalidad',
      encabezado: 'Modalidad de pago',
      render: (e) => modalidades?.find((m) => m.id === e.modalidad_pago_id)?.nombre ?? <span className="text-muted-foreground">—</span>
    }
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 px-6 pb-2 pt-5 lg:block">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Empleados</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {(activos?.length ?? 0)} empleado{(activos?.length ?? 0) === 1 ? '' : 's'}
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
          items={items}
          getKey={(e) => e.id}
          columnas={columnas}
          getSearchableText={(e) => `${e.nombre_apellido} ${e.cargo ?? ''}`}
          acciones={accionesFila}
          onRowClick={(e) => navigate(`/empleados/${e.id}`)}
          placeholderBusqueda="Buscar empleados..."
          emptyMensaje={estado === 'activos' ? 'No hay empleados.' : 'No hay empleados archivados.'}
          cargando={cargando}
          accionPrincipal={
            estado === 'activos' && (
              <Button accion="guardar" icono={Plus} onClick={() => navigate('/empleados/nuevo')}>
                Nuevo empleado
              </Button>
            )
          }
        />
      </div>

      <div className="min-h-0 flex-1 lg:hidden">
        <ListView
          listKey={`empleados-${estado}`}
          items={items}
          getKey={(e) => e.id}
          getSearchableText={(e) => `${e.nombre_apellido} ${e.cargo ?? ''}`}
          renderItem={(e) => (
            <FilaEmpleadoMovil empleado={e} archivado={estado === 'archivados'} onClick={() => navigate(`/empleados/${e.id}`)} />
          )}
          onAgregar={() => navigate('/empleados/nuevo')}
          placeholderBusqueda="Buscar empleados..."
          emptyState={estado === 'activos' ? 'No hay empleados.' : 'No hay empleados archivados.'}
          cargando={cargando}
          error={isError ? { mensaje: 'No se pudieron cargar los empleados.', onReintentar: refetch } : undefined}
        />
      </div>
    </div>
  )
}
