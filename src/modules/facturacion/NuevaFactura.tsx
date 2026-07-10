import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Search, Plus, Trash2 } from 'lucide-react'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { TextField } from '@/core/components/TextField'
import { DateField } from '@/core/components/DateField'
import { CurrencyField } from '@/core/components/CurrencyField'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { Card } from '@/core/components/Card'
import { Select } from '@/core/components/Select'
import { SelectorEntidadDialog, type ItemSelectorEntidad } from '@/core/components/SelectorEntidadDialog'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { cn } from '@/core/lib/utils'
import { useCliente, useClientes } from '@/modules/clientes/api'
import { useProductos } from '@/modules/productos/api'
import { useRegistrarFactura } from './api'
import { SeleccionarCobroDialog } from './SeleccionarCobroDialog'
import { SeleccionarDeudaDialog } from './SeleccionarDeudaDialog'
import type { Movimiento } from '@/modules/pagos/types'
import type { Deuda } from '@/modules/clientes/types'
import { useDeuda } from '@/modules/clientes/api'
import { hoyISO, validarFactura, hayErroresFactura } from './validaciones'
import {
  valoresFacturaVacio,
  nuevaLineaVacia,
  subtotalLinea,
  totalFactura,
  calcularNetoEIva,
  ETIQUETAS_IVA,
  type FacturaFormValues,
  type TasaIva
} from './types'

/**
 * Nueva factura — pantalla completa, no un diálogo: a diferencia de
 * Registrar deuda/cobro/pago (un solo importe), acá se arman líneas, y
 * eso necesita más espacio del que da un bottom-sheet (ver
 * docs/sistemas/bloque3-facturacion-diseno.md). El cliente llega por
 * query param (`?cliente=id`) desde el acceso rápido de Inicio o desde
 * la Ficha del cliente — si no llega ninguno, se pide elegir uno acá mismo.
 */
