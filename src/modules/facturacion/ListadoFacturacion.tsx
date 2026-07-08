import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Plus, Clock, CheckCircle2, Wallet, FileText } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { DataTable, type ColumnaDataTable, type AccionDataTable } from '@/core/components/DataTable'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { Select } from '@/core/components/Select'
import { Button } from '@/core/components/Button'
import { cardClassName } from '@/core/components/Card'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useFacturas, useFacturasArchivadas } from './api'
import { formatearNumeroFactura, type Factura, type EstadoFactura } from './types'
import { EstadoFacturaBadge } from './EstadoFacturaBadge'
import { useNumeracion } from '@/modules/configuracion/api'

type FacturaConCliente = Factura & { cliente: { nombre_apellido: string } }

const OPCIONES_ESTADO = [
  { value: 'todos', label: 'Estado: Todos' },
  { value: 'pendiente_emitir', label: 'Pendiente de emitir' },
  { value: 'emitida', label: 'Emitida' }
]

function esDelMesActual(fechaISO: string): boolean {
  const hoy = new Date()
  const [anio, mes] = fechaISO.split('-')
  return Number(anio) === hoy.getFullYear() && Number(mes) === hoy.getMonth() + 1
}

/**
 * Panel resumen — Sprint 3.1, punto 1. Consulta únicamente información
 * que ya se trajo con `useFacturas()` (la misma lista que alimenta la
 * tabla) — ningún indicador acá dispara una consulta nueva ni agrega
 * lógica de negocio, son 4 cuentas sobre datos ya cargados.
 */
