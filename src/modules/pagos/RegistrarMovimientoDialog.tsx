import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CurrencyField } from '@/core/components/CurrencyField'
import { DateField } from '@/core/components/DateField'
import { Select } from '@/core/components/Select'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { useToast } from '@/core/hooks/useToast'
import { useMediosPago, useRegistrarMovimiento } from './api'
import { validarMovimiento, hayErrores, hoyISO, type ErroresMovimiento } from './validaciones'
import { valoresMovimientoVacio, type MovimientoFormValues, type TipoMovimiento } from './types'

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
 * Ver docs/sistemas/motor-de-pagos-arquitectura.md, sección 8.
 */
export function RegistrarMovimientoDialog({ tipo, entidadId, abierto, onOpenChange, onGuardado }: RegistrarMovimientoDialogProps) {
  const toast = useToast()
  const { data: mediosPago, isLoading: cargandoMedios } = useMediosPago()
  const registrar = useRegistrarMovimiento(tipo, entidadId)

  const [valores, setValores] = React.useState<MovimientoFormValues>(() => valoresMovimientoVacio(hoyISO()))
  const [errores, setErrores] = React.useState<ErroresMovimiento>({})
  const [archivo, setArchivo] = React.useState<File | null>(null)

  React.useEffect(() => {
    if (abierto) {
      setValores(valoresMovimientoVacio(hoyISO()))
      setErrores({})
      setArchivo(null)
    }
  }, [abierto])

  function actualizar<K extends keyof MovimientoFormValues>(campo: K, valor: MovimientoFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarMovimiento(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

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

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg border-t border-border bg-surface p-5 shadow-lg animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">{TITULOS[tipo]}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <CurrencyField
              label="Monto"
              value={valores.monto}
              onValueChange={(v) => actualizar('monto', v)}
              error={errores.monto}
              disabled={registrar.isPending}
            />
            <DateField
              label="Fecha"
              value={valores.fecha}
              max={hoyISO()}
              onChange={(e) => actualizar('fecha', e.target.value)}
              error={errores.fecha}
              disabled={registrar.isPending}
            />
            <Select
              label="Medio de pago"
              value={valores.medio_pago_id || undefined}
              onValueChange={(v) => actualizar('medio_pago_id', v)}
              opciones={(mediosPago ?? []).map((m) => ({ value: m.id, label: m.nombre }))}
              disabled={registrar.isPending || cargandoMedios}
              placeholder={cargandoMedios ? 'Cargando...' : 'Seleccionar...'}
            />
            {errores.medio_pago_id && <p className="-mt-3 text-xs text-error">{errores.medio_pago_id}</p>}
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
    </Dialog.Root>
  )
}
