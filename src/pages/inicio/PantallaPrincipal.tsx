import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, PlusCircle, PackagePlus, HandCoins, Banknote, Receipt, Calculator, StickyNote, FileClock, Landmark } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { moduloPorKey } from '@/core/theme/modulos'
import { cardClassName } from '@/core/components/Card'
import { SelectorEntidadDialog, type ItemSelectorEntidad } from '@/core/components/SelectorEntidadDialog'
import { cn } from '@/core/lib/utils'
import { useClientes } from '@/modules/clientes/api'
import { useProveedores } from '@/modules/proveedores/api'
import { RegistrarDeudaDialog } from '@/modules/clientes/RegistrarDeudaDialog'
import { RegistrarCompraDialog } from '@/modules/proveedores/RegistrarCompraDialog'
import { RegistrarMovimientoDialog } from '@/modules/pagos'
import { RegistrarAjusteDialog, type TipoEntidadCC } from '@/modules/cuentaCorriente'
import { useCantidadFacturasPendientes } from '@/modules/facturacion/api'
import { useCantidadVencimientosPendientes } from '@/modules/contador/api'
import { useRecordatoriosPendientes } from '@/modules/notas/api'
import { NotaDialog } from '@/modules/notas/NotaDialog'
import { useDeudasPendientesFacturarSiempreFactura } from '@/modules/facturacion/api'
import { useChequesPendientesVencer } from '@/modules/cheques/api'

const formateadorFecha = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

type TipoAccion = 'deuda' | 'ingreso' | 'cobro' | 'pago' | 'factura' | 'nota'

interface AccionRapida {
  key: TipoAccion
  etiqueta: string
  /** "Nueva nota" no necesita elegir cliente/proveedor — abre el diálogo directo. */
  entidadTipo?: TipoEntidadCC
  /** Color/ícono de wayfinding a usar — no siempre coincide con entidadTipo (Nueva factura usa el color de Facturación, no el de Clientes). */
  moduloKey: string
  icono: typeof PlusCircle
}

/**
 * Reorganización del flujo operativo (ver
 * docs/sistemas/reorganizacion-flujo-operativo.md): las operaciones
 * diarias reales — no las altas de datos maestros, que ya tienen su FAB
 * dentro de cada módulo. "Nueva factura" se suma con Facturación (Bloque
 * 3) — mismo criterio de 2 toques (elegir cliente, cargar), aunque el
 * segundo paso navega a una pantalla completa en vez de abrir un diálogo
 * (una factura con líneas necesita más espacio, ver
 * docs/sistemas/bloque3-facturacion-diseno.md).
 */
const ACCIONES_RAPIDAS: AccionRapida[] = [
  { key: 'deuda', etiqueta: 'Agregar deuda', entidadTipo: 'cliente', moduloKey: 'clientes', icono: PlusCircle },
  { key: 'ingreso', etiqueta: 'Agregar ingreso de mercadería', entidadTipo: 'proveedor', moduloKey: 'proveedores', icono: PackagePlus },
  { key: 'cobro', etiqueta: 'Registrar cobro', entidadTipo: 'cliente', moduloKey: 'clientes', icono: HandCoins },
  { key: 'pago', etiqueta: 'Registrar pago', entidadTipo: 'proveedor', moduloKey: 'proveedores', icono: Banknote },
  { key: 'factura', etiqueta: 'Nueva factura', entidadTipo: 'cliente', moduloKey: 'facturacion', icono: Receipt },
  { key: 'nota', etiqueta: 'Nueva nota', moduloKey: 'notas', icono: StickyNote }
]

/**
 * Pantalla Principal — identidad visual definitiva + reorganización del
 * flujo operativo. Sigue sin gráficos ni indicadores financieros (ver
 * identidad-visual-admin.md sección 7). Los accesos rápidos ya no crean
 * datos maestros (eso quedó dentro de cada módulo, en su FAB) — abren el
 * flujo de 2 toques hacia las 4 operaciones que se repiten todos los
 * días: buscar la entidad, cargar el movimiento.
 */