function ResumenFacturacion({ facturas }: { facturas: FacturaConCliente[] }) {
  const pendientes = facturas.filter((f) => f.estado === 'pendiente_emitir').length
  const emitidas = facturas.filter((f) => f.estado === 'emitida').length
  const delMes = facturas.filter((f) => esDelMesActual(f.fecha))
  const totalMes = delMes.reduce((acc, f) => acc + f.total, 0)

  const items = [
    { icono: Clock, color: 'text-advertencia', etiqueta: 'Pendientes de emitir', valor: String(pendientes) },
    { icono: CheckCircle2, color: 'text-exito', etiqueta: 'Emitidas', valor: String(emitidas) },
    { icono: Wallet, color: 'text-primary', etiqueta: 'Facturado este mes', valor: formatearMoneda(totalMes) },
    { icono: FileText, color: 'text-muted-foreground', etiqueta: 'Facturas este mes', valor: String(delMes.length) }
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 lg:grid-cols-4 lg:px-6">
      {items.map((item) => (
        <div key={item.etiqueta} className={cardClassName() + ' flex items-center gap-3 p-3.5'}>
          <item.icono className={`h-5 w-5 shrink-0 ${item.color}`} aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tabular-nums text-foreground">{item.valor}</p>
            <p className="truncate text-xs text-muted-foreground">{item.etiqueta}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FilaFacturaMovil({ factura, prefijo, onClick }: { factura: FacturaConCliente; prefijo: string | undefined; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-muted/50">
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
          {factura.cliente.nombre_apellido}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatearFecha(factura.fecha)} · {factura.numero_externo ?? formatearNumeroFactura(factura.numero_interno, prefijo)}
        </p>
        <div className="mt-1">
          <EstadoFacturaBadge estado={factura.estado} />
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium text-foreground">{formatearMoneda(factura.total)}</span>
    </button>
  )
}

/**
 * Listado de Facturación — mismo patrón que Clientes/Proveedores/Productos.
 * Sprint 3.1: panel resumen (solo lectura sobre datos ya cargados) y
 * filtro por Estado — soporta llegar con `?estado=pendiente` en la URL
 * (desde la tarjeta de Pendientes en Inicio) para abrir ya filtrado.
 */
export function ListadoFacturacion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')
  const [filtroEstadoFactura, setFiltroEstadoFactura] = React.useState(
    searchParams.get('estado') === 'pendiente' ? 'pendiente_emitir' : 'todos'
  )

  const { data: activas, isLoading: cargandoActivas, isError, refetch } = useFacturas()
  const { data: prefijos } = useNumeracion()
  const { data: archivadas, isLoading: cargandoArchivadas } = useFacturasArchivadas()

  const items = estado === 'activos' ? activas ?? [] : archivadas ?? []
  const cargando = estado === 'activos' ? cargandoActivas : cargandoArchivadas

  const itemsFiltrados = React.useMemo(() => {
    if (estado !== 'activos' || filtroEstadoFactura === 'todos') return items
    return items.filter((f) => f.estado === filtroEstadoFactura)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "items" ya se recalcula a partir de activas/archivadas/estado
  }, [activas, archivadas, estado, filtroEstadoFactura])

  function accionesFila(_f: FacturaConCliente): AccionDataTable<FacturaConCliente>[] {
    return [{ icono: Eye, etiqueta: 'Ver', onClick: (f) => navigate(`/facturacion/${f.id}`) }]
  }

  const columnas: ColumnaDataTable<FacturaConCliente>[] = [
    {
      key: 'numero',
      encabezado: 'N°',
      render: (f) => (
        <span className="tabular-nums text-muted-foreground">{f.numero_externo ?? formatearNumeroFactura(f.numero_interno, prefijos?.facturas)}</span>
      )
    },
    {
      key: 'estado',
      encabezado: 'Estado',
      valorOrden: (f) => f.estado,
      render: (f) => <EstadoFacturaBadge estado={f.estado} />
    },
    {
      key: 'cliente',
      encabezado: 'Cliente',
      valorOrden: (f) => f.cliente.nombre_apellido,
      render: (f) => <span className="font-medium">{f.cliente.nombre_apellido}</span>
    },
    {
      key: 'fecha',
      encabezado: 'Fecha',
      valorOrden: (f) => f.fecha,
      render: (f) => formatearFecha(f.fecha)
    },
    {
      key: 'total',
      encabezado: 'Total',
      alineacion: 'right',
      valorOrden: (f) => f.total,
      render: (f) => formatearMoneda(f.total)
    }
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 px-6 pb-2 pt-5 lg:block">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Facturación</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {(activas?.length ?? 0)} factura{(activas?.length ?? 0) === 1 ? '' : 's'}
        </p>
        <div className="mt-3">
          <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivadas?.length} />
        </div>
      </div>

      <div className="border-b border-border px-4 pb-3 pt-3 lg:hidden">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivadas?.length} />
      </div>

      {!cargandoActivas && <ResumenFacturacion facturas={activas ?? []} />}

      <div className="hidden min-h-0 flex-1 px-6 pb-6 lg:block">
        <DataTable
          items={itemsFiltrados}
          getKey={(f) => f.id}
          columnas={columnas}
          getSearchableText={(f) => `${f.cliente.nombre_apellido} ${formatearNumeroFactura(f.numero_interno, prefijos?.facturas)}`}
          acciones={accionesFila}
          onRowClick={(f) => navigate(`/facturacion/${f.id}`)}
          placeholderBusqueda="Buscar por cliente o número..."
          emptyMensaje={estado === 'activos' ? 'No hay facturas.' : 'No hay facturas anuladas.'}
          cargando={cargando}
          filtros={
            estado === 'activos' && (
              <Select
                label=""
                value={filtroEstadoFactura}
                onValueChange={(v) => setFiltroEstadoFactura(v as EstadoFactura | 'todos')}
                opciones={OPCIONES_ESTADO}
                className="w-56"
              />
            )
          }
          accionPrincipal={
            estado === 'activos' && (
              <Button accion="guardar" icono={Plus} onClick={() => navigate('/facturacion/nueva')}>
                Nueva factura
              </Button>
            )
          }
        />
      </div>

      <div className="min-h-0 flex-1 lg:hidden">
        <ListView
          listKey={`facturacion-${estado}`}
          items={itemsFiltrados}
          getKey={(f) => f.id}
          getSearchableText={(f) => `${f.cliente.nombre_apellido} ${formatearNumeroFactura(f.numero_interno, prefijos?.facturas)}`}
          renderItem={(f) => <FilaFacturaMovil factura={f} prefijo={prefijos?.facturas} onClick={() => navigate(`/facturacion/${f.id}`)} />}
          onAgregar={() => navigate('/facturacion/nueva')}
          placeholderBusqueda="Buscar por cliente o número..."
          emptyState={estado === 'activos' ? 'No hay facturas.' : 'No hay facturas anuladas.'}
          cargando={cargando}
          error={isError ? { mensaje: 'No se pudieron cargar las facturas.', onReintentar: refetch } : undefined}
        />
      </div>
    </div>
  )
}
