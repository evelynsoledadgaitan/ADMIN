import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, Trash2 } from 'lucide-react'
import { CurrencyField } from '@/core/components/CurrencyField'
import { DateField } from '@/core/components/DateField'
import { Select } from '@/core/components/Select'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { useToast } from '@/core/hooks/useToast'
import { formatearMoneda } from '@/core/lib/format'
import { useMediosPago, useIdMedioPagoCheque, useRegistrarMovimiento } from './api'
import { validarMovimientoCompuesto, hayErroresMovimiento, hoyISO } from './validaciones'
import { valoresMovimientoCompuestoVacio, nuevaLineaMovimientoVacia, totalMovimientoCompuesto, type MovimientoCompuestoFormValues, type TipoMovimiento } from './types'
import { SeleccionarChequeDialog } from '@/modules/cheques/SeleccionarChequeDialog'
import type { Cheque } from '@/modules/cheques/types'

const TITULOS: Record<TipoMovimiento, string> = { cobro: 'Registrar cobro', pago: 'Registrar pago' }

export interface RegistrarMovimientoDialogProps {
  tipo: TipoMovimiento
  entidadId: string
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  /** Se dispara además de onOpenChange(false), solo cuando el guardado fue exitoso — ver docs/sistemas/reorganizacion-flujo-operativo.md. */
  onGuardado?: () => void
}

/**
 * Formulario de Registrar cobro/pago — componente único del Motor de
 * Pagos, consumido por Clientes (tipo="cobro") y Proveedores (tipo="pago").
 * Admite varias líneas, cada una con su propio medio de pago (decisión
 * aprobada — ver docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md),
 * mismo criterio visual que las líneas de una factura. Cuando una línea
 * usa "Cheque" como medio, el monto no se tipea — se completa solo al
 * elegir el cheque de la cartera.
 */
