import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, AlertCircle, CheckCircle2, Circle, Eye, Trash2 } from 'lucide-react'
import { ListView } from '@/core/components/ListView'
import { DataTable, type ColumnaDataTable, type AccionDataTable } from '@/core/components/DataTable'
import { EstadoFiltroTabs, type EstadoFiltro } from '@/core/components/EstadoFiltroTabs'
import { Select } from '@/core/components/Select'
import { Button } from '@/core/components/Button'
import { cardClassName } from '@/core/components/Card'
import { useConfirm } from '@/core/hooks/useConfirm'
import { useToast } from '@/core/hooks/useToast'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import {
  useVencimientos,
  useVencimientosArchivados,
  useDocumentosContador,
  useAnularDocumentoContador
} from './api'
import { RegistrarVencimientoDialog } from './RegistrarVencimientoDialog'
import { AgregarDocumentoContadorDialog } from './AgregarDocumentoContadorDialog'
import { EstadoVencimientoBadge } from './EstadoVencimientoBadge'
import { TipoObligacionIcono } from './TipoObligacionIcono'
import { urlFirmadaAdjunto } from '@/core/lib/adjuntos'
import {
  ETIQUETAS_TIPO_DOCUMENTO_CONTADOR,
  calcularEstadoVencimiento,
  type Obligacion,
  type EstadoVencimiento
} from './types'
import { hoyISO } from './validaciones'