export function NuevaFactura() {
  usePageTitle('Nueva factura')
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const [searchParams] = useSearchParams()
  const clienteIdInicial = searchParams.get('cliente') ?? ''
  const deudaIdInicial = searchParams.get('deuda')
  const { data: deudaDesdeUrl } = useDeuda(deudaIdInicial ?? undefined)

  const [clienteId, setClienteId] = React.useState(clienteIdInicial)
  const [mostrarSelectorCliente, setMostrarSelectorCliente] = React.useState(!clienteIdInicial)
  const { data: cliente } = useCliente(clienteId || undefined)
  const { data: productos } = useProductos()
  const registrar = useRegistrarFactura(clienteId)

  const [valores, setValores] = React.useState<FacturaFormValues>(() => valoresFacturaVacio(hoyISO(), clienteIdInicial))
  const [errores, setErrores] = React.useState(() => validarFactura(valores))
  const [mostrarErrores, setMostrarErrores] = React.useState(false)
  const [lineaEligiendoProducto, setLineaEligiendoProducto] = React.useState<string | null>(null)

  // Flujo A/B (ver docs/sistemas/facturacion-dos-flujos-diseno.md): sin
  // valor por defecto, a propósito — el usuario tiene que elegir, no hay
  // nada que se pueda pasar por alto sin mirar.
  const [modo, setModo] = React.useState<'deuda' | 'cobro' | 'deuda_existente' | null>(null)
  const [cobroSeleccionado, setCobroSeleccionado] = React.useState<Movimiento | null>(null)
  const [mostrarSelectorCobro, setMostrarSelectorCobro] = React.useState(false)
  const [deudaSeleccionada, setDeudaSeleccionada] = React.useState<Deuda | null>(null)
  const [mostrarSelectorDeuda, setMostrarSelectorDeuda] = React.useState(false)
  const [errorModo, setErrorModo] = React.useState<string | undefined>()

  function actualizar<K extends keyof FacturaFormValues>(campo: K, valor: FacturaFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function actualizarLinea(idLocal: string, cambios: Partial<FacturaFormValues['items'][number]>) {
    setValores((actuales) => ({
      ...actuales,
      items: actuales.items.map((item) => (item.idLocal === idLocal ? { ...item, ...cambios } : item))
    }))
  }

  function agregarLinea() {
    setValores((actuales) => ({ ...actuales, items: [...actuales.items, nuevaLineaVacia()] }))
  }

  function quitarLinea(idLocal: string) {
    setValores((actuales) => ({ ...actuales, items: actuales.items.filter((item) => item.idLocal !== idLocal) }))
  }

  function manejarElegirProducto(item: ItemSelectorEntidad) {
    if (!lineaEligiendoProducto) return
    const producto = productos?.find((p) => p.id === item.id)
    if (!producto) return
    actualizarLinea(lineaEligiendoProducto, {
      producto_id: producto.id,
      descripcion: producto.nombre,
      precio_unitario: producto.precio_actual
    })
    setLineaEligiendoProducto(null)
  }

  function manejarSeleccionCliente(item: ItemSelectorEntidad) {
    setClienteId(item.id)
    actualizar('cliente_id', item.id)
    setMostrarSelectorCliente(false)
  }

  // Si se llega desde "Pendientes de facturar" (?deuda=ID) — preselecciona
  // el Flujo C solo, sin que el usuario tenga que volver a elegir nada.
  React.useEffect(() => {
    if (deudaDesdeUrl && modo === null) {
      setModo('deuda_existente')
      manejarSeleccionDeuda(deudaDesdeUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr cuando llega la deuda pedida por URL
  }, [deudaDesdeUrl])

  function manejarSeleccionCobro(cobro: Movimiento) {
    setCobroSeleccionado(cobro)
    setMostrarSelectorCobro(false)
    setErrorModo(undefined)
  }

  function manejarSeleccionDeuda(deuda: Deuda) {
    setDeudaSeleccionada(deuda)
    setMostrarSelectorDeuda(false)
    setErrorModo(undefined)
    // Precompleta una línea con la descripción y el monto de la deuda —
    // una deuda no tiene artículos cargados uno por uno, así que esta
    // única línea de partida es la única forma honesta de "autocompletar".
    // Sigue siendo editable: se puede ajustar o agregar más líneas.
    setValores((actuales) => ({
      ...actuales,
      items: [{ idLocal: crypto.randomUUID(), producto_id: null, descripcion: deuda.descripcion, cantidad: 1, precio_unitario: deuda.monto }]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valoresConCliente = { ...valores, cliente_id: clienteId }
    const erroresValidacion = validarFactura(valoresConCliente)
    setErrores(erroresValidacion)
    setMostrarErrores(true)

    if (modo === null) {
      setErrorModo('Elegí una de las tres opciones.')
      return
    }
    if (modo === 'cobro' && cobroSeleccionado === null) {
      setErrorModo('Elegí el cobro al que corresponde esta factura.')
      return
    }
    if (modo === 'deuda_existente' && deudaSeleccionada === null) {
      setErrorModo('Elegí la deuda a la que corresponde esta factura.')
      return
    }
    setErrorModo(undefined)

    if (hayErroresFactura(erroresValidacion)) return

    if (modo === 'cobro' && cobroSeleccionado !== null && cobroSeleccionado.monto !== total) {
      const continuar = await confirmar({
        titulo: 'Los importes no coinciden',
        mensaje: `El cobro elegido fue de ${formatearMoneda(cobroSeleccionado.monto)} y esta factura suma ${formatearMoneda(total)}. Puede ser correcto (redondeos, descuentos, bonificaciones) — confirmá que lo revisaste antes de continuar.`,
        textoConfirmar: 'Continuar de todas formas',
        accionConfirmar: 'guardar'
      })
      if (!continuar) return
    }

    if (modo === 'deuda_existente' && deudaSeleccionada !== null && deudaSeleccionada.monto !== total) {
      const continuar = await confirmar({
        titulo: 'Los importes no coinciden',
        mensaje: `La deuda elegida es de ${formatearMoneda(deudaSeleccionada.monto)} y esta factura suma ${formatearMoneda(total)}. Puede ser correcto (redondeos, descuentos, bonificaciones) — confirmá que lo revisaste antes de continuar.`,
        textoConfirmar: 'Continuar de todas formas',
        accionConfirmar: 'guardar'
      })
      if (!continuar) return
    }

    registrar.mutate(
      {
        valores: valoresConCliente,
        movimientoId: modo === 'cobro' ? (cobroSeleccionado as Movimiento).id : null,
        deudaId: modo === 'deuda_existente' ? (deudaSeleccionada as Deuda).id : null
      },
      {
        onSuccess: (factura) => {
          toast.exito('Factura registrada')
          navigate(`/facturacion/${factura.id}`)
        },
        onError: () => toast.error('No se pudo registrar la factura')
      }
    )
  }

  const total = totalFactura(valores.items)
  const itemsProductoSelector: ItemSelectorEntidad[] = (productos ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    subtitulo: formatearMoneda(p.precio_actual)
  }))

  if (!clienteId) {
    return (
      <SelectorClienteInicial
        abierto={mostrarSelectorCliente}
        onSeleccionar={manejarSeleccionCliente}
        onCancelar={() => navigate(-1)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <button onClick={() => navigate(-1)} aria-label="Volver" className="rounded-full p-1 active:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Nueva factura</h1>
          {cliente && <p className="text-xs text-muted-foreground">{cliente.nombre_apellido}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:mx-auto lg:w-full lg:max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <DateField
              label="Fecha"
              value={valores.fecha}
              max={hoyISO()}
              onChange={(e) => actualizar('fecha', e.target.value)}
              error={mostrarErrores ? errores.fecha : undefined}
            />
            <Select
              label="IVA"
              value={valores.iva}
              onValueChange={(v) => actualizar('iva', v as TasaIva)}
              opciones={Object.entries(ETIQUETAS_IVA).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">¿Qué estás haciendo?</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setModo('deuda')
                  setErrorModo(undefined)
                }}
                className={cn(
                  'rounded-md border p-3 text-left text-sm transition-colors',
                  modo === 'deuda' ? 'border-primary bg-primary/10' : 'border-border'
                )}
              >
                <span className="block font-medium text-foreground">Genera una deuda nueva</span>
                <span className="block text-xs text-muted-foreground">Venta a cuenta corriente</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('cobro')
                  setErrorModo(undefined)
                  if (!cobroSeleccionado) setMostrarSelectorCobro(true)
                }}
                className={cn(
                  'rounded-md border p-3 text-left text-sm transition-colors',
                  modo === 'cobro' ? 'border-primary bg-primary/10' : 'border-border'
                )}
              >
                <span className="block font-medium text-foreground">Es el comprobante de un cobro ya registrado</span>
                <span className="block text-xs text-muted-foreground">No genera ninguna deuda nueva</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('deuda_existente')
                  setErrorModo(undefined)
                  if (!deudaSeleccionada) setMostrarSelectorDeuda(true)
                }}
                className={cn(
                  'rounded-md border p-3 text-left text-sm transition-colors',
                  modo === 'deuda_existente' ? 'border-primary bg-primary/10' : 'border-border'
                )}
              >
                <span className="block font-medium text-foreground">Es el comprobante de una deuda ya generada</span>
                <span className="block text-xs text-muted-foreground">No genera ninguna deuda nueva</span>
              </button>
            </div>

            {modo === 'cobro' && (
              <div className="mt-2">
                {cobroSeleccionado ? (
                  <div className="flex items-center justify-between rounded-md border border-border bg-surface p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatearFecha(cobroSeleccionado.fecha)} · {formatearMoneda(cobroSeleccionado.monto)}
                      </p>
                      {cobroSeleccionado.nota && <p className="text-xs text-muted-foreground">{cobroSeleccionado.nota}</p>}
                    </div>
                    <button type="button" onClick={() => setMostrarSelectorCobro(true)} className="text-xs font-medium text-primary">
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setMostrarSelectorCobro(true)} className="text-[13px] font-medium text-primary">
                    Elegir el cobro...
                  </button>
                )}
              </div>
            )}
            {modo === 'deuda_existente' && (
              <div className="mt-2">
                {deudaSeleccionada ? (
                  <div className="flex items-center justify-between rounded-md border border-border bg-surface p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatearFecha(deudaSeleccionada.fecha)} · {formatearMoneda(deudaSeleccionada.monto)}
                      </p>
                      <p className="text-xs text-muted-foreground">{deudaSeleccionada.descripcion}</p>
                    </div>
                    <button type="button" onClick={() => setMostrarSelectorDeuda(true)} className="text-xs font-medium text-primary">
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setMostrarSelectorDeuda(true)} className="text-[13px] font-medium text-primary">
                    Elegir la deuda...
                  </button>
                )}
              </div>
            )}
            {errorModo && <p className="mt-2 text-xs text-error">{errorModo}</p>}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Líneas</p>
            <div className="space-y-3">
              {valores.items.map((item, indice) => {
                const erroresLinea = errores.porLinea[item.idLocal] ?? {}
                return (
                  <Card key={item.idLocal} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Línea {indice + 1}
                      </span>
                      {valores.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => quitarLinea(item.idLocal)}
                          aria-label="Quitar línea"
                          className="text-muted-foreground hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <TextField
                          label="Descripción"
                          value={item.descripcion}
                          onChange={(e) => actualizarLinea(item.idLocal, { descripcion: e.target.value, producto_id: null })}
                          error={mostrarErrores ? erroresLinea.descripcion : undefined}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setLineaEligiendoProducto(item.idLocal)}
                        aria-label="Elegir producto del catálogo"
                        title="Elegir producto del catálogo"
                        className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-border-strong"
                      >
                        <Search className="h-[18px] w-[18px]" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <TextField
                        label="Cantidad"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.cantidad ?? ''}
                        onChange={(e) => actualizarLinea(item.idLocal, { cantidad: e.target.value === '' ? null : Number(e.target.value) })}
                        error={mostrarErrores ? erroresLinea.cantidad : undefined}
                      />
                      <CurrencyField
                        label="Precio unitario"
                        value={item.precio_unitario}
                        onValueChange={(v) => actualizarLinea(item.idLocal, { precio_unitario: v })}
                        error={mostrarErrores ? erroresLinea.precio_unitario : undefined}
                      />
                      <div className="grid gap-1.5 text-sm">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subtotal</span>
                        <div className="flex h-11 items-center justify-end rounded-md bg-muted px-3 text-sm font-medium tabular-nums text-foreground">
                          {formatearMoneda(subtotalLinea(item))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <button
              type="button"
              onClick={agregarLinea}
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <Plus className="h-4 w-4" />
              Agregar línea
            </button>
            {mostrarErrores && errores.items && <p className="mt-2 text-xs text-error">{errores.items}</p>}
          </div>

          <CampoTextoLargo label="Nota (opcional)" value={valores.nota} onChange={(e) => actualizar('nota', e.target.value)} />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 space-y-1 lg:mx-auto lg:w-full lg:max-w-2xl">
            {valores.iva !== 'exento' && (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Neto</span>
                  <span className="tabular-nums">{formatearMoneda(calcularNetoEIva(total, valores.iva).neto)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>IVA ({ETIQUETAS_IVA[valores.iva]})</span>
                  <span className="tabular-nums">{formatearMoneda(calcularNetoEIva(total, valores.iva).importeIva)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-xl font-semibold tabular-nums text-foreground">{formatearMoneda(total)}</span>
            </div>
          </div>
          <div className="flex gap-2 lg:mx-auto lg:w-full lg:max-w-2xl">
            <Button accion="cancelar" type="button" className="flex-1" onClick={() => navigate(-1)} disabled={registrar.isPending}>
              Cancelar
            </Button>
            <Button accion="guardar" type="submit" className="flex-1" disabled={registrar.isPending}>
              {registrar.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>

      <SelectorEntidadDialog
        abierto={lineaEligiendoProducto !== null}
        onOpenChange={(abierto) => !abierto && setLineaEligiendoProducto(null)}
        titulo="Elegí un producto"
        items={itemsProductoSelector}
        onSeleccionar={manejarElegirProducto}
        placeholderBusqueda="Buscar por nombre o código..."
      />

      <SeleccionarCobroDialog
        clienteId={clienteId}
        abierto={mostrarSelectorCobro}
        onOpenChange={setMostrarSelectorCobro}
        onSeleccionar={manejarSeleccionCobro}
      />

      <SeleccionarDeudaDialog
        clienteId={clienteId}
        abierto={mostrarSelectorDeuda}
        onOpenChange={setMostrarSelectorDeuda}
        onSeleccionar={manejarSeleccionDeuda}
      />
    </div>
  )
}

/** Cuando se entra a Nueva factura sin un cliente ya elegido (sin query param) — se pide elegir uno antes de mostrar el formulario. */
function SelectorClienteInicial({
  abierto,
  onSeleccionar,
  onCancelar
}: {
  abierto: boolean
  onSeleccionar: (item: ItemSelectorEntidad) => void
  onCancelar: () => void
}) {
  const { data: clientes, isLoading } = useClientes()
  const items: ItemSelectorEntidad[] = (clientes ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre_apellido,
    subtitulo: c.razon_social ?? undefined
  }))

  return (
    <SelectorEntidadDialog
      abierto={abierto}
      onOpenChange={(nuevoAbierto) => !nuevoAbierto && onCancelar()}
      titulo="Elegí un cliente"
      items={items}
      onSeleccionar={onSeleccionar}
      cargando={isLoading}
      placeholderBusqueda="Buscar clientes..."
    />
  )
}
