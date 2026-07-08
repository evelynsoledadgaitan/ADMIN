import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CurrencyField } from '@/core/components/CurrencyField'
import { DateField } from '@/core/components/DateField'
import { TextField } from '@/core/components/TextField'
import { Select } from '@/core/components/Select'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { useToast } from '@/core/hooks/useToast'
import { useRegistrarVencimiento } from './api'
import { hoyISO, validarVencimiento, hayErrores } from './validaciones'
import { valoresVencimientoVacio, ETIQUETAS_TIPO, type VencimientoFormValues, type TipoObligacion } from './types'

const OPCIONES_TIPO = Object.entries(ETIQUETAS_TIPO).map(([value, label]) => ({ value, label }))

export interface RegistrarVencimientoDialogProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
}

/** Alta de un vencimiento — un solo paso, mismo criterio que Registrar deuda/ingreso/movimiento (Motor de Pagos). */
export function RegistrarVencimientoDialog({ abierto, onOpenChange }: RegistrarVencimientoDialogProps) {
  const toast = useToast()
  const registrar = useRegistrarVencimiento()

  const [valores, setValores] = React.useState<VencimientoFormValues>(() => valoresVencimientoVacio(hoyISO()))
  const [errores, setErrores] = React.useState<ReturnType<typeof validarVencimiento>>({})

  React.useEffect(() => {
    if (abierto) {
      setValores(valoresVencimientoVacio(hoyISO()))
      setErrores({})
    }
  }, [abierto])

  function actualizar<K extends keyof VencimientoFormValues>(campo: K, valor: VencimientoFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarVencimiento(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

    registrar.mutate(valores, {
      onSuccess: () => {
        toast.exito('Vencimiento registrado')
        onOpenChange(false)
      },
      onError: () => toast.error('No se pudo registrar el vencimiento')
    })
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Nuevo vencimiento</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Tipo"
              value={valores.tipo}
              onValueChange={(v) => actualizar('tipo', v as TipoObligacion)}
              opciones={OPCIONES_TIPO}
              disabled={registrar.isPending}
            />
            <TextField
              label="Concepto"
              value={valores.concepto}
              onChange={(e) => actualizar('concepto', e.target.value)}
              error={errores.concepto}
              disabled={registrar.isPending}
              autoFocus
            />
            <CurrencyField
              label="Monto (opcional)"
              value={valores.monto}
              onValueChange={(v) => actualizar('monto', v)}
              error={errores.monto}
              disabled={registrar.isPending}
            />
            <DateField
              label="Fecha de vencimiento"
              value={valores.fecha_vencimiento}
              onChange={(e) => actualizar('fecha_vencimiento', e.target.value)}
              error={errores.fecha_vencimiento}
              disabled={registrar.isPending}
            />
            <CampoTextoLargo
              label="Observaciones (opcional)"
              value={valores.nota}
              onChange={(e) => actualizar('nota', e.target.value)}
              disabled={registrar.isPending}
            />

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
