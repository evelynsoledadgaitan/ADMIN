import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CurrencyField } from '@/core/components/CurrencyField'
import { DateField } from '@/core/components/DateField'
import { Select } from '@/core/components/Select'
import { TextField } from '@/core/components/TextField'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { Button } from '@/core/components/Button'
import { formatearMoneda } from '@/core/lib/format'
import { useToast } from '@/core/hooks/useToast'
import { useMediosPago } from '@/modules/pagos/api'
import { useRegistrarPagoEmpleado } from './api'
import { hoyISO, validarPagoEmpleado, hayErrores } from './validaciones'
import { valoresPagoEmpleadoVacio, montoFinalPago, type PagoEmpleadoFormValues, type TipoPagoEmpleado } from './types'

export interface RegistrarPagoEmpleadoDialogProps {
  empleadoId: string
  tipo: TipoPagoEmpleado
  /** Nombre de la modalidad de pago del empleado (catálogo `modalidades_pago_empleado`) — determina si se precarga el monto o se pide "Horas trabajadas". */
  nombreModalidad: string | undefined
  /** `valor` del empleado — por hora o importe fijo, según `nombreModalidad`. */
  valorAcordado: number | null
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
}

const TITULOS: Record<TipoPagoEmpleado, string> = { pago: 'Registrar pago', adelanto: 'Registrar adelanto' }
const MENSAJES_EXITO: Record<TipoPagoEmpleado, string> = { pago: 'Pago registrado', adelanto: 'Adelanto registrado' }

/**
 * Registrar pago / adelanto — parametrizado por `tipo` (mismo criterio
 * que RegistrarMovimientoDialog). Tres comportamientos nuevos, pedidos
 * después de la primera entrega:
 *
 * 1. Si la modalidad es "Importe fijo" y es un Pago (no un adelanto — un
 *    adelanto no tiene por qué coincidir con el fijo), el monto arranca
 *    precargado con el valor acordado del empleado, editable igual.
 * 2. Si la modalidad es "Por hora", se pide "Horas trabajadas" y el
 *    monto se sugiere solo (horas × valor/hora) — sigue siendo editable,
 *    el dato que se guarda es siempre el monto final, nunca las horas.
 * 3. Descuento opcional dentro del mismo pago (ej. mercadería consumida
 *    esa semana) — un ajuste de una sola vez, sin ningún saldo que se
 *    arrastre entre pagos (confirmado explícitamente: no es una cuenta
 *    corriente de empleados). El monto que se guarda ya es el neto
 *    (bruto − descuento); el motivo es obligatorio en cuanto hay descuento.
 */