export function PantallaPrincipal() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  // Segunda fuente de "Pendientes" (Contador) — el resto (Cheques, Notas)
  // se suma acá mismo cuando esos módulos existan de verdad.
  const { data: cantidadFacturasPendientes } = useCantidadFacturasPendientes()
  const { data: cantidadVencimientosPendientes } = useCantidadVencimientosPendientes()
  const { data: recordatoriosPendientes } = useRecordatoriosPendientes()
  const cantidadRecordatorios = recordatoriosPendientes?.length ?? 0
  const { data: deudasPendientesFacturar } = useDeudasPendientesFacturarSiempreFactura()
  const cantidadPendientesFacturar = deudasPendientesFacturar?.length ?? 0
  const { data: chequesPendientes } = useChequesPendientesVencer()
  const cantidadChequesPendientes = chequesPendientes?.length ?? 0

  const pendientes = [
    (cantidadFacturasPendientes ?? 0) > 0 && {
      key: 'facturas',
      icono: Receipt,
      color: 'text-emerald-600',
      fondo: 'bg-emerald-50',
      borde: 'border-emerald-500',
      texto: `${cantidadFacturasPendientes} factura${cantidadFacturasPendientes === 1 ? '' : 's'} pendiente${cantidadFacturasPendientes === 1 ? '' : 's'} de emitir`,
      ruta: '/facturacion?estado=pendiente'
    },
    (cantidadVencimientosPendientes ?? 0) > 0 && {
      key: 'vencimientos',
      icono: Calculator,
      color: 'text-amber-700',
      fondo: 'bg-amber-50',
      borde: 'border-amber-600',
      texto: `${cantidadVencimientosPendientes} vencimiento${cantidadVencimientosPendientes === 1 ? '' : 's'} vencido${cantidadVencimientosPendientes === 1 ? '' : 's'} o próximo${cantidadVencimientosPendientes === 1 ? '' : 's'} a vencer`,
      ruta: '/contador'
    },
    cantidadRecordatorios > 0 && {
      key: 'notas',
      icono: StickyNote,
      color: 'text-indigo-600',
      fondo: 'bg-indigo-50',
      borde: 'border-indigo-500',
      texto: `${cantidadRecordatorios} recordatorio${cantidadRecordatorios === 1 ? '' : 's'} de ${cantidadRecordatorios === 1 ? 'una nota' : 'notas'}`,
      // Con una sola nota pendiente, abre esa nota directo. Con más de una,
      // no hay una "correspondiente" única — lleva al listado general.
      ruta: cantidadRecordatorios === 1 ? `/notas?abrir=${recordatoriosPendientes![0].id}` : '/notas'
    },
    cantidadPendientesFacturar > 0 && {
      key: 'pendientes_facturar',
      icono: FileClock,
      color: 'text-rose-600',
      fondo: 'bg-rose-50',
      borde: 'border-rose-500',
      texto: `${cantidadPendientesFacturar} deuda${cantidadPendientesFacturar === 1 ? '' : 's'} pendiente${cantidadPendientesFacturar === 1 ? '' : 's'} de facturar`,
      // "Siempre factura": con una sola pendiente, va directo a Nueva
      // Factura con esa deuda ya elegida (Flujo C). Con más de una, al
      // listado — vive en Facturación, no en Informes, a propósito: es
      // trabajo del día, no análisis (decisión aprobada explícita).
      ruta:
        cantidadPendientesFacturar === 1
          ? `/facturacion/nueva?cliente=${deudasPendientesFacturar![0].cliente.id}&deuda=${deudasPendientesFacturar![0].id}`
          : '/facturacion/pendientes'
    },
    cantidadChequesPendientes > 0 && {
      key: 'cheques',
      icono: Landmark,
      color: 'text-sky-700',
      fondo: 'bg-sky-50',
      borde: 'border-sky-600',
      texto: `${cantidadChequesPendientes} cheque${cantidadChequesPendientes === 1 ? '' : 's'} próximo${cantidadChequesPendientes === 1 ? '' : 's'} a vencer`,
      // Con uno solo, va directo a ese cheque. Con más de uno, al listado
      // (ya filtrado en "Disponibles", donde viven los que faltan resolver).
      ruta: cantidadChequesPendientes === 1 ? `/cheques/${chequesPendientes![0].id}` : '/cheques'
    }
  ].filter((p): p is Exclude<typeof p, false> => p !== false)

  const [accionActiva, setAccionActiva] = React.useState<TipoAccion | null>(null)
  const [entidadElegida, setEntidadElegida] = React.useState<ItemSelectorEntidad | null>(null)
  const [mostrarSelector, setMostrarSelector] = React.useState(false)
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false)
  const [mostrarAjuste, setMostrarAjuste] = React.useState(false)
  const [mostrarNotaDialog, setMostrarNotaDialog] = React.useState(false)

  const accion = ACCIONES_RAPIDAS.find((a) => a.key === accionActiva)
  const necesitaClientes = accion?.entidadTipo === 'cliente'
  const necesitaProveedores = accion?.entidadTipo === 'proveedor'

  const { data: clientes, isLoading: cargandoClientes } = useClientes(mostrarSelector && necesitaClientes)
  const { data: proveedores, isLoading: cargandoProveedores } = useProveedores(mostrarSelector && necesitaProveedores)

  function iniciarAccion(key: TipoAccion) {
    if (key === 'nota') {
      setMostrarNotaDialog(true)
      return
    }
    setAccionActiva(key)
    setEntidadElegida(null)
    setMostrarSelector(true)
  }

  function manejarSeleccion(item: ItemSelectorEntidad) {
    if (accionActiva === 'factura') {
      setMostrarSelector(false)
      navigate(`/facturacion/nueva?cliente=${item.id}`)
      return
    }
    setEntidadElegida(item)
    setMostrarSelector(false)
    setMostrarFormulario(true)
  }

  function manejarGuardado() {
    if (!entidadElegida || !accion) return
    const ruta = accion.entidadTipo === 'cliente' ? 'clientes' : 'proveedores'
    navigate(`/${ruta}/${entidadElegida.id}/cuenta`)
  }

  const itemsSelector: ItemSelectorEntidad[] = necesitaClientes
    ? (clientes ?? []).map((c) => ({ id: c.id, nombre: c.nombre_apellido, subtitulo: c.razon_social ?? undefined }))
    : (proveedores ?? []).map((p) => ({ id: p.id, nombre: p.nombre, subtitulo: p.razon_social ?? undefined }))

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Sin TopBar en esta ruta — este panel asume el padding de status bar/notch que antes ponía la barra. */}
      <div
        className="rounded-b-2xl bg-panel-calido px-5 pb-3.5 pt-3.5 md:px-8"
        style={{ paddingTop: 'calc(0.875rem + env(safe-area-inset-top))' }}
      >
        <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground md:text-2xl">
          Hola, {usuario?.nombre ?? ''}
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {capitalizar(formateadorFecha.format(new Date()))}
        </p>
      </div>

      <div className="px-5 pt-4 md:px-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pendientes</p>

        {pendientes.length === 0 ? (
          <div className={cardClassName() + ' flex flex-row items-center justify-center gap-2 py-4 text-center'}>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No hay pendientes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendientes.map((p) => (
              <button
                key={p.key}
                onClick={() => navigate(p.ruta)}
                className={cardClassName(true) + ` flex w-full items-center gap-3 border-l-[3px] ${p.borde} p-3.5 text-left`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${p.fondo}`}>
                  <p.icono className={`h-[17px] w-[17px] ${p.color}`} aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{p.texto}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pb-5 pt-4 md:px-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Accesos rápidos</p>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
          {ACCIONES_RAPIDAS.map((accionItem) => {
            const modulo = moduloPorKey(accionItem.moduloKey)!
            const Icono = accionItem.icono
            return (
              <button
                key={accionItem.key}
                onClick={() => iniciarAccion(accionItem.key)}
                className={cn(
                  cardClassName(true),
                  'group flex flex-col items-start gap-3 border-l-[3px] p-4 text-left',
                  'hover:shadow-md hover:-translate-y-0.5',
                  modulo.borde
                )}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${modulo.fondo} transition-transform group-hover:scale-105`}>
                  <Icono className={`h-[18px] w-[18px] ${modulo.color}`} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold leading-tight text-foreground">{accionItem.etiqueta}</span>
              </button>
            )
          })}
        </div>
      </div>

      <SelectorEntidadDialog
        abierto={mostrarSelector}
        onOpenChange={setMostrarSelector}
        titulo={necesitaClientes ? 'Elegí un cliente' : 'Elegí un proveedor'}
        items={itemsSelector}
        onSeleccionar={manejarSeleccion}
        cargando={necesitaClientes ? cargandoClientes : cargandoProveedores}
        placeholderBusqueda={necesitaClientes ? 'Buscar clientes...' : 'Buscar proveedores...'}
      />

      {entidadElegida && accionActiva === 'deuda' && (
        <RegistrarDeudaDialog
          clienteId={entidadElegida.id}
          abierto={mostrarFormulario}
          onOpenChange={setMostrarFormulario}
          onGuardado={manejarGuardado}
          onElegirAjuste={() => {
            setMostrarFormulario(false)
            setMostrarAjuste(true)
          }}
        />
      )}

      {entidadElegida && accionActiva === 'ingreso' && (
        <RegistrarCompraDialog
          proveedorId={entidadElegida.id}
          abierto={mostrarFormulario}
          onOpenChange={setMostrarFormulario}
          onGuardado={manejarGuardado}
          onElegirAjuste={() => {
            setMostrarFormulario(false)
            setMostrarAjuste(true)
          }}
        />
      )}

      {entidadElegida && (accionActiva === 'cobro' || accionActiva === 'pago') && (
        <RegistrarMovimientoDialog
          tipo={accionActiva === 'cobro' ? 'cobro' : 'pago'}
          entidadId={entidadElegida.id}
          abierto={mostrarFormulario}
          onOpenChange={setMostrarFormulario}
          onGuardado={manejarGuardado}
        />
      )}

      {entidadElegida && accion && accion.entidadTipo && (
        <RegistrarAjusteDialog
          tipo={accion.entidadTipo}
          entidadId={entidadElegida.id}
          abierto={mostrarAjuste}
          onOpenChange={setMostrarAjuste}
          onGuardado={manejarGuardado}
          etiquetaAumenta={accion.entidadTipo === 'cliente' ? 'Aumenta lo que debe' : 'Aumenta lo que le debemos'}
          etiquetaReduce={accion.entidadTipo === 'cliente' ? 'Reduce lo que debe' : 'Reduce lo que le debemos'}
        />
      )}

      <NotaDialog nota={null} abierto={mostrarNotaDialog} onOpenChange={setMostrarNotaDialog} />
    </div>
  )
}
