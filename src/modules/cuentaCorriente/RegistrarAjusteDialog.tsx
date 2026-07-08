import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CurrencyField } from '@/core/components/CurrencyField'
import { DateField } from '@/core/components/DateField'
import { CampoTextoLargo } from '@/core/components/FormBlock'
import { Button } from '@/core/components/Button'
import { cn, LABEL_CAMPO } from '@/core/lib/utils'
import { useToast } from '@/core/hooks/useToast'
import { useRegistrarAjuste } from './api'
import { validarAjuste, hayErrores, hoyISO } from './validaciones'
import { valoresAjusteVacio, type AjusteFormValues, type TipoEntidadCC } from './types'

export interface RegistrarAjusteDialogProps {
  tipo: TipoEntidadCC
  entidadId: string
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  /** Terminología específica de cada módulo (decisión aprobada 6.2/6.4-diseño) — este componente no sabe nada de clientes/proveedores. */
  etiquetaAumenta: string // ej. "Aumenta lo que debe" (Clientes) / "Aumenta lo que le debemos" (Proveedores)
  etiquetaReduce: string  // ej. "Reduce lo que debe" / "Reduce lo que le debemos"
  /** Se dispara además de onOpenChange(false), solo cuando el guardado fue exitoso — ver docs/sistemas/reorganizacion-flujo-operativo.md. */
  onGuardado?: () => void
}

/**
 * Registrar ajuste — el único formulario del sistema de Cuenta Corriente
 * que es de verdad el mismo componente para Clientes y Proveedores (ver
 * docs/sistemas/cuenta-corriente-arquitectura-compartida.md). El importe
 * se captura como un valor absoluto + un signo elegido explícitamente
 * (más fácil de tipear y de leer que pedirle al usuario que escriba "-"
 * a mano), y se combinan recién al guardar.
 */
export function RegistrarAjusteDialog({
  tipo,
  entidadId,
  abierto,
  onOpenChange,
  etiquetaAumenta,
  etiquetaReduce,
  onGuardado
}: RegistrarAjusteDialogProps) {
  const toast = useToast()
  const registrar = useRegistrarAjuste(tipo, entidadId)

  const [valores, setValores] = React.useState<AjusteFormValues>(() => valoresAjusteVacio(hoyISO()))
  const [montoAbsoluto, setMontoAbsoluto] = React.useState<number | null>(null)
  const [signo, setSigno] = React.useState<1 | -1>(1)
  const [errores, setErrores] = React.useState<ReturnType<typeof validarAjuste>>({})

  React.useEffect(() => {
    if (abierto) {
      setValores(valoresAjusteVacio(hoyISO()))
      setMontoAbsoluto(null)
      setSigno(1)
      setErrores({})
    }
  }, [abierto])

  function actualizar<K extends keyof AjusteFormValues>(campo: K, valor: AjusteFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoConSigno = montoAbsoluto === null ? null : montoAbsoluto * signo
    const valoresFinales = { ...valores, monto: montoConSigno }
    const erroresValidacion = validarAjuste(valoresFinales)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

    registrar.mutate(valoresFinales, {
      onSuccess: () => {
        toast.exito('Ajuste registrado')
        onOpenChange(false)
        onGuardado?.()
      },
      onError: () => toast.error('No se pudo registrar el ajuste')
    })
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Registrar ajuste</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-1.5 text-sm">
              <span className={LABEL_CAMPO}>Tipo de ajuste</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSigno(1)}
                  className={cn(
                    'rounded-md border px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                    signo === 1 ? 'border-error bg-error/10 text-error' : 'border-border text-muted-foreground'
                  )}
                >
                  {etiquetaAumenta}
                </button>
                <button
                  type="button"
                  onClick={() => setSigno(-1)}
                  className={cn(
                    'rounded-md border px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                    signo === -1 ? 'border-exito bg-exito/10 text-exito' : 'border-border text-muted-foreground'
                  )}
                >
                  {etiquetaReduce}
                </button>
              </div>
            </div>

            <CurrencyField
              label="Importe"
              value={montoAbsoluto}
              onValueChange={setMontoAbsoluto}
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
            <CampoTextoLargo
              label="Motivo"
              value={valores.motivo}
              onChange={(e) => actualizar('motivo', e.target.value)}
              disabled={registrar.isPending}
              required
            />
            {errores.motivo && <p className="-mt-3 text-xs text-error">{errores.motivo}</p>}

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