export function RegistrarPagoEmpleadoDialog({
  empleadoId,
  tipo,
  nombreModalidad,
  valorAcordado,
  abierto,
  onOpenChange
}: RegistrarPagoEmpleadoDialogProps) {
  const toast = useToast()
  const { data: mediosPago, isLoading: cargandoMedios } = useMediosPago()
  const registrar = useRegistrarPagoEmpleado(empleadoId, tipo)

  const esPorHora = nombreModalidad === 'Por hora'
  const esImporteFijo = nombreModalidad === 'Importe fijo'

  const [valores, setValores] = React.useState<PagoEmpleadoFormValues>(() => valoresPagoEmpleadoVacio(hoyISO()))
  const [archivo, setArchivo] = React.useState<File | null>(null)
  const [aplicarDescuento, setAplicarDescuento] = React.useState(false)
  const [errores, setErrores] = React.useState<ReturnType<typeof validarPagoEmpleado>>({})

  React.useEffect(() => {
    if (!abierto) return
    const vacios = valoresPagoEmpleadoVacio(hoyISO())
    // Punto 1: precarga el importe fijo, solo para Pago (un adelanto no tiene por qué ser ese monto).
    if (tipo === 'pago' && esImporteFijo && valorAcordado !== null) {
      vacios.monto = valorAcordado
    }
    setValores(vacios)
    setArchivo(null)
    setAplicarDescuento(false)
    setErrores({})
  }, [abierto, tipo, esImporteFijo, valorAcordado])

  function actualizar<K extends keyof PagoEmpleadoFormValues>(campo: K, valor: PagoEmpleadoFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  // Punto 2: horas × valor/hora sugiere el monto — sigue editable después.
  function actualizarHoras(horas: number | null) {
    setValores((actuales) => ({
      ...actuales,
      horas,
      monto: horas !== null && valorAcordado !== null ? horas * valorAcordado : actuales.monto
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valoresAValidar = aplicarDescuento ? valores : { ...valores, descuento: null, motivoDescuento: '' }
    const erroresValidacion = validarPagoEmpleado(valoresAValidar)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

    registrar.mutate(
      { valores: valoresAValidar, archivo },
      {
        onSuccess: () => {
          toast.exito(MENSAJES_EXITO[tipo])
          onOpenChange(false)
        },
        onError: () => toast.error(`No se pudo registrar el ${tipo === 'pago' ? 'pago' : 'adelanto'}`)
      }
    )
  }

  const montoFinal = aplicarDescuento ? montoFinalPago(valores) : valores.monto

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">{TITULOS[tipo]}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tipo === 'pago' && esPorHora && (
              <TextField
                label="Horas trabajadas"
                type="number"
                step="0.5"
                min="0"
                value={valores.horas ?? ''}
                onChange={(e) => actualizarHoras(e.target.value === '' ? null : Number(e.target.value))}
                disabled={registrar.isPending}
              />
            )}

            <CurrencyField
              label={aplicarDescuento ? 'Monto (antes del descuento)' : 'Monto'}
              value={valores.monto}
              onValueChange={(v) => actualizar('monto', v)}
              error={errores.monto}
              disabled={registrar.isPending}
            />

            {!aplicarDescuento ? (
              <button
                type="button"
                onClick={() => setAplicarDescuento(true)}
                className="text-[13px] font-medium text-primary"
              >
                + Aplicar un descuento
              </button>
            ) : (
              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descuento</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAplicarDescuento(false)
                      actualizar('descuento', null)
                      actualizar('motivoDescuento', '')
                    }}
                    className="text-xs font-medium text-error"
                  >
                    Quitar
                  </button>
                </div>
                <CurrencyField
                  label="Importe del descuento"
                  value={valores.descuento}
                  onValueChange={(v) => actualizar('descuento', v)}
                  error={errores.descuento}
                  disabled={registrar.isPending}
                />
                <TextField
                  label="Motivo del descuento"
                  value={valores.motivoDescuento}
                  onChange={(e) => actualizar('motivoDescuento', e.target.value)}
                  error={errores.motivoDescuento}
                  disabled={registrar.isPending}
                />
                {montoFinal !== null && (
                  <p className="text-sm text-foreground">
                    Se registra como <span className="font-semibold">{formatearMoneda(montoFinal)}</span>
                  </p>
                )}
              </div>
            )}

            <DateField
              label="Fecha"
              value={valores.fecha}
              max={hoyISO()}
              onChange={(e) => actualizar('fecha', e.target.value)}
              error={errores.fecha}
              disabled={registrar.isPending}
            />
            <TextField
              label="Concepto"
              value={valores.concepto}
              onChange={(e) => actualizar('concepto', e.target.value)}
              error={errores.concepto}
              disabled={registrar.isPending}
            />
            <Select
              label="Medio de pago (opcional)"
              value={valores.medio_pago_id || undefined}
              onValueChange={(v) => actualizar('medio_pago_id', v)}
              opciones={(mediosPago ?? []).map((m) => ({ value: m.id, label: m.nombre }))}
              disabled={registrar.isPending || cargandoMedios}
              placeholder={cargandoMedios ? 'Cargando...' : 'Seleccionar...'}
            />
            <TextField
              label="Número de comprobante (opcional)"
              value={valores.numero_comprobante}
              onChange={(e) => actualizar('numero_comprobante', e.target.value)}
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
    </Dialog.Root>
  )
}