export function RegistrarMovimientoDialog({ tipo, entidadId, abierto, onOpenChange, onGuardado }: RegistrarMovimientoDialogProps) {
  const toast = useToast()
  const { data: mediosPago, isLoading: cargandoMedios } = useMediosPago()
  const idMedioPagoCheque = useIdMedioPagoCheque()
  const registrar = useRegistrarMovimiento(tipo, entidadId)

  const [valores, setValores] = React.useState<MovimientoCompuestoFormValues>(() => valoresMovimientoCompuestoVacio(hoyISO()))
  const [errores, setErrores] = React.useState<ReturnType<typeof validarMovimientoCompuesto>>({ porLinea: {} })
  const [archivo, setArchivo] = React.useState<File | null>(null)
  const [lineaEligiendoCheque, setLineaEligiendoCheque] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (abierto) {
      setValores(valoresMovimientoCompuestoVacio(hoyISO()))
      setErrores({ porLinea: {} })
      setArchivo(null)
    }
  }, [abierto])

  function actualizar<K extends keyof MovimientoCompuestoFormValues>(campo: K, valor: MovimientoCompuestoFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function actualizarLinea(idLocal: string, cambios: Partial<MovimientoCompuestoFormValues['lineas'][number]>) {
    setValores((actuales) => ({
      ...actuales,
      lineas: actuales.lineas.map((l) => (l.idLocal === idLocal ? { ...l, ...cambios } : l))
    }))
  }

  function agregarLinea() {
    setValores((actuales) => ({ ...actuales, lineas: [...actuales.lineas, nuevaLineaMovimientoVacia()] }))
  }

  function quitarLinea(idLocal: string) {
    setValores((actuales) => ({ ...actuales, lineas: actuales.lineas.filter((l) => l.idLocal !== idLocal) }))
  }

  function manejarElegirMedio(idLocal: string, medioPagoId: string) {
    // Cambiar de medio siempre limpia el monto y el cheque elegido antes —
    // evita que quede un monto viejo de un medio distinto.
    actualizarLinea(idLocal, { medio_pago_id: medioPagoId, cheque_id: null, monto: null })
    if (medioPagoId === idMedioPagoCheque) {
      setLineaEligiendoCheque(idLocal)
    }
  }

  function manejarSeleccionCheque(cheque: Cheque) {
    if (!lineaEligiendoCheque) return
    actualizarLinea(lineaEligiendoCheque, { cheque_id: cheque.id, monto: cheque.importe })
    setLineaEligiendoCheque(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarMovimientoCompuesto(valores, idMedioPagoCheque)
    setErrores(erroresValidacion)
    if (hayErroresMovimiento(erroresValidacion)) return

    registrar.mutate(
      { valores, archivo },
      {
        onSuccess: () => {
          toast.exito(tipo === 'cobro' ? 'Cobro registrado' : 'Pago registrado')
          onOpenChange(false)
          onGuardado?.()
        },
        onError: () => toast.error(tipo === 'cobro' ? 'No se pudo registrar el cobro' : 'No se pudo registrar el pago')
      }
    )
  }

  const total = totalMovimientoCompuesto(valores.lineas)

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-y-auto rounded-t-lg border-t border-border bg-surface p-5 shadow-lg animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">{TITULOS[tipo]}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <DateField
              label="Fecha"
              value={valores.fecha}
              max={hoyISO()}
              onChange={(e) => actualizar('fecha', e.target.value)}
              error={errores.fecha}
              disabled={registrar.isPending}
            />

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Medios de pago</p>
              <div className="space-y-3">
                {valores.lineas.map((linea, indice) => {
                  const erroresLinea = errores.porLinea[linea.idLocal] ?? {}
                  const esCheque = linea.medio_pago_id === idMedioPagoCheque
                  return (
                    <div key={linea.idLocal} className="rounded-md border border-border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Línea {indice + 1}</span>
                        {valores.lineas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => quitarLinea(linea.idLocal)}
                            aria-label="Quitar línea"
                            className="text-muted-foreground hover:text-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Select
                          label="Medio de pago"
                          value={linea.medio_pago_id || undefined}
                          onValueChange={(v) => manejarElegirMedio(linea.idLocal, v)}
                          opciones={(mediosPago ?? []).map((m) => ({ value: m.id, label: m.nombre }))}
                          disabled={registrar.isPending || cargandoMedios}
                          placeholder={cargandoMedios ? 'Cargando...' : 'Seleccionar...'}
                        />
                        {erroresLinea.medio_pago_id && <p className="text-xs text-error">{erroresLinea.medio_pago_id}</p>}

                        {esCheque ? (
                          <div>
                            {linea.cheque_id ? (
                              <button
                                type="button"
                                onClick={() => setLineaEligiendoCheque(linea.idLocal)}
                                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                              >
                                <span>{formatearMoneda(linea.monto ?? 0)}</span>
                                <span className="text-xs font-medium text-primary">Cambiar cheque</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setLineaEligiendoCheque(linea.idLocal)}
                                className="text-[13px] font-medium text-primary"
                              >
                                Elegir cheque de la cartera...
                              </button>
                            )}
                            {erroresLinea.monto && <p className="mt-1 text-xs text-error">{erroresLinea.monto}</p>}
                          </div>
                        ) : (
                          <CurrencyField
                            label="Monto"
                            value={linea.monto}
                            onValueChange={(v) => actualizarLinea(linea.idLocal, { monto: v })}
                            error={erroresLinea.monto}
                            disabled={registrar.isPending}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={agregarLinea}
                className="mt-2 flex items-center gap-1 text-[13px] font-medium text-primary"
                disabled={registrar.isPending}
              >
                <Plus className="h-4 w-4" />
                Agregar otro medio de pago
              </button>
            </div>

            {valores.lineas.length > 1 && (
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-base font-semibold tabular-nums text-foreground">{formatearMoneda(total)}</span>
              </div>
            )}

            <CampoTextoLargo
              label="Nota (opcional)"
              value={valores.nota}
              onChange={(e) => actualizar('nota', e.target.value)}
              disabled={registrar.isPending}
            />
            <ArchivoAdjunto value={archivo} onChange={setArchivo} disabled={registrar.isPending} />

            <div className="flex gap-2 pt-2">
              <Dialog.Close asChild>
                <Button accion="cancelar" type="button" className="flex-1" disabled={registrar.isPending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button accion="guardar" type="submit" className="flex-1" disabled={registrar.isPending}>
                {registrar.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>

      <SeleccionarChequeDialog
        tipo={tipo}
        abierto={lineaEligiendoCheque !== null}
        onOpenChange={(a) => !a && setLineaEligiendoCheque(null)}
        onSeleccionar={manejarSeleccionCheque}
      />
    </Dialog.Root>
  )
}