const OPCIONES_ESTADO = [
  { value: 'todos', label: 'Estado: Todos' },
  { value: 'vencida', label: 'Vencido' },
  { value: 'proxima_a_vencer', label: 'Próximo a vencer' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagada', label: 'Pagado' }
]

const OPCIONES_TIPO = [
  { value: 'todos', label: 'Tipo: Todos' },
  { value: 'impuesto', label: 'Impuesto' },
  { value: 'honorario', label: 'Honorario' },
  { value: 'otro', label: 'Otro' }
]

/** Panel resumen — mismo criterio que Facturación: solo lectura sobre datos ya cargados, sin lógica de negocio nueva. */
function ResumenVencimientos({ obligaciones }: { obligaciones: Obligacion[] }) {
  const hoy = hoyISO()
  const porEstado = obligaciones.reduce(
    (acc, o) => {
      const estado = calcularEstadoVencimiento(o, hoy)
      acc[estado]++
      return acc
    },
    { vencida: 0, proxima_a_vencer: 0, pendiente: 0, pagada: 0 } as Record<EstadoVencimiento, number>
  )

  const items = [
    { icono: AlertCircle, color: 'text-error', etiqueta: 'Vencidos', valor: porEstado.vencida },
    { icono: Clock, color: 'text-advertencia', etiqueta: 'Próximos a vencer', valor: porEstado.proxima_a_vencer },
    { icono: Circle, color: 'text-muted-foreground', etiqueta: 'Pendientes', valor: porEstado.pendiente },
    { icono: CheckCircle2, color: 'text-exito', etiqueta: 'Pagados', valor: porEstado.pagada }
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

function FilaVencimientoMovil({ obligacion, onClick }: { obligacion: Obligacion; onClick: () => void }) {
  const estado = calcularEstadoVencimiento(obligacion, hoyISO())
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-muted/50">
      <div className="flex min-w-0 items-start gap-2">
        <TipoObligacionIcono tipo={obligacion.tipo} className="mt-0.5 h-4 w-4" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{obligacion.concepto}</p>
          <p className="text-xs text-muted-foreground">Vence {formatearFecha(obligacion.fecha_vencimiento)}</p>
          <div className="mt-1">
            <EstadoVencimientoBadge estado={estado} />
          </div>
        </div>
      </div>
      {obligacion.monto !== null && (
        <span className="shrink-0 text-sm font-medium text-foreground">{formatearMoneda(obligacion.monto)}</span>
      )}
    </button>
  )
}

function TabVencimientos() {
  const navigate = useNavigate()
  const [estado, setEstado] = React.useState<EstadoFiltro>('activos')
  const [filtroEstado, setFiltroEstado] = React.useState('todos')
  const [filtroTipo, setFiltroTipo] = React.useState('todos')
  const [registrando, setRegistrando] = React.useState(false)

  const { data: activos, isLoading: cargandoActivos, isError, refetch } = useVencimientos()
  const { data: archivados, isLoading: cargandoArchivados } = useVencimientosArchivados()

  const items = estado === 'activos' ? activos ?? [] : archivados ?? []
  const cargando = estado === 'activos' ? cargandoActivos : cargandoArchivados
  const hoy = hoyISO()

  const itemsFiltrados = React.useMemo(() => {
    return items.filter((o) => {
      if (filtroTipo !== 'todos' && o.tipo !== filtroTipo) return false
      if (estado === 'activos' && filtroEstado !== 'todos' && calcularEstadoVencimiento(o, hoy) !== filtroEstado) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "items" ya se recalcula a partir de activos/archivados/estado
  }, [activos, archivados, estado, filtroEstado, filtroTipo, hoy])

  function accionesFila(_o: Obligacion): AccionDataTable<Obligacion>[] {
    return [{ icono: Eye, etiqueta: 'Ver', onClick: (o) => navigate(`/contador/${o.id}`) }]
  }

  const columnas: ColumnaDataTable<Obligacion>[] = [
    {
      key: 'concepto',
      encabezado: 'Concepto',
      valorOrden: (o) => o.concepto,
      render: (o) => (
        <span className="flex items-center gap-2 font-medium">
          <TipoObligacionIcono tipo={o.tipo} />
          {o.concepto}
        </span>
      )
    },
    {
      key: 'vencimiento',
      encabezado: 'Vencimiento',
      valorOrden: (o) => o.fecha_vencimiento,
      render: (o) => formatearFecha(o.fecha_vencimiento)
    },
    {
      key: 'estado',
      encabezado: 'Estado',
      valorOrden: (o) => calcularEstadoVencimiento(o, hoy),
      render: (o) => <EstadoVencimientoBadge estado={calcularEstadoVencimiento(o, hoy)} />
    },
    {
      key: 'monto',
      encabezado: 'Monto',
      alineacion: 'right',
      valorOrden: (o) => o.monto ?? 0,
      render: (o) => (o.monto !== null ? formatearMoneda(o.monto) : <span className="text-muted-foreground">—</span>)
    }
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="hidden shrink-0 px-6 pb-2 pt-3 lg:block">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
      </div>
      <div className="border-b border-border px-4 pb-3 pt-3 lg:hidden">
        <EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
      </div>

      {!cargandoActivos && <ResumenVencimientos obligaciones={activos ?? []} />}

      <div className="hidden min-h-0 flex-1 px-6 pb-6 lg:block">
        <DataTable
          items={itemsFiltrados}
          getKey={(o) => o.id}
          columnas={columnas}
          getSearchableText={(o) => o.concepto}
          acciones={accionesFila}
          onRowClick={(o) => navigate(`/contador/${o.id}`)}
          placeholderBusqueda="Buscar por concepto..."
          emptyMensaje={estado === 'activos' ? 'No hay vencimientos.' : 'No hay vencimientos anulados.'}
          cargando={cargando}
          filtros={
            <div className="flex gap-2">
              <Select label="" value={filtroTipo} onValueChange={setFiltroTipo} opciones={OPCIONES_TIPO} className="w-40" />
              {estado === 'activos' && (
                <Select label="" value={filtroEstado} onValueChange={setFiltroEstado} opciones={OPCIONES_ESTADO} className="w-56" />
              )}
            </div>
          }
          accionPrincipal={
            estado === 'activos' && (
              <Button accion="guardar" icono={Plus} onClick={() => setRegistrando(true)}>
                Nuevo vencimiento
              </Button>
            )
          }
        />
      </div>

      <div className="min-h-0 flex-1 lg:hidden">
        <ListView
          listKey={`contador-${estado}`}
          items={itemsFiltrados}
          getKey={(o) => o.id}
          getSearchableText={(o) => o.concepto}
          renderItem={(o) => <FilaVencimientoMovil obligacion={o} onClick={() => navigate(`/contador/${o.id}`)} />}
          onAgregar={() => setRegistrando(true)}
          placeholderBusqueda="Buscar por concepto..."
          emptyState={estado === 'activos' ? 'No hay vencimientos.' : 'No hay vencimientos anulados.'}
          cargando={cargando}
          error={isError ? { mensaje: 'No se pudieron cargar los vencimientos.', onReintentar: refetch } : undefined}
        />
      </div>

      <RegistrarVencimientoDialog abierto={registrando} onOpenChange={setRegistrando} />
    </div>
  )
}

function TabDocumentacion() {
  const toast = useToast()
  const confirmar = useConfirm()
  const { data: documentos } = useDocumentosContador()
  const anular = useAnularDocumentoContador()
  const [agregando, setAgregando] = React.useState(false)

  const documentosActivos = (documentos ?? []).filter((d) => d.archived_at === null)

  async function handleVer(ruta: string) {
    const url = await urlFirmadaAdjunto(ruta)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleAnular(id: string) {
    const confirmado = await confirmar({
      titulo: 'Anular documento',
      mensaje: 'El documento quedará marcado como anulado. Podés subir uno nuevo para reemplazarlo.',
      textoConfirmar: 'Anular',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    anular.mutate(
      { id, motivo: '' },
      {
        onSuccess: () => toast.exito('Documento anulado'),
        onError: () => toast.error('No se pudo anular el documento')
      }
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Documentación general — contratos, poderes, constancias.</p>
        <Button accion="guardar" icono={Plus} onClick={() => setAgregando(true)}>
          Agregar
        </Button>
      </div>

      {documentosActivos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay documentos cargados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {documentosActivos.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button onClick={() => handleVer(doc.comprobante_path)} className="text-left">
                <p className="text-sm font-medium text-primary">
                  {doc.tipo_documento === 'otro' ? doc.descripcion_otro : ETIQUETAS_TIPO_DOCUMENTO_CONTADOR[doc.tipo_documento]}
                </p>
                <p className="text-xs text-muted-foreground">{formatearFecha(doc.created_at)}</p>
              </button>
              <button onClick={() => handleAnular(doc.id)} aria-label="Anular documento" className="text-muted-foreground hover:text-error">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AgregarDocumentoContadorDialog abierto={agregando} onOpenChange={setAgregando} />
    </div>
  )
}

/**
 * Contador — organizador de vencimientos, honorarios, impuestos y
 * documentación (ver docs/sistemas/bloque4b-contador-diseno.md). Dos
 * pestañas: Vencimientos (el core) y Documentación (general, no atada a
 * un vencimiento puntual). Lenguaje visible: "Vencimiento", no
 * "Obligación" (decisión aprobada) — el nombre técnico de la tabla no
 * cambió.
 */
export function Contador() {
  const [tab, setTab] = React.useState<'vencimientos' | 'documentacion'>('vencimientos')

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pb-2 pt-5 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contador</h1>
        <div className="mt-3 flex gap-1 border-b border-border">
          <button
            onClick={() => setTab('vencimientos')}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === 'vencimientos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            Vencimientos
          </button>
          <button
            onClick={() => setTab('documentacion')}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === 'documentacion' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            Documentación
          </button>
        </div>
      </div>

      {tab === 'vencimientos' ? <TabVencimientos /> : <TabDocumentacion />}
    </div>
  )
}
